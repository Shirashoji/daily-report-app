"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface EsaArticle {
  name: string;
  url: string;
  body_md: string;
}

// DateをYYYY-MM-DD形式の文字列に変換するヘルパー関数
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Home() {
  const [commitHistory, setCommitHistory] = useState('コミット履歴を読み込み中...');
  const [generatedText, setGeneratedText] = useState('');
  const [reportType, setReportType] = useState('daily'); // 'daily' or 'meeting'
  const [advice, setAdvice] = useState('');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [model, setModel] = useState('gemini-1.5-flash');
  const [activeTab, setActiveTab] = useState('commits');
  const [esaArticles, setEsaArticles] = useState<EsaArticle[]>([]);
  const [isLoadingEsa, setIsLoadingEsa] = useState(false);
  const [esaUser, setEsaUser] = useState('shirashoji');
  const [targetDate, setTargetDate] = useState(new Date());
  const [localRepoPath, setLocalRepoPath] = useState('');

  // localStorageから永続化されたデータを読み込む
  useEffect(() => {
    const savedUser = localStorage.getItem('esaUser');
    if (savedUser) {
      setEsaUser(savedUser);
    }
    const savedModel = localStorage.getItem('geminiModel');
    if (savedModel) {
      setModel(savedModel);
    }
    const savedLocalRepoPath = localStorage.getItem('localRepoPath');
    if (savedLocalRepoPath) {
      setLocalRepoPath(savedLocalRepoPath);
    }
  }, []);

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

  const handleSetLocalRepoPath = (path: string) => {
    setLocalRepoPath(path);
    localStorage.setItem('localRepoPath', path);
  };

  // targetDateやコミット取得設定が変更されたらコミット履歴を再取得
  useEffect(() => {
    const fetchCommits = async () => {
      setCommitHistory(`コミット履歴を読み込み中...`);
      try {
        const dateString = formatDate(targetDate);
        let url = `/api/get-commits?date=${dateString}`;

        if (!localRepoPath) {
          setCommitHistory('ローカルリポジトリのパスを設定してください。');
          return;
        }
        url += `&source=local&path=${encodeURIComponent(localRepoPath)}`;

        const response = await fetch(url);
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
  }, [targetDate, localRepoPath]);

  const fetchEsaArticles = useCallback(async () => {
    setIsLoadingEsa(true);
    setEsaArticles([]);
    try {
      const response = await fetch(`/api/get-past-reports?user=${esaUser}`);
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

  const generateReport = async () => {
    const generatingText = reportType === 'daily' ? "日報生成中..." : "MTG資料生成中...";
    setGeneratedText(generatingText);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commits: commitHistory, model, reportType }),
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

  const getAdvice = async () => {
    setIsGeneratingAdvice(true);
    setAdvice('アドバイスを生成中...');
    try {
      const [templateRes, pastReportsRes] = await Promise.all([
        fetch('/daily-template.md'),
        fetch(`/api/get-past-reports?user=${esaUser}`),
      ]);

      const template = await templateRes.text();
      const { reports: pastReports } = await pastReportsRes.json();
      const reportBodies = pastReports.map((r: EsaArticle) => r.body_md);

      const adviceRes = await fetch('/api/generate-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template, pastReports: reportBodies, commits: commitHistory, model }),
      });

      const { advice } = await adviceRes.json();
      setAdvice(advice);
    } catch (error) {
      console.error("Error generating advice:", error);
      setAdvice("アドバイスの生成に失敗しました。");
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{reportType === 'daily' ? '日報作成ツール' : 'MTG資料作成ツール'}</h1>
        <Link href="/settings" className="text-blue-600 hover:underline">
          設定
        </Link>
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
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
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
                    <label htmlFor="local-repo-path" className="block text-sm font-medium text-gray-700">ローカルリポジトリのパス:</label>
                    <input
                      type="text"
                      id="local-repo-path"
                      value={localRepoPath}
                      onChange={(e) => handleSetLocalRepoPath(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      placeholder="例: /path/to/your/repo"
                    />
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
                      {esaArticles.map((article, index) => (
                        <li key={index} className="mb-2">
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

      {reportType === 'daily' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">日報作成アドバイス</h2>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
            <button
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mb-4"
              onClick={getAdvice}
              disabled={isGeneratingAdvice}
            >
              {isGeneratingAdvice ? 'アドバイス生成中...' : 'アドバイスを生成'}
            </button>
            {advice && <pre className="whitespace-pre-wrap">{advice}</pre>}
          </div>
        </div>
      )}
    </div>
  );
}