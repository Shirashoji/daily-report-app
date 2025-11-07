// src/components/features/report/MeetingWorkTime.tsx
'use client';

import { useWorkTime } from '@/hooks/useWorkTime';
import { formatDate } from '@/lib/utils';
import type { ReactElement } from 'react';

interface WorkTime {
  start: Date;
  end: Date | null;
  memo: string;
}

const groupWorkTimesByDay = (workTimes: WorkTime[]): Record<string, WorkTime[]> => {
  const grouped: Record<string, WorkTime[]> = {};
  workTimes.forEach(wt => {
    const dateStr = formatDate(wt.start);
    if (!grouped[dateStr]) {
      grouped[dateStr] = [];
    }
    grouped[dateStr].push(wt);
  });
  return grouped;
};

interface MeetingWorkTimeProps {
  startDate: Date;
  endDate: Date;
}

/**
 * A component to display a summary of work times for a meeting report, grouped by day.
 * @component
 */
export default function MeetingWorkTime({ startDate, endDate }: MeetingWorkTimeProps): ReactElement {
  const { workTimes, calculateTotalWorkDuration } = useWorkTime();

  const filteredWorkTimes = workTimes.filter(wt => {
    const wtStart = new Date(wt.start);
    return wtStart >= startDate && wtStart <= endDate;
  });

  const groupedWorkTimes = groupWorkTimesByDay(filteredWorkTimes);
  const totalDuration = calculateTotalWorkDuration(filteredWorkTimes);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">記録された作業（{formatDate(startDate)} ~ {formatDate(endDate)}）</h3>
        <span className="text-lg font-medium">
          合計: {Math.floor(totalDuration / 60)}時間 {totalDuration % 60}分
        </span>
      </div>
      <ul className="space-y-2">
        {Object.entries(groupedWorkTimes).map(([date, times]) => {
          const dailyTotal = calculateTotalWorkDuration(times);
          return (
            <li key={date} className="p-3 bg-gray-100 rounded-md">
              <div className="flex items-center justify-between">
                <span className="font-medium">{date}</span>
                <span>合計: {Math.floor(dailyTotal / 60)}時間 {dailyTotal % 60}分</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
