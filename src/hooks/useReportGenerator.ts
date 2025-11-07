// src/hooks/useReportGenerator.ts
import { useState, useCallback } from 'react';
import type { ReportType } from '@/types/report';
import type { ApiResponse } from '@/types/api';

interface WorkTime {
  start: Date;
  end: Date | null;
  memo: string;
}

interface UseReportGeneratorParams {
  commits: string;
  model: string;
  workTimes: WorkTime[];
  startDate: Date;
  endDate: Date;
}

interface ReportResponse {
  report: string;
}

interface UseReportGeneratorReturn {
  generatedText: string;
  isLoading: boolean;
  error: string | null;
  generateReport: (reportType: ReportType) => Promise<void>;
  copyToClipboard: () => Promise<void>;
  setGeneratedText: (text: string) => void;
}

/**
 * Custom hook to generate a report using AI.
 * @param {UseReportGeneratorParams} params - The parameters for the hook.
 * @returns {UseReportGeneratorReturn} An object containing the generated text, loading state, error, and functions.
 */
export function useReportGenerator({
  commits,
  model,
  workTimes,
  startDate,
  endDate,
}: UseReportGeneratorParams): UseReportGeneratorReturn {
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async (reportType: ReportType): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setGeneratedText('レポート生成中...');

    let customVariables: Record<string, string> = {};
    try {
      const savedCustomVarsJson = localStorage.getItem('customVariables');
      if (savedCustomVarsJson) {
        customVariables = JSON.parse(savedCustomVarsJson);
      }
    } catch (e) {
      console.error('Error parsing customVariables from localStorage:', e);
    }

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commits,
          model,
          reportType,
          workTimes: workTimes.filter(wt => {
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
        throw new Error(data.error || 'Failed to generate report');
      }

      setGeneratedText(data.data?.report || '');
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラー';
      setError(message);
      setGeneratedText(`レポートの生成に失敗しました。: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [commits, model, workTimes, startDate, endDate]);

  const copyToClipboard = async (): Promise<void> => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
      alert('レポートをクリップボードにコピーしました。');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('クリップボードへのコピーに失敗しました。');
    }
  };

  return { generatedText, isLoading, error, generateReport, copyToClipboard, setGeneratedText };
}
