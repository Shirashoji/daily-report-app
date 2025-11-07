// src/components/features/report/CommitHistoryView.tsx
'use client';

import GitHubSettings from './GitHubSettings';
import CommitHistoryList from './CommitHistoryList';
import type { ReactElement } from 'react';

interface CommitHistoryViewProps {
  commitHistory: string;
  isLoading: boolean;
  error: Error | null;
}

/**
 * A component to display the commit history view, including settings and the list of commits.
 * It also handles loading and error states for the commit history.
 * @component
 */
export default function CommitHistoryView({ commitHistory, isLoading, error }: CommitHistoryViewProps): ReactElement {
  return (
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
        <GitHubSettings />
        {isLoading && <p>コミット履歴を読み込み中...</p>}
        {error && <p className="text-red-500">エラー: {error.message}</p>}
        {!isLoading && !error && <CommitHistoryList commitHistory={commitHistory} />}
      </div>
    </div>
  );
}
