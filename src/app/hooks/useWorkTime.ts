import { useState, useEffect } from 'react';

export function useWorkTime() {
  const [workTimes, setWorkTimes] = useState<{ start: Date; end: Date | null; memo: string }[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [currentMemo, setCurrentMemo] = useState('');
  const [editingWorkTimeIndex, setEditingWorkTimeIndex] = useState<number | null>(null);

  useEffect(() => {
    const savedWorkTimesJson = localStorage.getItem('workTimes');
    if (savedWorkTimesJson) {
      try {
        const parsedWorkTimes = JSON.parse(savedWorkTimesJson).map((wt: { start: string; end: string | null; memo: string }) => ({
          start: new Date(wt.start),
          end: wt.end ? new Date(wt.end) : null,
          memo: wt.memo || '',
        }));
        setWorkTimes(parsedWorkTimes);
        const lastWorkTime = parsedWorkTimes[parsedWorkTimes.length - 1];
        if (lastWorkTime && lastWorkTime.end === null) {
          setIsWorking(true);
        }
      } catch (error) {
        console.error("Error parsing workTimes from localStorage:", error);
        setWorkTimes([]);
      }
    }
  }, []);

  useEffect(() => {
    const saveWorkTimes = () => {
      try {
        localStorage.setItem('workTimes', JSON.stringify(workTimes));
      } catch (error) {
        console.error("Error saving workTimes to localStorage:", error);
      }
    };
    saveWorkTimes();
  }, [workTimes]);

  const handleStartWork = () => {
    setWorkTimes([...workTimes, { start: new Date(), end: null, memo: '' }]);
    setIsWorking(true);
  };

  const handleEndWork = () => {
    const newWorkTimes = [...workTimes];
    const lastWorkTime = newWorkTimes[newWorkTimes.length - 1];
    if (lastWorkTime && lastWorkTime.end === null) {
      lastWorkTime.end = new Date();
      lastWorkTime.memo = currentMemo;

      if (calculateWorkDuration(lastWorkTime.start, lastWorkTime.end) > 0) {
        setWorkTimes(newWorkTimes);
      } else {
        newWorkTimes.pop();
        setWorkTimes(newWorkTimes);
      }
      setIsWorking(false);
      setCurrentMemo('');
    }
  };

  const calculateWorkDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    return Math.round(diff / (1000 * 60));
  };

  const calculateTotalWorkDuration = (workTimes: { start: Date; end: Date | null }[]) => {
    return workTimes
      .filter(wt => wt.end)
      .reduce((total, wt) => {
        return total + calculateWorkDuration(wt.start, wt.end!);
      }, 0);
  };

  const handleEditWorkTime = (index: number) => {
    setEditingWorkTimeIndex(index);
  };

  const handleSaveWorkTime = (index: number, newStart: string, newEnd: string) => {
    const newWorkTimes = [...workTimes];
    const targetWorkTime = newWorkTimes[index];

    const startDate = new Date(targetWorkTime.start);
    const [startHours, startMinutes] = newStart.split(':').map(Number);
    startDate.setHours(startHours, startMinutes);

    let endDate: Date | null = null;
    if (targetWorkTime.end) {
      endDate = new Date(targetWorkTime.end);
      const [endHours, endMinutes] = newEnd.split(':').map(Number);
      endDate.setHours(endHours, endMinutes);
    }

    if (endDate && endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    newWorkTimes[index] = { start: startDate, end: endDate, memo: targetWorkTime.memo };
    setWorkTimes(newWorkTimes);
    setEditingWorkTimeIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingWorkTimeIndex(null);
  };

  const handleDeleteWorkTime = (index: number) => {
    if (window.confirm('この作業記録を削除しますか？')) {
      const newWorkTimes = workTimes.filter((_, i) => i !== index);
      setWorkTimes(newWorkTimes);
    }
  };

  return {
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
  };

  function importWorkTimes(jsonString: string): void {
    try {
      const parsedWorkTimes = JSON.parse(jsonString).map((wt: { start: string; end: string | null; memo: string }) => ({
        start: new Date(wt.start),
        end: wt.end ? new Date(wt.end) : null,
        memo: wt.memo || '',
      }));
      
      if (!Array.isArray(parsedWorkTimes) || parsedWorkTimes.some(wt => !wt.start)) {
          throw new Error("Invalid JSON format");
      }
  
      setWorkTimes(parsedWorkTimes);
      const lastWorkTime = parsedWorkTimes[parsedWorkTimes.length - 1];
      if (lastWorkTime && lastWorkTime.end === null) {
        setIsWorking(true);
      } else {
        setIsWorking(false);
      }
      alert("作業時間データをインポートしました。");
    } catch (error) {
      console.error("Error importing work times:", error);
      alert("作業時間データのインポートに失敗しました。JSONの形式を確認してください。");
    }
  }
}
