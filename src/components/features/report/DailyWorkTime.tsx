// src/components/features/report/DailyWorkTime.tsx
'use client';

import { useWorkTime } from '@/hooks/useWorkTime';
import { type WorkTime } from '@/contexts/WorkTimeContext';
import { formatDate, formatWorkTime, calculateWorkDuration } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { ReactElement } from 'react';

interface DailyWorkTimeProps {
  startDate: Date;
  endDate: Date;
}

/**
 * A component to display and manage daily work time entries.
 * @component
 */
export default function DailyWorkTime({ startDate, endDate }: DailyWorkTimeProps): ReactElement {
  const {
    workTimes,
    editingWorkTimeIndex,
    handleEditWorkTime,
    handleSaveWorkTime,
    handleCancelEdit,
    handleDeleteWorkTime,
    calculateTotalWorkDuration,
  } = useWorkTime();

  const dailyWorkTimes = workTimes.filter((wt: WorkTime) => {
    const wtStart = new Date(wt.start);
    return wtStart >= startDate && wtStart <= endDate;
  });

  const totalDuration = calculateTotalWorkDuration(dailyWorkTimes);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">記録された作業（{formatDate(startDate)}）</h3>
        <span className="text-lg font-medium">
          合計: {Math.floor(totalDuration / 60)}時間 {totalDuration % 60}分
        </span>
      </div>
      <ul className="space-y-2">
        {workTimes
          .map((wt: WorkTime, originalIndex: number) => ({ ...wt, originalIndex }))
          .filter((wt: WorkTime & { originalIndex: number }) => new Date(wt.start) >= startDate && new Date(wt.start) <= endDate)
          .map((wt: WorkTime & { originalIndex: number }) => (
            <li key={wt.originalIndex} className="p-3 bg-gray-100 rounded-md">
              <div className="flex items-center justify-between mb-2">
                {editingWorkTimeIndex === wt.originalIndex ? (
                  <>
                    <input
                      type="time"
                      defaultValue={formatWorkTime(wt.start)}
                      id={`start-time-${wt.originalIndex}`}
                      className="border-gray-300 rounded-md"
                    />
                    <span className="mx-2">〜</span>
                    <input
                      type="time"
                      defaultValue={wt.end ? formatWorkTime(wt.end) : ''}
                      id={`end-time-${wt.originalIndex}`}
                      className="border-gray-300 rounded-md"
                    />
                    <div className="ml-auto flex space-x-2">
                      <Button size="sm" onClick={() => handleSaveWorkTime(wt.originalIndex, (document.getElementById(`start-time-${wt.originalIndex}`) as HTMLInputElement).value, (document.getElementById(`end-time-${wt.originalIndex}`) as HTMLInputElement).value)}>保存</Button>
                      <Button size="sm" variant="secondary" onClick={handleCancelEdit}>キャンセル</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span>
                      {formatWorkTime(wt.start)} 〜 {wt.end ? formatWorkTime(wt.end) : '作業中...'}
                      {wt.end && ` (${calculateWorkDuration(wt.start, wt.end)}分)`}
                    </span>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => handleEditWorkTime(wt.originalIndex)}>編集</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteWorkTime(wt.originalIndex)}>削除</Button>
                    </div>
                  </>
                )}
              </div>
              {wt.memo && (
                <pre className="whitespace-pre-wrap bg-white p-2 rounded text-sm">{wt.memo}</pre>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
