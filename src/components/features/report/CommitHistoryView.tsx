// src/components/features/report/CommitHistoryView.tsx
"use client";

import GitHubSettings from "./GitHubSettings";
import CommitHistoryList from "./CommitHistoryList";
import type { ReactElement } from "react";

/**
 * `CommitHistoryView`コンポーネントのプロパティの型定義。
 */
interface CommitHistoryViewProps {
  /** 表示するコミット履歴の文字列。 */
  commitHistory: string;
  /** データの読み込み状態を示すフラグ。 */
  isLoading: boolean;
  /** 発生したエラーオブジェクト。 */
  error: Error | null;
}

/**
 * コミット履歴の表示エリア全体を管理するコンポーネント。
 * GitHubリポジトリ設定コンポーネントとコミット履歴リストを含みます。
 * また、データの読み込み中やエラー発生時の表示も制御します。
 * @param {CommitHistoryViewProps} props - コンポーネントのプロパティ。
 * @returns {ReactElement} コミット履歴ビューのコンポーネント。
 */
export default function CommitHistoryView({
  commitHistory,
  isLoading,
  error,
}: CommitHistoryViewProps): ReactElement {
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
        {!isLoading && !error && (
          <CommitHistoryList commitHistory={commitHistory} />
        )}
      </div>
    </div>
  );
}

