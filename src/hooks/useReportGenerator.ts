// src/hooks/useReportGenerator.ts
import { useState, useCallback } from 'react';
import { useDateContext } from '@/contexts/DateContext';
import type { ReportType } from '@/types/report';
import type { ApiResponse } from '@/types/api';
import type { CommitData } from '@/types/github';

/**
 * 作業時間の情報を格納するインターフェース。
 */
interface WorkTime {
  /** 作業開始日時。 */
  start: Date;
  /** 作業終了日時。 */
  end: Date | null;
  /** 作業内容のメモ。 */
  memo: string;
}

/**
 * `useReportGenerator`フックに渡すパラメータの型定義。
 */
interface UseReportGeneratorParams {
  /** レポートに含めるコミットデータの配列。 */
  commits: CommitData[];
  /** レポート生成に使用するAIモデル名。 */
  model: string;
  /** 作業時間のリスト。 */
  workTimes: WorkTime[];
}

/**
 * レポート生成APIのレスポンスの型定義。
 */
interface ReportResponse {
  /** 生成されたレポートのテキスト。 */
  report: string;
}

/**
 * `useReportGenerator`フックが返す値の型定義。
 */
interface UseReportGeneratorReturn {
  /** AIによって生成されたレポートのテキスト。 */
  generatedText: string;
  /** レポート生成中の読み込み状態を示すフラグ。 */
  isLoading: boolean;
  /** 発生したエラーメッセージ。 */
  error: string | null;
  /** レポートを生成する非同期関数。 */
  generateReport: (reportType: ReportType) => Promise<void>;
  /** 生成されたレポートをクリップボードにコピーする関数。 */
  copyToClipboard: () => Promise<void>;
  /** 生成されたテキストを外部から設定する関数。 */
  setGeneratedText: (text: string) => void;
}

/**
 * コミット履歴や作業時間などの情報から、AIを使用してレポートを生成するためのカスタムフック。
 * @param {UseReportGeneratorParams} params - レポート生成に必要なパラメータ。
 * @returns {UseReportGeneratorReturn} 生成されたレポートテキスト、状態、および関連操作の関数を含むオブジェクト。
 */
export function useReportGenerator({
  commits,
  model,
  workTimes,
}: UseReportGeneratorParams): UseReportGeneratorReturn {
  const { startDate, endDate } = useDateContext();
  // 生成されたレポートテキストを保持するstate
  const [generatedText, setGeneratedText] = useState('');
  // レポート生成中の読み込み状態を管理するstate
  const [isLoading, setIsLoading] = useState(false);
  // エラーメッセージを保持するstate
  const [error, setError] = useState<string | null>(null);

  /**
   * APIにリクエストを送信し、レポートを生成する。
   * @param {ReportType} reportType - 生成するレポートの種類（'daily' または 'meeting'）。
   */
  const generateReport = useCallback(
    async (reportType: ReportType): Promise<void> => {
      setIsLoading(true);
      setError(null);
      setGeneratedText('レポート生成中...');

      // localStorageからカスタム変数を読み込む
      let customVariables: Record<string, string> = {};
      try {
        const savedCustomVarsJson = localStorage.getItem('customVariables');
        if (savedCustomVarsJson) {
          customVariables = JSON.parse(savedCustomVarsJson);
        }
      } catch (e) {
        console.error('localStorageからカスタム変数の解析中にエラーが発生しました:', e);
      }

      try {
        const response = await fetch('/api/generate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commits,
            model,
            reportType,
            // 指定された期間内の作業時間のみをフィルタリング
            workTimes: workTimes.filter((wt) => {
              const wtStart = new Date(wt.start);
              return wtStart >= startDate && wtStart <= endDate;
            }),
            startDate,
            endDate,
            customVariables,
          }),
        });

        const data: ApiResponse<ReportResponse> = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error || 'レポートの生成に失敗しました。');
        }

        setGeneratedText(data.data?.report || '');
      } catch (err) {
        const message = err instanceof Error ? err.message : '不明なエラーが発生しました。';
        setError(message);
        setGeneratedText(`レポートの生成に失敗しました。: ${message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [commits, model, workTimes, startDate, endDate]
  );

  /**
   * 生成されたレポートテキストをクリップボードにコピーする。
   */
  const copyToClipboard = async (): Promise<void> => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
      alert('レポートをクリップボードにコピーしました。');
    } catch (err) {
      console.error('クリップボードへのコピーに失敗しました:', err);
      alert('クリップボードへのコピーに失敗しました。');
    }
  };

  return {
    generatedText,
    isLoading,
    error,
    generateReport,
    copyToClipboard,
    setGeneratedText,
  };
}
