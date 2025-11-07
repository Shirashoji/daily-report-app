// src/hooks/useCommitHistory.ts
import { useState, useEffect, useCallback } from 'react';
import { Session } from 'next-auth';
import type { CommitHistoryResponse, ApiResponse } from '@/types/api';
import type { ReportType } from '@/types/report';

interface UseCommitHistoryParams {
  session: Session | null;
  owner: string;
  repo: string;
  branch: string;
  startDate: Date;
  endDate: Date;
  reportType: ReportType;
}

interface UseCommitHistoryReturn {
  commitHistory: string;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch GitHub commit history.
 * @param {UseCommitHistoryParams} params - The parameters for the hook.
 * @returns {UseCommitHistoryReturn} The commit history, loading state, error, and a refetch function.
 * @example
 * const { commitHistory, isLoading, error, refetch } = useCommitHistory({
 *   session,
 *   owner: 'username',
 *   repo: 'repository',
 *   branch: 'main',
 *   startDate: new Date(),
 *   endDate: new Date(),
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
  const [commitHistory, setCommitHistory] = useState<string>('コミット履歴を読み込み中...');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCommits = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!owner || !repo || !session) {
        throw new Error('GitHubの情報を設定し、ログインしてください。');
      }

      const response = await fetch('/api/get-commits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(data.error || 'コミット履歴の取得に失敗しました。');
      }

      setCommitHistory(data.data?.commits || 'この期間のコミットはありませんでした。');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(new Error(errorMessage));
      setCommitHistory(`エラー: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [session, owner, repo, branch, startDate, endDate, reportType]);

  useEffect(() => {
    fetchCommits();
  }, [fetchCommits]);

  return { 
    commitHistory, 
    isLoading, 
    error,
    refetch: fetchCommits 
  };
}