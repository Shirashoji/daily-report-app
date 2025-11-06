"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


const GITHUB_APP_NAME = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;


import { formatDate } from '../lib/utils';

/**
 * 指定されたUTC DateオブジェクトがJSTで何月何日であるかを基準に、
 * そのJSTの日付の00:00:00と23:59:59.999をUTCで返す。
 * @param {Date} utcDate - 基準となるUTC Dateオブジェクト
 * @returns {{ startOfDayJST_UTC: Date, endOfDayJST_UTC: Date }}
 */
const getJstDayBoundariesInUtc = (utcDate: Date) => {
  // JSTのオフセット（+9時間）をミリ秒で取得
  const jstOffsetMs = 9 * 60 * 60 * 1000;

  // 基準となるUTC DateオブジェクトをJSTに変換したときのタイムスタンプ
  const utcTimestamp = utcDate.getTime();
  const jstTimestamp = utcTimestamp + jstOffsetMs;

  // JSTでの年、月、日を取得
  const jstDate = new Date(jstTimestamp);
  const jstYear = jstDate.getUTCFullYear();
  const jstMonth = jstDate.getUTCMonth();
  const jstDay = jstDate.getUTCDate();

  // JSTのその日の00:00:00をUTCで計算
  const startOfDayJST_UTC = new Date(Date.UTC(jstYear, jstMonth, jstDay, 0, 0, 0));

  // JSTのその日の23:59:59.999をUTCで計算
  const endOfDayJST_UTC = new Date(Date.UTC(jstYear, jstMonth, jstDay, 23, 59, 59, 999));

  return { startOfDayJST_UTC, endOfDayJST_UTC };
};

const formatWorkTime = (date: Date) => {
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return jstDate.toISOString().slice(11, 16);
};

const calculateWorkDuration = (start: Date, end: Date) => {
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / (1000 * 60));
};

/**
 * The main page of the application.
 * It allows users to generate reports based on their GitHub commit history and work time.
 * @returns {React.ReactElement} The home page.
 */
import { useGitHub } from './hooks/useGitHub';

import { useWorkTime } from './hooks/useWorkTime';
import { useCommitHistory } from './hooks/useCommitHistory';
import { useSettings } from './hooks/useSettings';
import { useReportGenerator } from './hooks/useReportGenerator';

export default function Home() {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.error) {
      alert(`Authentication Error: ${session.error}`);
      signOut(); // Force sign out to clear the session
    }
  }, [session]);

  const {
    githubOwner,
    githubRepo,
    branches,
    branchesError,
    selectedBranch,
    handleSetGithubOwner,
    handleSetGithubRepo,
    setSelectedBranch,
  } = useGitHub(session);

  const {
    workTimes,
    isWorking,
    currentMemo,
    editingWorkTimeIndex,
    handleStartWork,
    handleEndWork,
    setCurrentMemo,
    handleEditWorkTime,
    handleSaveWorkTime,
    handleCancelEdit,
    handleDeleteWorkTime,
    calculateTotalWorkDuration,
    importWorkTimes,
  } = useWorkTime();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          importWorkTimes(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportWorkTimes = () => {
    const dataStr = JSON.stringify(workTimes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `work-times-${formatDate(new Date())}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }


  const [targetDate, setTargetDate] = useState(new Date());

  const {
    commitHistory,
  } = useCommitHistory(session, githubOwner, githubRepo, selectedBranch, targetDate);

  const {
    model,
    handleSetModel,
  }
  = useSettings();

  const {
    generatedText,
    generateReport,
    copyToClipboard,
    setGeneratedText,
  } = useReportGenerator(commitHistory, model, workTimes, targetDate);















  
  
  

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">日報作成ツール</h1>
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            className="hidden"
            accept=".json"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            作業時間データをJSONでインポート
          </button>
          <button
            onClick={handleExportWorkTimes}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            作業時間データをJSONでエクスポート
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
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">記録された作業（{formatDate(targetDate)}）</h3>
                <span className="text-lg font-medium">
                  合計: {Math.floor(calculateTotalWorkDuration(workTimes.filter(wt => formatDate(wt.start) === formatDate(targetDate))) / 60)}時間 {calculateTotalWorkDuration(workTimes.filter(wt => formatDate(wt.start) === formatDate(targetDate))) % 60}分
                </span>
              </div>
              <ul className="space-y-2">
                {workTimes
                  .map((wt, _index) => ({ ...wt, originalIndex: _index })) // 元のインデックスを保持
                  .filter(wt => {
                    const wtStart = new Date(wt.start); // workTimesのstart時刻 (UTC)
                    const { startOfDayJST_UTC, endOfDayJST_UTC } = getJstDayBoundariesInUtc(targetDate);

                    // workTimesのstart時刻が、targetDateがJSTで示す日の00:00:00から23:59:59.999の範囲内にあるか
                    return wtStart >= startOfDayJST_UTC && wtStart <= endOfDayJST_UTC;
                  })
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
        </div>
      </div>





      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date-select" className="block text-sm font-medium text-gray-700">対象日:</label>
          <input 
            type="date" 
            id="date-select"
            value={formatDate(targetDate)}
            onChange={(e) => {
              const dateString = e.target.value;
              const utcDate = new Date(dateString + 'T00:00:00.000Z');
              setTargetDate(utcDate);
            }}
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
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                className={`border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                コミット履歴
              </button>

            </nav>
          </div>
          <div className="mt-4">
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

          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">生成された日報</h2>
          <textarea
            className="w-full h-96 p-2 border rounded-md"
            value={generatedText}
            readOnly
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={generateReport}
        >
          日報を生成
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
