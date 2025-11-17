// src/components/features/report/DailyWorkTime.tsx
'use client';

import { useWorkTime } from '@/hooks/useWorkTime';
import { useDateContext } from '@/contexts/DateContext';
import { type WorkTime } from '@/contexts/WorkTimeContext';
import { formatDate, formatWorkTime, calculateWorkDuration } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { ReactElement } from 'react';

/**
 * 指定された一日の作業時間エントリを表示し、管理（編集・削除）するためのコンポーネント。
 * @returns {ReactElement} 日々の作業時間を表示・管理するUI。
 */
export default function DailyWorkTime(): ReactElement {
  const { startDate, endDate } = useDateContext();
  const {
    workTimes,
    editingWorkTimeIndex,
    handleEditWorkTime,
    handleSaveWorkTime,
    handleCancelEdit,
    handleDeleteWorkTime,
    calculateTotalWorkDuration,
  } = useWorkTime();

  // 指定された日付範囲内の作業記録のみをフィルタリング
  const dailyWorkTimes = workTimes.filter((wt: WorkTime) => {
    const wtStart = new Date(wt.start);
    return wtStart >= startDate && wtStart <= endDate;
  });

  // フィルタリングされた作業記録の合計時間を計算
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
          // 元のインデックスを保持したままフィルタリングとマッピングを行う
          .map((wt: WorkTime, originalIndex: number) => ({
            ...wt,
            originalIndex,
          }))
          .filter(
            (wt: WorkTime & { originalIndex: number }) =>
              new Date(wt.start) >= startDate && new Date(wt.start) <= endDate
          )
          .map((wt: WorkTime & { originalIndex: number }) => (
            <li key={wt.originalIndex} className="p-3 bg-gray-100 rounded-md">
              <div className="flex items-center justify-between mb-2">
                {editingWorkTimeIndex === wt.originalIndex ? (
                  // 編集モードのUI
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
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSaveWorkTime(
                            wt.originalIndex,
                            (
                              document.getElementById(
                                `start-time-${wt.originalIndex}`
                              ) as HTMLInputElement
                            ).value,
                            (
                              document.getElementById(
                                `end-time-${wt.originalIndex}`
                              ) as HTMLInputElement
                            ).value
                          )
                        }
                      >
                        保存
                      </Button>
                      <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                        キャンセル
                      </Button>
                    </div>
                  </>
                ) : (
                  // 通常表示モードのUI
                  <>
                    <span>
                      {formatWorkTime(wt.start)} 〜 {wt.end ? formatWorkTime(wt.end) : '作業中...'}
                      {wt.end && ` (${calculateWorkDuration(wt.start, wt.end)}分)`}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditWorkTime(wt.originalIndex)}
                      >
                        編集
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteWorkTime(wt.originalIndex)}
                      >
                        削除
                      </Button>
                    </div>
                  </>
                )}
              </div>
              {/* メモが存在する場合に表示 */}
              {wt.memo && (
                <pre className="whitespace-pre-wrap bg-white p-2 rounded text-sm">{wt.memo}</pre>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
