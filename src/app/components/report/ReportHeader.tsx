
'use client';

import { formatDate } from '../../../lib/utils';

interface ReportHeaderProps {
  initialReportType: 'daily' | 'meeting';
  startDate: Date;
  endDate: Date;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  model: string;
  handleSetModel: (model: string) => void;
}

export default function ReportHeader({
  initialReportType,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  model,
  handleSetModel,
}: ReportHeaderProps) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-4">
      {initialReportType === 'daily' && (
        <div>
          <label htmlFor="date-select" className="block text-sm font-medium text-gray-700">対象日:</label>
          <input
            type="date"
            id="date-select"
            value={formatDate(startDate)}
            onChange={(e) => {
              const dateString = e.target.value;
              const date = new Date(dateString + 'T00:00:00.000Z');
              setStartDate(date);
              const endOfDay = new Date(dateString + 'T23:59:59.999Z');
              setEndDate(endOfDay);
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
              onChange={(e) => {
                const dateString = e.target.value;
                const utcDate = new Date(dateString + 'T00:00:00.000Z');
                setStartDate(utcDate);
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
          <div>
            <label htmlFor="end-date-select" className="block text-sm font-medium text-gray-700">終了日:</label>
            <input
              type="date"
              id="end-date-select"
              value={formatDate(endDate)}
              onChange={(e) => {
                const dateString = e.target.value;
                const utcDate = new Date(dateString + 'T00:00:00.000Z');
                setEndDate(utcDate);
              }}
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
        >
          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
        </select>
      </div>
    </div>
  );
}
