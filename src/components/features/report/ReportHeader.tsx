// src/components/features/report/ReportHeader.tsx
'use client';

import { formatDate } from '@/lib/utils';
import { useGeminiModels } from '@/hooks/useGeminiModels';
import type { ReportType } from '@/types/report';
import type { ReactElement } from 'react';

interface ReportHeaderProps {
  initialReportType: ReportType;
  startDate: Date;
  endDate: Date;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  model: string;
  handleSetModel: (model: string) => void;
}

/**
 * A component for the header section of the report page,
 * including date and model selection.
 * @component
 */
export default function ReportHeader({
  initialReportType,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  model,
  handleSetModel,
}: ReportHeaderProps): ReactElement {
  const { models, isLoading, error } = useGeminiModels();

  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      {initialReportType === 'daily' && (
        <div>
          <label htmlFor="date-select" className="block text-sm font-medium text-gray-700">対象日:</label>
          <input
            type="date"
            id="date-select"
            value={formatDate(startDate)}
            onChange={(e) => {
              const date = new Date(e.target.value + 'T00:00:00Z');
              setStartDate(date);
              setEndDate(new Date(e.target.value + 'T23:59:59Z'));
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          />
        </div>
      )}
      {initialReportType === 'meeting' && (
        <>
          <div>
            <label htmlFor="start-date-select" className="block text-sm font-medium text-gray-700">開始日:</label>
            <input
              type="date"
              id="start-date-select"
              value={formatDate(startDate)}
              onChange={(e) => setStartDate(new Date(e.target.value + 'T00:00:00Z'))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
          <div>
            <label htmlFor="end-date-select" className="block text-sm font-medium text-gray-700">終了日:</label>
            <input
              type="date"
              id="end-date-select"
              value={formatDate(endDate)}
              onChange={(e) => setEndDate(new Date(e.target.value + 'T23:59:59Z'))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
        </>
      )}
      <div>
        <label htmlFor="model-select" className="block text-sm font-medium text-gray-700">Geminiモデルを選択:</label>
        <select
          id="model-select"
          value={model}
          onChange={(e) => handleSetModel(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          disabled={isLoading || !!error}
        >
          {isLoading && <option>Loading models...</option>}
          {error && <option>Error loading models</option>}
          {!isLoading && !error && models.map(m => (
            <option key={m.name} value={m.name}>
              {m.displayName}
            </option>
          ))}
        </select>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    </div>
  );
}