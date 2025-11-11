// src/components/features/report/CommitHistoryList.tsx
"use client";

import type { ReactElement } from "react";

/**
 * `CommitHistoryList`コンポーネントのプロパティの型定義。
 */
interface CommitHistoryListProps {
  /**
   * 表示するコミット履歴の文字列。
   */
  commitHistory: string;
}

/**
 * GitHubから取得したコミット履歴を整形済みテキストとして表示するコンポーネント。
 * @param {CommitHistoryListProps} props - コンポーネントのプロパティ。
 * @returns {ReactElement} コミット履歴を表示する`pre`要素。
 */
export default function CommitHistoryList({
  commitHistory,
}: CommitHistoryListProps): ReactElement {
  return (
    <pre className="bg-gray-100 p-2 rounded-md overflow-auto h-80 text-sm">
      {commitHistory}
    </pre>
  );
}

