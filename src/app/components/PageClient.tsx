"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

import { formatDate } from '../lib/utils';
import { useGitHub } from '../hooks/useGitHub';
import { useWorkTime } from '../hooks/useWorkTime';
import { useCommitHistory } from '../hooks/useCommitHistory';
import { useSettings } from '../hooks/useSettings';
import { useReportGenerator } from '../hooks/useReportGenerator';

const formatWorkTime = (date: Date) => {
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return jstDate.toISOString().slice(11, 16);
};

const calculateWorkDuration = (start: Date, end: Date) => {
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / (1000 * 60));
};

interface PageClientProps {
  initialReportType: 'daily' | 'meeting';
}

export default function PageClient({ initialReportType }: PageClientProps) {
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

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    if (initialReportType === 'daily') {
      const today = new Date();
      setStartDate(today);
      setEndDate(today);
    } else {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      setStartDate(sevenDaysAgo);
      setEndDate(today);
    }
  }, [initialReportType]);

  const {
    commitHistory,
  } = useCommitHistory(session, githubOwner, githubRepo, selectedBranch, startDate, endDate, initialReportType);

  const {
    model,
    handleSetModel,
  }
  = useSettings();

  const {
    generatedText,
    generateReport,
    copyToClipboard,
  } = useReportGenerator(commitHistory, model, workTimes, startDate, endDate);

  return (
    <div className="container mx-auto p-4">
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
                <h3 className="text-lg font-medium">記録された作業（{formatDate(startDate)} ~ {formatDate(endDate)}）</h3>
                <span className="text-lg font-medium">
                  合計: {Math.floor(calculateTotalWorkDuration(workTimes.filter(wt => {
                    const wtStart = new Date(wt.start);
                    return wtStart >= startDate && wtStart <= endDate;
                  })) / 60)}時間 {calculateTotalWorkDuration(workTimes.filter(wt => {
                    const wtStart = new Date(wt.start);
                    return wtStart >= startDate && wtStart <= endDate;
                  })) % 60}分
                </span>
              </div>
              <ul className="space-y-2">
                {workTimes
                  .map((wt, _index) => ({ ...wt, originalIndex: _index })) // 元のインデックスを保持
                  .filter(wt => {
                    const wtStart = new Date(wt.start); // workTimesのstart時刻 (UTC)
                    return wtStart >= startDate && wtStart <= endDate;
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
        {initialReportType === 'daily' && (
          <div>
            <label htmlFor="date-select" className="block text-sm font-medium text-gray-700">対象日:</label>
            <input 
              type="date" 
              id="date-select"
              value={formatDate(startDate)}
              onChange={(e) => {
                const dateString = e.target.value;
                const utcDate = new Date(dateString + 'T00:00:00.000Z');
                setStartDate(utcDate);
                setEndDate(utcDate); // 日報の場合は開始日と終了日を同じにする
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
        )}
        {initialReportType === 'meeting' && (
          <>
            <div>
              <label htmlFor="start-date-select" className="block text-sm font-medium text-gray-700">開始日:</label>
              <input 
                type="date" 
                id="start-date-select"
                value={formatDate(startDate)}
                onChange={(e) => {
                  const dateString = e.target.value;
                  const utcDate = new Date(dateString + 'T00:00:00.000Z');
                  setStartDate(utcDate);
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              />
            </div>
            <div>
              <label htmlFor="end-date-select" className="block text-sm font-medium text-gray-700">終了日:</label>
              <input 
                type="date" 
                id="end-date-select"
                value={formatDate(endDate)}
                onChange={(e) => {
                  const dateString = e.target.value;
                  const utcDate = new Date(dateString + 'T00:00:00.000Z');
                  setEndDate(utcDate);
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              />
            </div>
          </>
        )}
        <div>
          <label htmlFor="model-select" className="block text-sm font-medium text-gray-700">Geminiモデルを選択:</label>
          <select
            id="model-select"
            value={model}
            onChange={(e) => handleSetModel(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro</option>
            <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash</option>
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
          <h2 className="text-xl font-semibold mb-2">生成された{initialReportType === 'daily' ? '日報' : 'MTG資料'}</h2>
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
          onClick={() => generateReport(initialReportType)}
        >
          {initialReportType === 'daily' ? '日報を生成' : 'MTG資料を生成'}
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
