// src/components/features/report/MeetingWorkTime.tsx
'use client';

import { useWorkTime } from '@/hooks/useWorkTime';
import { useDateContext } from '@/contexts/DateContext';
import { type WorkTime } from '@/contexts/WorkTimeContext';
import { formatDate, formatWorkTime, calculateWorkDuration } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { ReactElement } from 'react';

type WorkTimeWithOriginalIndex = WorkTime & { originalIndex: number };

/**
 * 作業記録のリストを日付ごとにグループ化するヘルパー関数。
 * @param {WorkTimeWithOriginalIndex[]} workTimes - グループ化する作業記録の配列。
 * @returns {Record<string, WorkTimeWithOriginalIndex[]>} 日付文字列をキーとし、その日の作業記録の配列を値とするオブジェクト。
 */
const groupWorkTimesByDay = (
  workTimes: WorkTimeWithOriginalIndex[]
): Record<string, WorkTimeWithOriginalIndex[]> => {
  const grouped: Record<string, WorkTimeWithOriginalIndex[]> = {};
  workTimes.forEach((wt) => {
    const dateStr = formatDate(wt.start);
    if (!grouped[dateStr]) {
      grouped[dateStr] = [];
    }
    grouped[dateStr].push(wt);
  });
  return grouped;
};

/**
 * MTG資料用に、指定された期間内の作業時間を日付ごとに集計して表示するコンポーネント。
 * @returns {ReactElement} 日付ごとの詳細な作業時間と合計時間をリスト表示するUI。
 */
export default function MeetingWorkTime(): ReactElement {
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

  // 元のインデックスを保持したまま、指定された日付範囲内の作業記録のみをフィルタリング
  const filteredWorkTimes = workTimes
    .map((wt, originalIndex) => ({ ...wt, originalIndex }))
    .filter((wt) => {
      const wtStart = new Date(wt.start);
      return wtStart >= startDate && wtStart <= endDate;
    });

  // フィルタリングされた作業記録を日付ごとにグループ化
  const groupedWorkTimes = groupWorkTimesByDay(filteredWorkTimes);
  // 期間内の総作業時間を計算
  const totalDuration = calculateTotalWorkDuration(filteredWorkTimes);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">
          記録された作業（{formatDate(startDate)} ~ {formatDate(endDate)}）
        </h3>
        <span className="text-lg font-medium">
          期間合計: {Math.floor(totalDuration / 60)}時間 {totalDuration % 60}分
        </span>
      </div>
      <div className="space-y-4">
        {Object.entries(groupedWorkTimes).map(([date, times]) => {
          // その日の合計作業時間を計算
          const dailyTotal = calculateTotalWorkDuration(times);
          return (
            <div key={date} className="p-4 border rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-semibold">{date}</h4>
                <span className="font-medium text-gray-700">
                  日次合計: {Math.floor(dailyTotal / 60)}時間 {dailyTotal % 60}分
                </span>
              </div>
              <ul className="space-y-2">
                {times.map((wt) => (
                  <li key={wt.originalIndex} className="p-3 bg-gray-50 rounded-md">
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
                          <span className="text-sm">
                            {formatWorkTime(wt.start)} 〜{' '}
                            {wt.end ? formatWorkTime(wt.end) : '作業中...'}
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
                      <pre className="whitespace-pre-wrap bg-white p-2 rounded text-xs text-gray-600">
                        {wt.memo}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
