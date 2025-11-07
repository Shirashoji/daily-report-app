// src/components/features/report/GitHubSettings.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useGitHub } from '@/hooks/useGitHub';
import type { ReactElement } from 'react';

/**
 * A component for configuring GitHub repository settings,
 * including owner, repository, and branch selection.
 * @component
 */
export default function GitHubSettings(): ReactElement {
  const { data: session } = useSession();
  const {
    githubOwner,
    githubRepo,
    branches,
    branchesLoading,
    branchesError,
    selectedBranch,
    handleSetGithubOwner,
    handleSetGithubRepo,
    setSelectedBranch,
  } = useGitHub(session);

  return (
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
          disabled={branchesLoading || branches.length === 0}
        >
          <option value="all">All Branches</option>
          {branches.map(branch => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
        {branchesLoading && <p className="text-sm mt-1">ブランチを読み込み中...</p>}
        {branchesError && <p className="text-red-500 text-sm mt-1">{branchesError}</p>}
      </div>
    </div>
  );
}
