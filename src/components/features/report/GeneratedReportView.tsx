// src/components/features/report/GeneratedReportView.tsx
'use client';

import { useReportGenerator } from '@/hooks/useReportGenerator';
import { useWorkTime } from '@/hooks/useWorkTime';
import { Button } from '@/components/ui/Button';
import type { ReportType } from '@/types/report';
import type { ReactElement } from 'react';

interface GeneratedReportViewProps {
  initialReportType: ReportType;
  commitHistory: string;
  model: string;
  startDate: Date;
  endDate: Date;
}

/**
 * A component for displaying the generated report and interacting with the report generator.
 * @component
 */
export default function GeneratedReportView({
  initialReportType,
  commitHistory,
  model,
  startDate,
  endDate,
}: GeneratedReportViewProps): ReactElement {
  const { workTimes } = useWorkTime();
  const {
    generatedText,
    isLoading,
    error,
    generateReport,
    copyToClipboard,
    setGeneratedText,
  } = useReportGenerator({ commitHistory, model, workTimes, startDate, endDate });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">生成された{initialReportType === 'daily' ? '日報' : 'MTG資料'}</h2>
      <textarea
        className="w-full h-96 p-2 border rounded-md bg-gray-50"
        value={generatedText}
        onChange={(e) => setGeneratedText(e.target.value)}
        placeholder="ここにレポートが生成されます..."
      />
      <div className="mt-4 flex items-center space-x-2">
        <Button
          onClick={() => generateReport(initialReportType)}
          isLoading={isLoading}
          disabled={isLoading}
        >
          {initialReportType === 'daily' ? '日報を生成' : 'MTG資料を生成'}
        </Button>
        <Button
          variant="secondary"
          onClick={copyToClipboard}
          disabled={!generatedText || isLoading}
        >
          クリップボードにコピー
        </Button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">エラー: {error}</p>}
    </div>
  );
}
