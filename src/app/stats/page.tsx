// src/app/stats/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWorkTime } from '@/hooks/useWorkTime';
import { type WorkTime } from '@/contexts/WorkTimeContext';
import { formatDate } from '@/lib/utils';
import type { ReactElement } from 'react';

/**
 * Calculates the duration of work in minutes.
 * @param {Date} start - The start time.
 * @param {Date | null} end - The end time.
 * @returns {number} The duration in minutes.
 */
const calculateWorkDuration = (start: Date, end: Date | null): number => {
  if (!end) return 0;
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / 60000); // in minutes
};

/**
 * A page that displays statistics about work time.
 * @returns {React.ReactElement} The stats page.
 */
export default function StatsPage(): ReactElement {
  const { workTimes } = useWorkTime();
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [firstDate, setFirstDate] = useState<string | null>(null);

  useEffect(() => {
    if (workTimes.length > 0) {
      const firstEntry = new Date(workTimes[0].start);
      setFirstDate(formatDate(firstEntry));

      const total = workTimes.reduce((acc: number, wt: WorkTime) => {
        const startDate = new Date(wt.start);
        const endDate = wt.end ? new Date(wt.end) : null;
        return acc + calculateWorkDuration(startDate, endDate);
      }, 0);
      setTotalMinutes(total);
    }
  }, [workTimes]);

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
            {totalHours}<span className="text-3xl font-medium">時間</span> {remainingMinutes}<span className="text-3xl font-medium">分</span>
          </p>
        </div>
        <div className="p-6 bg-white border rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-600">最初の記録日</h2>
          <p className="text-4xl font-bold mt-2 text-gray-800">
            {firstDate ? firstDate.replace(/-/g, '/') : '記録がありません'}
          </p>
        </div>
      </div>
    </div>
  );
};
