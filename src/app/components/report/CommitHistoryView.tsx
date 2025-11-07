'use client';

import GitHubSettings from './GitHubSettings';
import CommitHistoryList from './CommitHistoryList';

interface CommitHistoryViewProps {
  commitHistory: string;
}

export default function CommitHistoryView({ commitHistory }: CommitHistoryViewProps) {
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
        <CommitHistoryList commitHistory={commitHistory} />
      </div>
    </div>
  );
}
