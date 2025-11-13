// src/hooks/useCommitHistory.ts
import { useState, useEffect, useCallback } from "react";
import { useDateContext } from "@/contexts/DateContext";
import type { ApiResponse } from "@/types/api";
import type { CommitData } from "@/types/github";

/**
 * `useCommitHistory`フックに渡すパラメータの型定義。
 */
interface UseCommitHistoryParams {
  owner: string;
  repo: string;
  branch: string;
}

/**
 * `useCommitHistory`フックが返す値の型定義。
 */
interface UseCommitHistoryReturn {
  commits: CommitData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * GitHubのコミット履歴を取得するためのカスタムフック。
 *
 * @param {UseCommitHistoryParams} params - フックの動作に必要なパラメータ。
 * @returns {UseCommitHistoryReturn} コミットデータ、読み込み状態、エラー情報、および再取得関数を含むオブジェクト。
 */
export function useCommitHistory({
  owner,
  repo,
  branch,
}: UseCommitHistoryParams): UseCommitHistoryReturn {
  const { startDate, endDate } = useDateContext();
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCommits = useCallback(async (): Promise<void> => {
    // ownerやrepoが未設定の場合はAPIを叩かずに早期リターン
    if (!owner || !repo) {
      setCommits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/get-commits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          branch,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      const data: ApiResponse<CommitData[]> = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "コミット履歴の取得に失敗しました。");
      }

      setCommits(data.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "不明なエラーが発生しました。";
      setError(new Error(errorMessage));
      setCommits([]); // エラー時はコミットデータを空にする
    } finally {
      setIsLoading(false);
    }
  }, [owner, repo, branch, startDate, endDate]);

  useEffect(() => {
    fetchCommits();
  }, [fetchCommits]);

  return {
    commits,
    isLoading,
    error,
    refetch: fetchCommits,
  };
}