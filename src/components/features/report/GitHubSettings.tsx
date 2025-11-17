// src/components/features/report/GitHubSettings.tsx
'use client';

import { useGitHubContext } from '@/contexts/GitHubContext';
import type { ReactElement } from 'react';

/**
 * コミット履歴を取得するためのGitHubリポジトリ設定（オーナー、リポジトリ名、ブランチ）を行うコンポーネント。
 * 入力された設定は`useGitHubContext`を通じて管理され、localStorageに保存されます。
 * @returns {ReactElement} GitHubリポジトリ設定フォーム。
 */
export default function GitHubSettings(): ReactElement {
  // GitHub関連の状態と更新関数をコンテキストから取得
  const {
    githubOwner,
    githubRepo,
    branches,
    branchesLoading,
    branchesError,
    selectedBranch,
    setGithubOwner,
    setGithubRepo,
    setSelectedBranch,
  } = useGitHubContext();

  return (
    <div className="space-y-4 mb-4 p-4 border rounded-md">
      <h3 className="text-lg font-medium">コミット取得設定</h3>
      <div>
        <label htmlFor="github-owner" className="block text-sm font-medium text-gray-700">
          GitHub Owner:
        </label>
        <input
          type="text"
          id="github-owner"
          value={githubOwner}
          onChange={(e) => setGithubOwner(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          placeholder="例: your-github-username"
        />
      </div>
      <div>
        <label htmlFor="github-repo" className="block text-sm font-medium text-gray-700">
          GitHub Repo:
        </label>
        <input
          type="text"
          id="github-repo"
          value={githubRepo}
          onChange={(e) => setGithubRepo(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          placeholder="例: your-repo-name"
        />
      </div>

      <div>
        <label htmlFor="branch-select" className="block text-sm font-medium text-gray-700">
          Branch:
        </label>
        <select
          id="branch-select"
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          disabled={branchesLoading || branches.length === 0}
        >
          <option value="all">All Branches</option>
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
        {/* ブランチリストの読み込み中またはエラー時にメッセージを表示 */}
        {branchesLoading && <p className="text-sm mt-1">ブランチを読み込み中...</p>}
        {branchesError && <p className="text-red-500 text-sm mt-1">{branchesError}</p>}
      </div>
    </div>
  );
}
