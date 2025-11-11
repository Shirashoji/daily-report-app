// src/hooks/useCommitHistory.ts
import { useState, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import type { CommitHistoryResponse, ApiResponse } from "@/types/api";
import type { ReportType } from "@/types/report";

/**
 * `useCommitHistory`フックに渡すパラメータの型定義。
 */
interface UseCommitHistoryParams {
  /** ユーザーの認証セッション情報。 */
  session: Session | null;
  /** GitHubリポジトリのオーナー名。 */
  owner: string;
  /** GitHubリポジトリ名。 */
  repo: string;
  /** 取得対象のブランチ名。 */
  branch: string;
  /** 履歴取得の開始日時。 */
  startDate: Date;
  /** 履歴取得の終了日時。 */
  endDate: Date;
  /** レポートの種類（日報または議事録）。 */
  reportType: ReportType;
}

/**
 * `useCommitHistory`フックが返す値の型定義。
 */
interface UseCommitHistoryReturn {
  /** 取得したコミット履歴の文字列。 */
  commitHistory: string;
  /** データの読み込み状態を示すフラグ。 */
  isLoading: boolean;
  /** 発生したエラーオブジェクト。 */
  error: Error | null;
  /** コミット履歴を再取得するための関数。 */
  refetch: () => Promise<void>;
}

/**
 * GitHubのコミット履歴を取得するためのカスタムフック。
 *
 * @param {UseCommitHistoryParams} params - フックの動作に必要なパラメータ。
 * @returns {UseCommitHistoryReturn} コミット履歴、読み込み状態、エラー情報、および再取得関数を含むオブジェクト。
 * @example
 * const { commitHistory, isLoading, error, refetch } = useCommitHistory({
 *   session,
 *   owner: 'username',
 *   repo: 'repository',
 *   branch: 'main',
 *   startDate: new Date('2023-01-01'),
 *   endDate: new Date('2023-01-02'),
 *   reportType: 'daily'
 * });
 */
export function useCommitHistory({
  session,
  owner,
  repo,
  branch,
  startDate,
  endDate,
  reportType,
}: UseCommitHistoryParams): UseCommitHistoryReturn {
  // 取得したコミット履歴の文字列を保持するstate
  const [commitHistory, setCommitHistory] =
    useState<string>("コミット履歴を読み込み中...");
  // データの読み込み状態を管理するstate
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // エラー情報を保持するstate
  const [error, setError] = useState<Error | null>(null);

  /**
   * APIにリクエストを送信し、コミット履歴を取得する関数。
   * useCallbackを使用して、依存配列の変数が変更された場合のみ関数を再生成する。
   */
  const fetchCommits = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!owner || !repo || !session) {
        throw new Error("GitHubの情報を設定し、ログインしてください。");
      }

      const response = await fetch("/api/get-commits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          branch,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reportType,
        }),
      });

      const data: ApiResponse<CommitHistoryResponse> = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "コミット履歴の取得に失敗しました。");
      }

      setCommitHistory(
        data.data?.commits || "この期間のコミットはありませんでした。"
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "不明なエラーが発生しました。";
      setError(new Error(errorMessage));
      setCommitHistory(`エラー: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [session, owner, repo, branch, startDate, endDate, reportType]);

  // コンポーネントのマウント時やfetchCommits関数が変更された時に履歴を取得する
  useEffect(() => {
    fetchCommits();
  }, [fetchCommits]);

  return {
    commitHistory,
    isLoading,
    error,
    refetch: fetchCommits,
  };
}