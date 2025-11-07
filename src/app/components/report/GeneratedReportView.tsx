'use client';

import { useReportGenerator } from '../../hooks/useReportGenerator';
import { useWorkTime } from '../../hooks/useWorkTime';

interface GeneratedReportViewProps {
  initialReportType: 'daily' | 'meeting';
  commitHistory: string;
  model: string;
  startDate: Date;
  endDate: Date;
}

export default function GeneratedReportView({
  initialReportType,
  commitHistory,
  model,
  startDate,
  endDate,
}: GeneratedReportViewProps) {
  const { workTimes } = useWorkTime();
  const {
    generatedText,
    generateReport,
    copyToClipboard,
  } = useReportGenerator(commitHistory, model, workTimes, startDate, endDate);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">生成された{initialReportType === 'daily' ? '日報' : 'MTG資料'}</h2>
      <textarea
        className="w-full h-96 p-2 border rounded-md"
        value={generatedText}
        readOnly
      />
      <div className="mt-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => generateReport(initialReportType)}
        >
          {initialReportType === 'daily' ? '日報を生成' : 'MTG資料を生成'}
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
          onClick={copyToClipboard}
          disabled={!generatedText}
        >
          クリップボードにコピー
        </button>
      </div>
    </div>
  );
}
