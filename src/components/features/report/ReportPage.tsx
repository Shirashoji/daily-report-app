// src/components/features/report/ReportPage.tsx
'use client';

import { useEffect, useCallback, ReactElement } from 'react';
import { useSession, signOut } from 'next-auth/react';
import dynamic from 'next/dynamic';

import { useSettings } from '@/hooks/useSettings';
import { useCommitHistory } from '@/hooks/useCommitHistory';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import ReportHeader from './ReportHeader';
import WorkTimeRecorder from './WorkTimeRecorder';

// 各コンポーネントを動的にインポートして、初期表示のパフォーマンスを向上させる
const CommitHistoryView = dynamic(() => import('./CommitHistoryView'), {
  loading: () => <p>Loading...</p>,
});
const GeneratedReportView = dynamic(() => import('./GeneratedReportView'), {
  loading: () => <p>Loading...</p>,
});
const DailyWorkTime = dynamic(() => import('./DailyWorkTime'), {
  loading: () => <p>Loading...</p>,
});
const MeetingWorkTime = dynamic(() => import('./MeetingWorkTime'), {
  loading: () => <p>Loading...</p>,
});

/**
 * `ReportPage`コンポーネントのプロパティの型定義。
 */
interface ReportPageProps {
  /** レポートの種類 ('daily' または 'meeting')。 */
  reportType: 'daily' | 'meeting';
}

/**
 * レポート作成ページのメインコンポーネント。
 * データ取得、状態管理、UIレンダリングを統括し、レポート生成のワークフローを構築します。
 * @param {ReportPageProps} props - コンポーネントのプロパティ。
 * @returns {ReactElement} レポート作成ページのUI全体。
 */
export default function ReportPage({ reportType }: ReportPageProps): ReactElement {
  // 認証セッション、設定のカスタムフックを利用
  const { data: session } = useSession();
  const { model, handleSetModel: onModelChange } = useSettings();

  // 認証セッションでエラーが返された場合のアラート表示とサインアウト処理
  useEffect(() => {
    if (session?.error) {
      alert(`認証エラー: ${session.error}`);
      signOut();
    }
  }, [session]);

  // コミット履歴を取得
  const { commits, isLoading: isLoadingCommits, error: commitError } = useCommitHistory();

  // モデル変更のハンドラをメモ化
  const handleSetModel = useCallback(
    (model: string) => {
      onModelChange(model);
    },
    [onModelChange]
  );

  return (
    <div className="container mx-auto p-4">
      {/* 作業時間記録コンポーネント */}
      <ErrorBoundary>
        <WorkTimeRecorder />
      </ErrorBoundary>

      {/* 記録された作業時間の表示エリア */}
      <div className="mb-8 p-4 border rounded-md">
        <ErrorBoundary>
          {reportType === 'daily' ? <DailyWorkTime /> : <MeetingWorkTime />}
        </ErrorBoundary>
      </div>

      {/* レポート設定ヘッダー（日付・モデル選択） */}
      <ReportHeader initialReportType={reportType} model={model} handleSetModel={handleSetModel} />

      <div className="grid grid-cols-2 gap-8">
        {/* コミット履歴表示エリア */}
        <ErrorBoundary>
          <CommitHistoryView commits={commits} isLoading={isLoadingCommits} error={commitError} />
        </ErrorBoundary>
        {/* レポート生成・表示エリア */}
        <ErrorBoundary>
          <GeneratedReportView initialReportType={reportType} commits={commits} model={model} />
        </ErrorBoundary>
      </div>
    </div>
  );
}
