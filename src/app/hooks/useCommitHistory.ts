import { useState, useEffect } from 'react';
import { Session } from 'next-auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function useCommitHistory(
  session: Session | null,
  owner: string,
  repo: string,
  branch: string,
  startDate: Date,
  endDate: Date,
  reportType: string
) {
  const [commitHistory, setCommitHistory] = useState('コミット履歴を読み込み中...');

  useEffect(() => {
    const fetchCommits = async () => {
      setCommitHistory(`コミット履歴を読み込み中...`);
      try {
        const startDateString = formatDate(startDate);
        const endDateString = formatDate(endDate);
        if (!owner || !repo || !session) {
          setCommitHistory('GitHubの情報を設定し、ログインしてください。');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/get-commits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner,
            repo,
            branch,
            startDate: startDateString,
            endDate: endDateString,
            reportType,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setCommitHistory(data.commits || 'この期間のコミットはありませんでした。');
        } else {
          setCommitHistory(`コミット履歴の取得に失敗しました。\n${data.error || ''}`);
        }
      } catch (error) {
        console.error("Error fetching commits:", error);
        setCommitHistory('コミット履歴の取得に失敗しました。');
      }
    };
    fetchCommits();
  }, [startDate, endDate, reportType, owner, repo, branch, session]);

  return { commitHistory };
}

import { formatDate } from '@/lib/utils';
