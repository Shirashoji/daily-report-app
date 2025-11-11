// src/components/features/report/ReportPage.tsx
"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactElement,
} from "react";
import { useSession, signOut } from "next-auth/react";
import dynamic from "next/dynamic";

import { useSettings } from "@/hooks/useSettings";
import { useCommitHistory } from "@/hooks/useCommitHistory";
import { useGitHub } from "@/hooks/useGitHub";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import ReportHeader from "./ReportHeader";
import WorkTimeRecorder from "./WorkTimeRecorder";

// 各コンポーネントを動的にインポートして、初期表示のパフォーマンスを向上させる
const CommitHistoryView = dynamic(() => import("./CommitHistoryView"), {
  loading: () => <p>Loading...</p>,
});
const GeneratedReportView = dynamic(() => import("./GeneratedReportView"), {
  loading: () => <p>Loading...</p>,
});
const DailyWorkTime = dynamic(() => import("./DailyWorkTime"), {
  loading: () => <p>Loading...</p>,
});
const MeetingWorkTime = dynamic(() => import("./MeetingWorkTime"), {
  loading: () => <p>Loading...</p>,
});

/**
 * `ReportPage`コンポーネントのプロパティの型定義。
 */
interface ReportPageProps {
  /** レポートの種類 ('daily' または 'meeting')。 */
  reportType: "daily" | "meeting";
}

/**
 * レポート作成ページのメインコンポーネント。
 * データ取得、状態管理、UIレンダリングを統括し、レポート生成のワークフローを構築します。
 * @param {ReportPageProps} props - コンポーネントのプロパティ。
 * @returns {ReactElement} レポート作成ページのUI全体。
 */
export default function ReportPage({ reportType }: ReportPageProps): ReactElement {
  // 認証セッション、設定、GitHub関連のカスタムフックを利用
  const { data: session } = useSession();
  const { model, handleSetModel: onModelChange } = useSettings();
  const { githubOwner, githubRepo, selectedBranch } = useGitHub(session);

  // レポートの対象期間を管理するstate
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  // 認証セッションでエラーが返された場合のアラート表示とサインアウト処理
  useEffect(() => {
    if (session?.error) {
      alert(`認証エラー: ${session.error}`);
      signOut();
    }
  }, [session]);

  // レポートの種類に応じて、対象期間の初期値を設定
  useEffect(() => {
    if (reportType === "daily") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setStartDate(today);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      setEndDate(endOfDay);
    } else {
      // meetingの場合は過去7日間をデフォルト期間とする
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      setStartDate(sevenDaysAgo);
      setEndDate(today);
    }
  }, [reportType]);

  // useCommitHistoryフックに渡すパラメータをメモ化
  const commitHistoryParams = useMemo(
    () => ({
      session,
      owner: githubOwner,
      repo: githubRepo,
      branch: selectedBranch,
      startDate,
      endDate,
      reportType,
    }),
    [session, githubOwner, githubRepo, selectedBranch, startDate, endDate, reportType]
  );

  // コミット履歴を取得
  const {
    commitHistory,
    isLoading: isLoadingCommits,
    error: commitError,
  } = useCommitHistory(commitHistoryParams);

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
          {reportType === "daily" ? (
            <DailyWorkTime startDate={startDate} endDate={endDate} />
          ) : (
            <MeetingWorkTime startDate={startDate} endDate={endDate} />
          )}
        </ErrorBoundary>
      </div>

      {/* レポート設定ヘッダー（日付・モデル選択） */}
      <ReportHeader
        initialReportType={reportType}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        model={model}
        handleSetModel={handleSetModel}
      />

      <div className="grid grid-cols-2 gap-8">
        {/* コミット履歴表示エリア */}
        <ErrorBoundary>
          <CommitHistoryView
            commitHistory={commitHistory}
            isLoading={isLoadingCommits}
            error={commitError}
          />
        </ErrorBoundary>
        {/* レポート生成・表示エリア */}
        <ErrorBoundary>
          <GeneratedReportView
            initialReportType={reportType}
            commitHistory={commitHistory}
            model={model}
            startDate={startDate}
            endDate={endDate}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
