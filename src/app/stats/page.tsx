// src/app/stats/page.tsx
"use client";

import { useState, useEffect, ReactElement } from "react";
import Link from "next/link";
import { useWorkTime } from "@/hooks/useWorkTime";
import { type WorkTime } from "@/contexts/WorkTimeContext";
import { formatDate } from "@/lib/utils";

/**
 * 開始日時と終了日時の差を分単位で計算します。
 * @param {Date} start - 開始日時。
 * @param {Date | null} end - 終了日時。
 * @returns {number} 経過時間（分）。終了日時がない場合は0を返します。
 */
const calculateWorkDuration = (start: Date, end: Date | null): number => {
  if (!end) return 0;
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / 60000); // 分単位に変換
};

/**
 * 記録された作業時間の統計情報を表示するページコンポーネント。
 * @returns {ReactElement} 統計情報ページのUI。
 */
export default function StatsPage(): ReactElement {
  // 作業時間コンテキストから記録を取得
  const { workTimes } = useWorkTime();
  // 総作業時間（分）を管理するstate
  const [totalMinutes, setTotalMinutes] = useState(0);
  // 最初の記録日を管理するstate
  const [firstDate, setFirstDate] = useState<string | null>(null);

  // workTimesが変更された時に統計情報を再計算する
  useEffect(() => {
    if (workTimes.length > 0) {
      // 最初の記録日を設定
      const firstEntry = new Date(workTimes[0].start);
      setFirstDate(formatDate(firstEntry));

      // 総作業時間を計算
      const total = workTimes.reduce((acc: number, wt: WorkTime) => {
        const startDate = new Date(wt.start);
        const endDate = wt.end ? new Date(wt.end) : null;
        return acc + calculateWorkDuration(startDate, endDate);
      }, 0);
      setTotalMinutes(total);
    }
  }, [workTimes]);

  // 表示用に合計時間を「時間」と「分」に分ける
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">作業時間統計</h1>
        <Link href="/daily" className="text-blue-600 hover:underline">
          レポート作成ページに戻る
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-white border rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-600">総作業時間</h2>
          <p className="text-5xl font-bold mt-2 text-gray-800">
            {totalHours}
            <span className="text-3xl font-medium">時間</span> {remainingMinutes}
            <span className="text-3xl font-medium">分</span>
          </p>
        </div>
        <div className="p-6 bg-white border rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-600">最初の記録日</h2>
          <p className="text-4xl font-bold mt-2 text-gray-800">
            {firstDate ? firstDate.replace(/-/g, "/") : "記録がありません"}
          </p>
        </div>
      </div>
    </div>
  );
}
