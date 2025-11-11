// src/components/features/report/MeetingWorkTime.tsx
"use client";

import { useWorkTime } from "@/hooks/useWorkTime";
import { type WorkTime } from "@/contexts/WorkTimeContext";
import { formatDate } from "@/lib/utils";
import type { ReactElement } from "react";

/**
 * 作業記録のリストを日付ごとにグループ化するヘルパー関数。
 * @param {WorkTime[]} workTimes - グループ化する作業記録の配列。
 * @returns {Record<string, WorkTime[]>} 日付文字列をキーとし、その日の作業記録の配列を値とするオブジェクト。
 */
const groupWorkTimesByDay = (
  workTimes: WorkTime[]
): Record<string, WorkTime[]> => {
  const grouped: Record<string, WorkTime[]> = {};
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
 * `MeetingWorkTime`コンポーネントのプロパティの型定義。
 */
interface MeetingWorkTimeProps {
  /** 表示対象期間の開始日時。 */
  startDate: Date;
  /** 表示対象期間の終了日時。 */
  endDate: Date;
}

/**
 * MTG資料用に、指定された期間内の作業時間を日付ごとに集計して表示するコンポーネント。
 * @param {MeetingWorkTimeProps} props - コンポーネントのプロパティ。
 * @returns {ReactElement} 日付ごとの合計作業時間をリスト表示するUI。
 */
export default function MeetingWorkTime({
  startDate,
  endDate,
}: MeetingWorkTimeProps): ReactElement {
  const { workTimes, calculateTotalWorkDuration } = useWorkTime();

  // 指定された日付範囲内の作業記録のみをフィルタリング
  const filteredWorkTimes = workTimes.filter((wt: WorkTime) => {
    const wtStart = new Date(wt.start);
    return wtStart >= startDate && wtStart <= endDate;
  });

  // フィルタリングされた作業記録を日付ごとにグループ化
  const groupedWorkTimes = groupWorkTimesByDay(filteredWorkTimes);
  // 期間内の総作業時間を計算
  const totalDuration = calculateTotalWorkDuration(filteredWorkTimes);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">
          記録された作業（{formatDate(startDate)} ~ {formatDate(endDate)}）
        </h3>
        <span className="text-lg font-medium">
          合計: {Math.floor(totalDuration / 60)}時間 {totalDuration % 60}分
        </span>
      </div>
      <ul className="space-y-2">
        {Object.entries(groupedWorkTimes).map(([date, times]) => {
          // その日の合計作業時間を計算
          const dailyTotal = calculateTotalWorkDuration(times);
          return (
            <li key={date} className="p-3 bg-gray-100 rounded-md">
              <div className="flex items-center justify-between">
                <span className="font-medium">{date}</span>
                <span>
                  合計: {Math.floor(dailyTotal / 60)}時間 {dailyTotal % 60}分
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
