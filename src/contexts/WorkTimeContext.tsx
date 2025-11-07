// src/contexts/WorkTimeContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface WorkTime {
  start: Date;
  end: Date | null;
  memo: string;
}

interface RawWorkTime {
  start: string;
  end: string | null;
  memo: string;
}

interface WorkTimeContextType {
  workTimes: WorkTime[];
  isWorking: boolean;
  currentMemo: string;
  editingWorkTimeIndex: number | null;
  handleStartWork: () => void;
  handleEndWork: () => void;
  setCurrentMemo: (memo: string) => void;
  handleEditWorkTime: (index: number) => void;
  handleSaveWorkTime: (index: number, newStart: string, newEnd: string) => void;
  handleCancelEdit: () => void;
  handleDeleteWorkTime: (index: number) => void;
  calculateTotalWorkDuration: (workTimes: WorkTime[]) => number;
  importWorkTimes: (jsonString: string) => void;
  setWorkTimes: (workTimes: WorkTime[]) => void;
}

const WorkTimeContext = createContext<WorkTimeContextType | undefined>(undefined);

/**
 * Provides work time tracking functionality to its children.
 * Manages work time entries, including starting, stopping, editing, and deleting.
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The component's children.
 */
export function WorkTimeProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [workTimes, setWorkTimes] = useState<WorkTime[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [currentMemo, setCurrentMemo] = useState('');
  const [editingWorkTimeIndex, setEditingWorkTimeIndex] = useState<number | null>(null);

  useEffect(() => {
    try {
      const savedWorkTimesJson = localStorage.getItem('workTimes');
      if (savedWorkTimesJson) {
        const parsed = JSON.parse(savedWorkTimesJson).map((wt: RawWorkTime) => ({
          start: new Date(wt.start),
          end: wt.end ? new Date(wt.end) : null,
          memo: wt.memo || '',
        }));
        setWorkTimes(parsed);
        const lastWorkTime = parsed[parsed.length - 1];
        setIsWorking(lastWorkTime && lastWorkTime.end === null);
      }
    } catch (error) {
      console.error("Error parsing workTimes from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('workTimes', JSON.stringify(workTimes));
    } catch (error) {
      console.error("Error saving workTimes to localStorage:", error);
    }
  }, [workTimes]);

  const handleStartWork = useCallback(() => {
    setWorkTimes(prev => [...prev, { start: new Date(), end: null, memo: '' }]);
    setIsWorking(true);
  }, []);

  const handleEndWork = useCallback(() => {
    setWorkTimes(prev => {
      const newWorkTimes = [...prev];
      const lastWorkTime = newWorkTimes[newWorkTimes.length - 1];
      if (lastWorkTime && lastWorkTime.end === null) {
        lastWorkTime.end = new Date();
        lastWorkTime.memo = currentMemo;
        // Prevent saving 0-minute entries
        if (calculateWorkDuration(lastWorkTime.start, lastWorkTime.end) > 0) {
          return newWorkTimes;
        }
        return newWorkTimes.slice(0, -1);
      }
      return prev;
    });
    setIsWorking(false);
    setCurrentMemo('');
  }, [currentMemo]);

  const calculateWorkDuration = (start: Date, end: Date | null): number => {
    if (!end) return 0;
    return Math.round((end.getTime() - start.getTime()) / 60000);
  };

  const calculateTotalWorkDuration = (times: WorkTime[]): number => {
    return times.reduce((total, wt) => total + calculateWorkDuration(wt.start, wt.end), 0);
  };

  const handleEditWorkTime = (index: number): void => {
    setEditingWorkTimeIndex(index);
  };

  const handleSaveWorkTime = (index: number, newStart: string, newEnd: string): void => {
    setWorkTimes(prev => {
      const newWorkTimes = [...prev];
      const target = newWorkTimes[index];
      
      const startDate = new Date(target.start);
      const [startHours, startMinutes] = newStart.split(':').map(Number);
      startDate.setHours(startHours, startMinutes);

      let endDate: Date | null = null;
      if (target.end) {
        endDate = new Date(target.end);
        const [endHours, endMinutes] = newEnd.split(':').map(Number);
        endDate.setHours(endHours, endMinutes);
        if (endDate < startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
      }
      
      newWorkTimes[index] = { ...target, start: startDate, end: endDate };
      return newWorkTimes;
    });
    setEditingWorkTimeIndex(null);
  };

  const handleCancelEdit = (): void => {
    setEditingWorkTimeIndex(null);
  };

  const handleDeleteWorkTime = (index: number): void => {
    if (window.confirm('この作業記録を削除しますか？')) {
      setWorkTimes(prev => prev.filter((_, i) => i !== index));
    }
  };

  const importWorkTimes = (jsonString: string): void => {
    try {
      const parsed: WorkTime[] = JSON.parse(jsonString).map((wt: RawWorkTime) => ({
        start: new Date(wt.start),
        end: wt.end ? new Date(wt.end) : null,
        memo: wt.memo || '',
      }));
      if (!Array.isArray(parsed) || parsed.some((wt: WorkTime) => !wt.start)) {
        throw new Error("Invalid JSON format");
      }
      setWorkTimes(parsed);
      const lastWorkTime = parsed[parsed.length - 1];
      setIsWorking(lastWorkTime && lastWorkTime.end === null);
      alert("作業時間データをインポートしました。");
    } catch (error) {
      console.error("Error importing work times:", error);
      alert("作業時間データのインポートに失敗しました。JSONの形式を確認してください。");
    }
  };

  const value = {
    workTimes,
    isWorking,
    currentMemo,
    editingWorkTimeIndex,
    handleStartWork,
    handleEndWork,
    setCurrentMemo,
    handleEditWorkTime,
    handleSaveWorkTime,
    handleCancelEdit,
    handleDeleteWorkTime,
    calculateTotalWorkDuration,
    importWorkTimes,
    setWorkTimes,
  };

  return <WorkTimeContext.Provider value={value}>{children}</WorkTimeContext.Provider>;
}

/**
 * Custom hook to access the work time context.
 * Must be used within a WorkTimeProvider.
 * @returns {WorkTimeContextType} The work time context.
 */
export function useWorkTimeContext(): WorkTimeContextType {
  const context = useContext(WorkTimeContext);
  if (context === undefined) {
    throw new Error('useWorkTimeContext must be used within a WorkTimeProvider');
  }
  return context;
}
