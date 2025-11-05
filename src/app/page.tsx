"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { getFromIndexedDB, setToIndexedDB } from '@/lib/indexeddb';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


const GITHUB_APP_NAME = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;

/**
 * Represents an article from esa.io.
 */
interface EsaArticle {
  name: string;
  url: string;
  body_md: string;
}

/**
 * Helper function to format a Date object into a YYYY-MM-DD string.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Helper function to get all dates in the week of a given date (Monday to Sunday).
 * @param {Date} date - The date to get the week of.
 * @returns {string[]} An array of formatted date strings (YYYY-MM-DD) for the week.
 */
const getDatesInWeek = (date: Date) => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1)); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
};

/**
 * Helper function to group work times by day.
 * @param {object[]} workTimes - An array of work time objects.
 * @param {Date} workTimes.start - The start time.
 * @param {Date | null} workTimes.end - The end time.
 * @param {string} workTimes.memo - The memo.
 * @returns {object} An object with dates as keys and arrays of work time objects as values.
 */
const groupWorkTimesByDay = (workTimes: { start: Date; end: Date | null; memo: string }[]) => {
  const grouped: { [key: string]: { start: Date; end: Date | null; memo: string }[] } = {};
  workTimes.forEach(wt => {
    const date = formatDate(wt.start);
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(wt);
  });
  return grouped;
};

/**
 * The main page of the application.
 * It allows users to generate reports based on their GitHub commit history and work time.
 * @returns {React.ReactElement} The home page.
 */
export default function Home() {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.error) {
      alert(`Authentication Error: ${session.error}`);
      signOut(); // Force sign out to clear the session
    }
  }, [session]);
  const [commitHistory, setCommitHistory] = useState('コミット履歴を読み込み中...');
  const [generatedText, setGeneratedText] = useState('');
  const [reportType, setReportType] = useState('daily'); // 'daily' or 'meeting'
  const [model, setModel] = useState('gemini-2.5-flash');
  const [activeTab, setActiveTab] = useState('commits');
  const [esaArticles, setEsaArticles] = useState<EsaArticle[]>([]);
  const [isLoadingEsa, setIsLoadingEsa] = useState(false);
  const [esaUser, setEsaUser] = useState('shirashoji');
  const [targetDate, setTargetDate] = useState(new Date());
  const [workTimes, setWorkTimes] = useState<{ start: Date; end: Date | null; memo: string }[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [currentMemo, setCurrentMemo] = useState('');
  const [editingWorkTimeIndex, setEditingWorkTimeIndex] = useState<number | null>(null);
  const [lastMeetingUrl, setLastMeetingUrl] = useState('');
  const [meetingCandidates, setMeetingCandidates] = useState<{ name: string, url: string }[]>([]);

  // GitHub state
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('all');



  // 作業開始処理
  const handleStartWork = () => {
    setWorkTimes([...workTimes, { start: new Date(), end: null, memo: '' }]);
    setIsWorking(true);
  };

  // 作業終了処理
  const handleEndWork = () => {
    const newWorkTimes = [...workTimes];
    const lastWorkTime = newWorkTimes[newWorkTimes.length - 1];
    if (lastWorkTime && lastWorkTime.end === null) {
      lastWorkTime.end = new Date();
      lastWorkTime.memo = currentMemo;

      // 作業時間が0分より大きい場合のみ記録
      if (calculateWorkDuration(lastWorkTime.start, lastWorkTime.end) > 0) {
        setWorkTimes(newWorkTimes);
      } else {
        // 0分以下の場合は最後の作業記録を削除
        newWorkTimes.pop();
        setWorkTimes(newWorkTimes);
      }
      setIsWorking(false);
      setCurrentMemo(''); // メモをリセット
    }
  };

  // 作業時間をフォーマットするヘルパー関数
  const formatWorkTime = (time: Date) => {
    return time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  // 作業時間（分）を計算するヘルパー関数
  const calculateWorkDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    return Math.round(diff / (1000 * 60));
  };

  // 1日の合計作業時間（分）を計算するヘルパー関数
  const calculateTotalWorkDuration = (workTimes: { start: Date; end: Date | null }[]) => {
    return workTimes
      .filter(wt => wt.end) // 終了時刻があるもののみ
      .reduce((total, wt) => {
        // wt.endがnullでないことを確認済み
        return total + calculateWorkDuration(wt.start, wt.end!);
      }, 0);
  };

  const handleEditWorkTime = (index: number) => {
    setEditingWorkTimeIndex(index);
  };

  const handleSaveWorkTime = (index: number, newStart: string, newEnd: string) => {
    const newWorkTimes = [...workTimes];
    const targetWorkTime = newWorkTimes[index];

    const startDate = new Date(targetWorkTime.start);
    const [startHours, startMinutes] = newStart.split(':').map(Number);
    startDate.setHours(startHours, startMinutes);

    let endDate: Date | null = null;
    if (targetWorkTime.end) {
      endDate = new Date(targetWorkTime.end);
      const [endHours, endMinutes] = newEnd.split(':').map(Number);
      endDate.setHours(endHours, endMinutes);
    }

    // 日付をまたぐ場合の考慮（終了が開始より早い場合は翌日にする）
    if (endDate && endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    newWorkTimes[index] = { start: startDate, end: endDate, memo: targetWorkTime.memo };
    setWorkTimes(newWorkTimes);
    setEditingWorkTimeIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingWorkTimeIndex(null);
  };

  const handleDeleteWorkTime = (index: number) => {
    if (window.confirm('この作業記録を削除しますか？')) {
      const newWorkTimes = workTimes.filter((_, i) => i !== index);
      setWorkTimes(newWorkTimes);
    }
  };

  // localStorageから永続化されたデータを読み込む
  useEffect(() => {
    const loadData = async () => {
      const savedUser = localStorage.getItem('esaUser');
      if (savedUser) {
        setEsaUser(savedUser);
      }
      const savedModel = localStorage.getItem('geminiModel');
      if (savedModel) {
        setModel(savedModel);
      }
      const savedGithubOwner = localStorage.getItem('githubOwner');
      if (savedGithubOwner) {
        setGithubOwner(savedGithubOwner);
      }
      const savedGithubRepo = localStorage.getItem('githubRepo');
      if (savedGithubRepo) {
        setGithubRepo(savedGithubRepo);
      }

      // localStorageからworkTimesを読み込む
      const savedWorkTimesJson = localStorage.getItem('workTimes');
      if (savedWorkTimesJson) {
        try {
          const parsedWorkTimes = JSON.parse(savedWorkTimesJson).map((wt: { start: string; end: string | null; memo: string }) => ({
            start: new Date(wt.start),
            end: wt.end ? new Date(wt.end) : null,
            memo: wt.memo || '',
          }));
          setWorkTimes(parsedWorkTimes);
          const lastWorkTime = parsedWorkTimes[parsedWorkTimes.length - 1];
          if (lastWorkTime && lastWorkTime.end === null) {
            setIsWorking(true);
          }
          return; // localStorageから読み込めたらIndexedDBは読み込まない
        } catch (error) {
          console.error("Error parsing workTimes from localStorage:", error);
          // パースエラーの場合はIndexedDBから読み込みを試みる
        }
      }

      // localStorageにない場合、IndexedDBから読み込む
      try {
        const savedWorkTimes = await getFromIndexedDB<any[]>('workTimes');
        if (savedWorkTimes) {
          const parsedWorkTimes = savedWorkTimes.map((wt: { start: string; end: string | null; memo: string }) => ({
            start: new Date(wt.start),
            end: wt.end ? new Date(wt.end) : null,
            memo: wt.memo || '',
          }));
          setWorkTimes(parsedWorkTimes);

          const lastWorkTime = parsedWorkTimes[parsedWorkTimes.length - 1];
          if (lastWorkTime && lastWorkTime.end === null) {
            setIsWorking(true);
          }
        }
      } catch (error) {
        console.error("Error loading workTimes from IndexedDB:", error);
        setWorkTimes([]);
      }
    };
    loadData();
  }, []);

  // workTimesが変更されたらIndexedDBに保存
  useEffect(() => {
    const saveWorkTimes = async () => {
      try {
        // localStorageに保存
        localStorage.setItem('workTimes', JSON.stringify(workTimes));
        // IndexedDBに保存（バックアップ）
        await setToIndexedDB('workTimes', workTimes);
      } catch (error) {
        console.error("Error saving workTimes:", error);
      }
    };
    saveWorkTimes();
  }, [workTimes]);

  // ユーザー名をlocalStorageに保存するカスタムセッター
  const handleSetEsaUser = (user: string) => {
    setEsaUser(user);
    localStorage.setItem('esaUser', user);
  };

  // モデル名をlocalStorageに保存するカスタムセッター
  const handleSetModel = (modelName: string) => {
    setModel(modelName);
    localStorage.setItem('geminiModel', modelName);
  };

  const handleSetGithubOwner = (owner: string) => {
    setGithubOwner(owner);
    localStorage.setItem('githubOwner', owner);
  };
  const handleSetGithubRepo = (repo: string) => {
    setGithubRepo(repo);
    localStorage.setItem('githubRepo', repo);
  };

  // Fetch branches from GitHub
  useEffect(() => {
    const fetchBranches = async () => {
      if (githubOwner && githubRepo && session) {
        setBranchesError(null);
        console.log(`Fetching branches for owner: ${githubOwner}, repo: ${githubRepo}`);
        try {
          const response = await fetch(`${API_BASE_URL}/api/get-branches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner: githubOwner, repo: githubRepo }),
          });
          const data = await response.json();
          if (response.ok) {
            setBranches(data.branches || []);
          } else {
            const errorDetails = data.details ? `: ${data.details}` : '';
            console.error(`Failed to fetch branches: ${data.error}${errorDetails}`);
            setBranches([]);
            const errorMessage = data.details ? `${data.error}: ${data.details}` : data.error;
            setBranchesError(errorMessage || 'Failed to fetch branches.');
          }
        } catch (error) {
          console.error('Error fetching branches:', error);
          setBranches([]);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
          setBranchesError(errorMessage);
        }
      } else {
        setBranches([]);
        setBranchesError(null);
      }
    };
    fetchBranches();
  }, [githubOwner, githubRepo, session]);

  // targetDateやコミット取得設定が変更されたらコミット履歴を再取得
  useEffect(() => {
    const fetchCommits = async () => {
      setCommitHistory(`コミット履歴を読み込み中...`);
      try {
        const dateString = formatDate(targetDate);
        if (!githubOwner || !githubRepo || !session) {
          setCommitHistory('GitHubの情報を設定し、ログインしてください。');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/get-commits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: githubOwner,
            repo: githubRepo,
            branch: selectedBranch,
            date: dateString,
            reportType,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setCommitHistory(data.commits || 'この日のコミットはありませんでした。');
        } else {
          setCommitHistory(`コミット履歴の取得に失敗しました。\n${data.error || ''}`);
        }
      } catch (error) {
        console.error("Error fetching commits:", error);
        setCommitHistory('コミット履歴の取得に失敗しました。');
      }
    };
    fetchCommits();
  }, [targetDate, reportType, githubOwner, githubRepo, selectedBranch, session]);

  const fetchEsaArticles = useCallback(async () => {
    setIsLoadingEsa(true);
    setEsaArticles([]);
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-past-reports?user=${esaUser}`);
      const data = await response.json();
      if (data.reports) {
        setEsaArticles(data.reports);
      } else {
        console.error("Failed to fetch esa articles");
      }
    } catch (error) {
      console.error("Error fetching esa articles:", error);
    } finally {
      setIsLoadingEsa(false);
    }
  }, [esaUser]);
  
  // esa記事タブが選択されたら記事を自動取得
  useEffect(() => {
    if (activeTab === 'esa') {
      fetchEsaArticles();
    }
  }, [activeTab, fetchEsaArticles]);

  // MTG資料モードになったら、先週の議事録を検索
  useEffect(() => {
    if (reportType === 'meeting') {
      const fetchLastMeeting = async () => {
        const team = localStorage.getItem('esaTeam');
        const apiKey = localStorage.getItem('esaApiKey');
        if (!team || !apiKey) {
          return; // 必要な情報がなければ何もしない
        }

        const lastWeek = new Date(targetDate);
        lastWeek.setDate(targetDate.getDate() - 7);
        const dateString = formatDate(lastWeek);

        try {
          const res = await fetch(`${API_BASE_URL}/api/get-past-reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              team, 
              apiKey, 
              date: dateString, 
              keyword: `${dateString}MTG`,
              user: esaUser 
            }),
          });
          const data = await res.json();
          if (res.ok && data.reports.length > 0) {
            setMeetingCandidates(data.reports);
            // 最初の候補を自動的に選択
            setLastMeetingUrl(data.reports[0].url);
          } else {
            setMeetingCandidates([]);
            setLastMeetingUrl('');
          }
        } catch (error) {
          console.error('Failed to fetch last meeting reports', error);
          setMeetingCandidates([]);
          setLastMeetingUrl('');
        }
      };
      fetchLastMeeting();
    }
  }, [reportType, targetDate, esaUser]);

  const generateReport = async () => {
    const generatingText = reportType === 'daily' ? "日報生成中..." : "MTG資料生成中...";
    setGeneratedText(generatingText);

    let customVariables: { [key: string]: any } = {};
    // localStorageからcustomVariablesを読み込む
    const savedCustomVarsJson = localStorage.getItem('customVariables');
    if (savedCustomVarsJson) {
      try {
        customVariables = JSON.parse(savedCustomVarsJson);
      } catch (error) {
        console.error("Error parsing customVariables from localStorage:", error);
        // パースエラーの場合はIndexedDBから読み込みを試みる
      }
    }

    // localStorageにない場合、IndexedDBから読み込む（バックアップ）
    if (Object.keys(customVariables).length === 0) {
      try {
        const savedCustomVars = await getFromIndexedDB<{ [key: string]: any }>('customVariables');
        if (savedCustomVars) {
          customVariables = savedCustomVars;
        }
      } catch (error) {
        console.error("Error loading customVariables from IndexedDB:", error);
        customVariables = {};
      }
    }

    let lastMeetingContent = '';
    if (reportType === 'meeting' && lastMeetingUrl) {
      try {
        const team = localStorage.getItem('esaTeam');
        const apiKey = localStorage.getItem('esaApiKey');
        const res = await fetch(`${API_BASE_URL}/api/get-esa-article`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: lastMeetingUrl, team, apiKey }),
        });
        const data = await res.json();
        if (res.ok) {
          lastMeetingContent = data.body_md;
        } else {
          throw new Error(data.error || 'Failed to fetch last meeting article');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setGeneratedText(`先週の議事録の取得に失敗しました: ${message}`);
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          commits: commitHistory, 
          model, 
          reportType, 
          workTimes: reportType === 'daily' ? workTimes.filter(wt => formatDate(wt.start) === formatDate(targetDate)) : workTimes.filter(wt => getDatesInWeek(targetDate).includes(formatDate(wt.start))), 
          targetDate, 
          customVariables, 
          lastMeetingContent 
        }),
      });
      const data = await response.json();
      setGeneratedText(data.report);
    } catch (error) {
      console.error("Error generating report:", error);
      const errorText = reportType === 'daily' ? "日報の生成に失敗しました。" : "MTG資料の生成に失敗しました。";
      setGeneratedText(errorText);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      const successText = reportType === 'daily' ? '日報をクリップボードにコピーしました。' : 'MTG資料をクリップボードにコピーしました。';
      alert(successText);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      alert('クリップボードへのコピーに失敗しました。');
    }
  };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{reportType === 'daily' ? '日報作成ツール' : 'MTG資料作成ツール'}</h1>
        <div className="flex items-center space-x-4">
          {session ? (
            <>
              <span className="text-gray-700">Signed in as {session.user?.name || session.user?.email}</span>
              <button onClick={() => signOut()} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded">
                Sign out
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button onClick={() => signIn('github')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">
                Sign in with GitHub
              </button>
              {GITHUB_APP_NAME && (
                <a 
                  href={`https://github.com/apps/${GITHUB_APP_NAME}/installations/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded"
                >
                  Install App
                </a>
              )}
            </div>
          )}
          <Link href="/stats" className="text-blue-600 hover:underline">
            統計
          </Link>
          <Link href="/settings" className="text-blue-600 hover:underline">
            設定
          </Link>
        </div>
      </div>

      <div className="mb-8 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-4">作業時間記録</h2>
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={handleStartWork}
            disabled={isWorking}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          >
            作業開始
          </button>
          <button
            onClick={handleEndWork}
            disabled={!isWorking}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          >
            作業終了
          </button>
        </div>
        {isWorking && (
          <div className="mb-4">
            <label htmlFor="current-memo" className="block text-sm font-medium text-gray-700">作業メモ:</label>
            <textarea
              id="current-memo"
              value={currentMemo}
              onChange={(e) => setCurrentMemo(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              rows={3}
              placeholder="今やっている作業内容をメモ..."
            />
          </div>
        )}
        <div>
          {reportType === 'daily' ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">記録された作業（{formatDate(targetDate)}）</h3>
                <span className="text-lg font-medium">
                  合計: {Math.floor(calculateTotalWorkDuration(workTimes.filter(wt => formatDate(wt.start) === formatDate(targetDate))) / 60)}時間 {calculateTotalWorkDuration(workTimes.filter(wt => formatDate(wt.start) === formatDate(targetDate))) % 60}分
                </span>
              </div>
              <ul className="space-y-2">
                {workTimes
                  .map((wt, _index) => ({ ...wt, originalIndex: _index })) // 元のインデックスを保持
                  .filter(wt => formatDate(wt.start) === formatDate(targetDate))
                  .map((wt) => (
                    <li key={wt.originalIndex} className="p-3 bg-gray-100 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        {editingWorkTimeIndex === wt.originalIndex ? (
                          <>
                            <input
                              type="time"
                              defaultValue={formatWorkTime(wt.start)}
                              id={`start-time-${wt.originalIndex}`}
                              className="border-gray-300 rounded-md"
                            />
                            <span className="mx-2">〜</span>
                            <input
                              type="time"
                              defaultValue={wt.end ? formatWorkTime(wt.end) : ''}
                              id={`end-time-${wt.originalIndex}`}
                              className="border-gray-300 rounded-md"
                            />
                            <div className="ml-auto">
                              <button onClick={() => handleSaveWorkTime(wt.originalIndex, (document.getElementById(`start-time-${wt.originalIndex}`) as HTMLInputElement).value, (document.getElementById(`end-time-${wt.originalIndex}`) as HTMLInputElement).value)} className="bg-blue-500 text-white px-3 py-1 rounded-md mr-2">保存</button>
                              <button onClick={handleCancelEdit} className="bg-gray-500 text-white px-3 py-1 rounded-md">キャンセル</button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span>
                              {formatWorkTime(wt.start)} 〜 {wt.end ? formatWorkTime(wt.end) : '作業中...'}
                              {wt.end && `(${calculateWorkDuration(wt.start, wt.end)}分)`}
                            </span>
                            <div>
                              <button onClick={() => handleEditWorkTime(wt.originalIndex)} className="bg-gray-300 text-black px-3 py-1 rounded-md mr-2">編集</button>
                              <button onClick={() => handleDeleteWorkTime(wt.originalIndex)} className="bg-red-500 text-white px-3 py-1 rounded-md">削除</button>
                            </div>
                          </>
                        )}
                      </div>
                      {wt.memo && (
                        <pre className="whitespace-pre-wrap bg-white p-2 rounded text-sm">{wt.memo}</pre>
                      )}
                    </li>
                  ))}
              </ul>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">記録された作業（今週分）</h3>
                <span className="text-lg font-medium">
                  合計: {Math.floor(calculateTotalWorkDuration(workTimes.filter(wt => getDatesInWeek(targetDate).includes(formatDate(wt.start)))) / 60)}時間 {calculateTotalWorkDuration(workTimes.filter(wt => getDatesInWeek(targetDate).includes(formatDate(wt.start)))) % 60}分
                </span>
              </div>
              <div className="space-y-2">
                {Object.entries(groupWorkTimesByDay(workTimes.filter(wt => getDatesInWeek(targetDate).includes(formatDate(wt.start)))))
                  .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                  .map(([date, dailyWorkTimes]) => (
                    <details key={date} className="p-3 bg-gray-100 rounded-md">
                      <summary className="flex justify-between items-center cursor-pointer">
                        <h4 className="font-semibold">{date}</h4>
                        <span>
                          合計: {Math.floor(calculateTotalWorkDuration(dailyWorkTimes) / 60)}時間 {calculateTotalWorkDuration(dailyWorkTimes) % 60}分
                        </span>
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {dailyWorkTimes
                          .map((wt, _index) => ({ ...wt, originalIndex: workTimes.indexOf(wt) })) // 元のインデックスを保持
                          .map((wt) => (
                            <li key={wt.originalIndex} className="p-2 bg-white rounded-md">
                              <div className="flex items-center justify-between mb-1">
                                {editingWorkTimeIndex === wt.originalIndex ? (
                                  <>
                                    <input
                                      type="time"
                                      defaultValue={formatWorkTime(wt.start)}
                                      id={`start-time-${wt.originalIndex}`}
                                      className="border-gray-300 rounded-md"
                                    />
                                    <span className="mx-2">〜</span>
                                    <input
                                      type="time"
                                      defaultValue={wt.end ? formatWorkTime(wt.end) : ''}
                                      id={`end-time-${wt.originalIndex}`}
                                      className="border-gray-300 rounded-md"
                                    />
                                    <div className="ml-auto">
                                      <button onClick={() => handleSaveWorkTime(wt.originalIndex, (document.getElementById(`start-time-${wt.originalIndex}`) as HTMLInputElement).value, (document.getElementById(`end-time-${wt.originalIndex}`) as HTMLInputElement).value)} className="bg-blue-500 text-white px-3 py-1 rounded-md mr-2">保存</button>
                                      <button onClick={handleCancelEdit} className="bg-gray-500 text-white px-3 py-1 rounded-md">キャンセル</button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <span>
                                      {formatWorkTime(wt.start)} 〜 {wt.end ? formatWorkTime(wt.end) : '作業中...'}
                                      {wt.end && `(${calculateWorkDuration(wt.start, wt.end)}分)`}
                                    </span>
                                    <div>
                                      <button onClick={() => handleEditWorkTime(wt.originalIndex)} className="bg-gray-300 text-black px-3 py-1 rounded-md mr-2">編集</button>
                                      <button onClick={() => handleDeleteWorkTime(wt.originalIndex)} className="bg-red-500 text-white px-3 py-1 rounded-md">削除</button>
                                    </div>
                                  </>
                                )}
                              </div>
                              {wt.memo && (
                                <pre className="whitespace-pre-wrap bg-white p-2 rounded text-sm">{wt.memo}</pre>
                              )}
                            </li>
                          ))}
                      </ul>
                    </details>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex space-x-4 border-b pb-4">
          <button
            onClick={() => setReportType('daily')}
            className={`px-4 py-2 rounded-md ${reportType === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            日報
          </button>
          <button
            onClick={() => setReportType('meeting')}
            className={`px-4 py-2 rounded-md ${reportType === 'meeting' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            MTG資料
          </button>
        </div>
      </div>

      {reportType === 'meeting' && (
        <div className="mb-8 p-4 border rounded-md bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">MTG資料設定</h2>
          <div>
            <label htmlFor="last-meeting-url" className="block text-sm font-medium text-gray-700">先週のMTG議事録:</label>
            <select
              id="last-meeting-url"
              value={lastMeetingUrl}
              onChange={(e) => setLastMeetingUrl(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              disabled={meetingCandidates.length === 0}
            >
              {meetingCandidates.length > 0 ? (
                meetingCandidates.map(candidate => (
                  <option key={candidate.url} value={candidate.url}>
                    {candidate.name}
                  </option>
                ))
              ) : (
                <option value="">先週のMTG資料が見つかりませんでした</option>
              )}
            </select>
          </div>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date-select" className="block text-sm font-medium text-gray-700">対象日:</label>
          <input 
            type="date" 
            id="date-select"
            value={formatDate(targetDate)}
            onChange={(e) => setTargetDate(new Date(e.target.value))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          />
        </div>
        <div>
          <label htmlFor="model-select" className="block text-sm font-medium text-gray-700">Geminiモデルを選択:</label>
          <select
            id="model-select"
            value={model}
            onChange={(e) => handleSetModel(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('commits')}
                className={`${activeTab === 'commits' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                コミット履歴
              </button>
              <button
                onClick={() => setActiveTab('esa')}
                className={`${activeTab === 'esa' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                esa記事
              </button>
            </nav>
          </div>
          <div className="mt-4">
            {activeTab === 'commits' && (
              <div>
                <div className="space-y-4 mb-4 p-4 border rounded-md">
                  <h3 className="text-lg font-medium">コミット取得設定</h3>
                  <div>
                    <label htmlFor="github-owner" className="block text-sm font-medium text-gray-700">GitHub Owner:</label>
                    <input
                      type="text"
                      id="github-owner"
                      value={githubOwner}
                      onChange={(e) => handleSetGithubOwner(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      placeholder="例: your-github-username"
                    />
                  </div>
                  <div>
                    <label htmlFor="github-repo" className="block text-sm font-medium text-gray-700">GitHub Repo:</label>
                    <input
                      type="text"
                      id="github-repo"
                      value={githubRepo}
                      onChange={(e) => handleSetGithubRepo(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      placeholder="例: your-repo-name"
                    />
                  </div>

                  <div>
                    <label htmlFor="branch-select" className="block text-sm font-medium text-gray-700">Branch:</label>
                    <select
                      id="branch-select"
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      disabled={branches.length === 0}
                    >
                      <option value="all">All Branches</option>
                      {branches.map(branch => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                    {branchesError && <p className="text-red-500 text-sm mt-1">{branchesError}</p>}
                  </div>
                </div>
                <pre className="bg-gray-100 p-2 rounded-md overflow-auto h-80">{commitHistory}</pre>
              </div>
            )}
            {activeTab === 'esa' && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="text"
                    value={esaUser}
                    onChange={(e) => handleSetEsaUser(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    placeholder="esa.ioのユーザー名"
                  />
                </div>
                <div className="bg-gray-100 p-2 rounded-md overflow-auto h-80">
                  {isLoadingEsa ? (
                    <p>読み込み中...</p>
                  ) : (
                    <ul>
                      {esaArticles.map((article, _index) => (
                        <li key={_index} className="mb-2">
                          <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {article.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">生成された{reportType === 'daily' ? '日報' : 'MTG資料'}</h2>
          <textarea
            className="w-full h-96 p-2 border rounded-md"
            value={generatedText}
            onChange={(e) => setGeneratedText(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={generateReport}
        >
          {reportType === 'daily' ? '日報を生成' : 'MTG資料を生成'}
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
          onClick={copyToClipboard}
          disabled={!generatedText}
        >
          クリップボードにコピー
        </button>
      </div>

    </div>
  );
}
