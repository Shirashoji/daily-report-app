import { useState } from 'react';
import { formatDate } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function useReportGenerator(
  commits: string,
  model: string,
  workTimes: { start: Date; end: Date | null; memo: string }[],
  targetDate: Date
) {
  const [generatedText, setGeneratedText] = useState('');

  const generateReport = async (reportType: 'daily' | 'meeting') => {
    setGeneratedText("レポート生成中...");

    let customVariables: Record<string, string> = {};
    const savedCustomVarsJson = localStorage.getItem('customVariables');
    if (savedCustomVarsJson) {
      try {
        customVariables = JSON.parse(savedCustomVarsJson);
      } catch (error) {
        console.error("Error parsing customVariables from localStorage:", error);
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commits,
          model,
          reportType,
          workTimes: workTimes.filter(wt => formatDate(wt.start) === formatDate(targetDate)),
          targetDate,
          customVariables, 
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setGeneratedText(data.report);
      } else {
        throw new Error(data.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error("Error generating report:", error);
      const message = error instanceof Error ? error.message : "不明なエラー";
      setGeneratedText(`日報の生成に失敗しました。: ${message}`);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      alert('日報をクリップボードにコピーしました。');
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      alert('クリップボードへのコピーに失敗しました。');
    }
  };

  return { generatedText, generateReport, copyToClipboard, setGeneratedText };
}
