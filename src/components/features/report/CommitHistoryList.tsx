// src/components/features/report/CommitHistoryList.tsx
import { memo } from 'react';
import type { ReactElement } from 'react';
import type { CommitData } from '@/types/github';

/**
 * `CommitHistoryList`コンポーネントのプロパティの型定義。
 */
interface CommitHistoryListProps {
  /**
   * 表示するコミットデータの配列。
   */
  commits: CommitData[];
}

/**
 * GitHubから取得したコミットデータの配列をリスト形式で表示するコンポーネント。
 * @param {CommitHistoryListProps} props - コンポーネントのプロパティ。
 * @returns {ReactElement} コミット履歴のリスト。
 */
const CommitHistoryList = memo(function CommitHistoryList({
  commits,
}: CommitHistoryListProps): ReactElement {
  if (commits.length === 0) {
    return (
      <div className="bg-gray-100 p-4 rounded-md h-80 flex items-center justify-center">
        <p className="text-gray-500">この期間のコミットはありませんでした。</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-2 rounded-md overflow-auto h-80 text-sm">
      <ul>
        {commits.map((commit) => (
          <li key={commit.sha} className="mb-2 p-2 border-b border-gray-200">
            <p className="font-mono text-gray-800">
              <span className="font-bold">{commit.sha}</span> -{' '}
              <span className="italic">{commit.author}</span>
            </p>
            <p className="text-gray-600">
              {new Date(commit.date).toLocaleString('ja-JP')}
            </p>
            <p className="whitespace-pre-wrap">{commit.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default CommitHistoryList;
