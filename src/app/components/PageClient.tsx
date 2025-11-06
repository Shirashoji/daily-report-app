'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

import { formatDate } from '../../lib/utils';
import { useGitHub } from '../hooks/useGitHub';
import { useWorkTime } from '../hooks/useWorkTime';
import { useCommitHistory } from '../hooks/useCommitHistory';
import { useSettings } from '../hooks/useSettings';
import { useReportGenerator } from '../hooks/useReportGenerator';
import DailyWorkTime from './DailyWorkTime';
import MeetingWorkTime from './MeetingWorkTime';
import WorkTimeRecorder from './WorkTimeRecorder';

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

  const { workTimes } = useWorkTime();

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
  } = useSettings();

  const {
    generatedText,
    generateReport,
    copyToClipboard,
  } = useReportGenerator(commitHistory, model, workTimes, startDate, endDate);

  return (
    <div className="container mx-auto p-4">
      <WorkTimeRecorder />

      <div className="mb-8 p-4 border rounded-md">
        {initialReportType === 'daily' ? (
          <DailyWorkTime startDate={startDate} endDate={endDate} />
        ) : (
          <MeetingWorkTime startDate={startDate} endDate={endDate} />
        )}
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
                setEndDate(utcDate);
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
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
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