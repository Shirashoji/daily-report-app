// src/contexts/WorkTimeContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

/**
 * 作業時間の情報を格納するインターフェース。
 */
export interface WorkTime {
  /** 作業開始日時。 */
  start: Date;
  /** 作業終了日時。作業中の場合はnull。 */
  end: Date | null;
  /** 作業内容のメモ。 */
  memo: string;
}

/**
 * localStorageから読み込む際の、Dateオブジェクトが文字列形式の作業時間データ。
 */
interface RawWorkTime {
  /** 作業開始日時（ISO 8601形式の文字列）。 */
  start: string;
  /** 作業終了日時（ISO 8601形式の文字列）、またはnull。 */
  end: string | null;
  /** 作業内容のメモ。 */
  memo: string;
}

/**
 * `WorkTimeContext`が提供する値の型定義。
 */
export interface WorkTimeContextType {
  /** 記録された作業時間のリスト。 */
  workTimes: WorkTime[];
  /** 現在作業中かどうかを示すフラグ。 */
  isWorking: boolean;
  /** 現在の作業メモ。 */
  currentMemo: string;
  /** 編集中の作業記録のインデックス。 */
  editingWorkTimeIndex: number | null;
  /** 作業開始を記録する関数。 */
  handleStartWork: () => void;
  /** 作業終了を記録する関数。 */
  handleEndWork: () => void;
  /** 現在の作業メモを更新する関数。 */
  setCurrentMemo: (memo: string) => void;
  /** 指定したインデックスの作業記録を編集モードにする関数。 */
  handleEditWorkTime: (index: number) => void;
  /** 編集した作業記録を保存する関数。 */
  handleSaveWorkTime: (
    index: number,
    newStart: string,
    newEnd: string
  ) => void;
  /** 編集をキャンセルする関数。 */
  handleCancelEdit: () => void;
  /** 指定したインデックスの作業記録を削除する関数。 */
  handleDeleteWorkTime: (index: number) => void;
  /** 総作業時間（分）を計算する関数。 */
  calculateTotalWorkDuration: (workTimes: WorkTime[]) => number;
  /** JSON文字列から作業時間データをインポートする関数。 */
  importWorkTimes: (jsonString: string) => void;
  /** 作業時間リストを直接設定する関数。 */
  setWorkTimes: (workTimes: WorkTime[]) => void;
}

/**
 * 作業時間に関する状態とロジックを共有するためのReactコンテキスト。
 */
const WorkTimeContext = createContext<WorkTimeContextType | undefined>(
  undefined
);

/**
 * 作業時間の追跡機能（状態管理と操作関数）を子コンポーネントに提供するプロバイダー。
 * 作業の開始、停止、編集、削除などを管理します。
 * @param {object} props - コンポーネントのプロパティ。
 * @param {React.ReactNode} props.children - このプロバイダー内でレンダリングされる子コンポーネント。
 */
export function WorkTimeProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  // 作業時間のリストを管理するstate
  const [workTimes, setWorkTimes] = useState<WorkTime[]>([]);
  // 現在作業中かどうかの状態を管理するstate
  const [isWorking, setIsWorking] = useState(false);
  // 現在の作業メモを管理するstate
  const [currentMemo, setCurrentMemo] = useState("");
  // 編集中の作業記録のインデックスを管理するstate
  const [editingWorkTimeIndex, setEditingWorkTimeIndex] = useState<
    number | null
  >(null);

  // マウント時にlocalStorageから作業記録を読み込む
  useEffect(() => {
    try {
      const savedWorkTimesJson = localStorage.getItem("workTimes");
      if (savedWorkTimesJson) {
        const parsed = JSON.parse(savedWorkTimesJson).map(
          (wt: RawWorkTime) => ({
            start: new Date(wt.start),
            end: wt.end ? new Date(wt.end) : null,
            memo: wt.memo || "",
          })
        );
        setWorkTimes(parsed);
        const lastWorkTime = parsed[parsed.length - 1];
        // 最後の作業記録が終了していなければ、作業中状態にする
        setIsWorking(lastWorkTime && lastWorkTime.end === null);
      }
    } catch (error) {
      console.error(
        "localStorageからの作業記録の解析中にエラーが発生しました:",
        error
      );
    }
  }, []);

  // workTimesが変更されたら、localStorageに保存する
  useEffect(() => {
    try {
      localStorage.setItem("workTimes", JSON.stringify(workTimes));
    } catch (error) {
      console.error(
        "localStorageへの作業記録の保存中にエラーが発生しました:",
        error
      );
    }
  }, [workTimes]);

  /**
   * 新しい作業記録を開始する。
   */
  const handleStartWork = useCallback(() => {
    setWorkTimes((prev) => [
      ...prev,
      { start: new Date(), end: null, memo: "" },
    ]);
    setIsWorking(true);
  }, []);

  /**
   * 現在の作業記録を終了する。
   */
  const handleEndWork = useCallback(() => {
    setWorkTimes((prev) => {
      const newWorkTimes = [...prev];
      const lastWorkTime = newWorkTimes[newWorkTimes.length - 1];
      if (lastWorkTime && lastWorkTime.end === null) {
        lastWorkTime.end = new Date();
        lastWorkTime.memo = currentMemo;
        // 0分の作業記録は保存しない
        if (calculateWorkDuration(lastWorkTime.start, lastWorkTime.end) > 0) {
          return newWorkTimes;
        }
        return newWorkTimes.slice(0, -1); // 0分のエントリを削除
      }
      return prev;
    });
    setIsWorking(false);
    setCurrentMemo("");
  }, [currentMemo]);

  /**
   * 開始日時と終了日時の差を分単位で計算する。
   * @param start - 開始日時
   * @param end - 終了日時
   * @returns 経過時間（分）
   */
  const calculateWorkDuration = (start: Date, end: Date | null): number => {
    if (!end) return 0;
    return Math.round((end.getTime() - start.getTime()) / 60000);
  };

  /**
   * 作業記録のリストから総作業時間を計算する。
   * @param times - 計算対象の作業記録リスト
   * @returns 総作業時間（分）
   */
  const calculateTotalWorkDuration = (times: WorkTime[]): number => {
    return times.reduce(
      (total, wt) => total + calculateWorkDuration(wt.start, wt.end),
      0
    );
  };

  /**
   * 指定されたインデックスの作業記録を編集モードにする。
   * @param index - 編集する作業記録のインデックス。
   */
  const handleEditWorkTime = (index: number): void => {
    setEditingWorkTimeIndex(index);
  };

  /**
   * 編集した作業記録を保存する。
   * @param index - 保存する作業記録のインデックス。
   * @param newStart - 新しい開始時刻（"HH:MM"形式）。
   * @param newEnd - 新しい終了時刻（"HH:MM"形式）。
   */
  const handleSaveWorkTime = (
    index: number,
    newStart: string,
    newEnd: string
  ): void => {
    setWorkTimes((prev) => {
      const newWorkTimes = [...prev];
      const target = newWorkTimes[index];

      const startDate = new Date(target.start);
      const [startHours, startMinutes] = newStart.split(":").map(Number);
      startDate.setHours(startHours, startMinutes);

      let endDate: Date | null = null;
      if (target.end) {
        endDate = new Date(target.end);
        const [endHours, endMinutes] = newEnd.split(":").map(Number);
        endDate.setHours(endHours, endMinutes);
        // 終了時刻が開始時刻より前の場合は、日付を1日進める
        if (endDate < startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
      }

      newWorkTimes[index] = { ...target, start: startDate, end: endDate };
      return newWorkTimes;
    });
    setEditingWorkTimeIndex(null);
  };

  /**
   * 編集モードをキャンセルする。
   */
  const handleCancelEdit = (): void => {
    setEditingWorkTimeIndex(null);
  };

  /**
   * 指定されたインデックスの作業記録を削除する。
   * @param index - 削除する作業記録のインデックス。
   */
  const handleDeleteWorkTime = (index: number): void => {
    if (window.confirm("この作業記録を削除しますか？")) {
      setWorkTimes((prev) => prev.filter((_, i) => i !== index));
    }
  };

  /**
   * JSON文字列から作業時間データをインポートする。
   * @param jsonString - インポートする作業記録のJSON文字列。
   */
  const importWorkTimes = (jsonString: string): void => {
    try {
      const parsed: WorkTime[] = JSON.parse(jsonString).map(
        (wt: RawWorkTime) => ({
          start: new Date(wt.start),
          end: wt.end ? new Date(wt.end) : null,
          memo: wt.memo || "",
        })
      );
      if (
        !Array.isArray(parsed) ||
        parsed.some((wt: any) => !(new Date(wt.start) instanceof Date))
      ) {
        throw new Error("無効なJSON形式です。");
      }
      setWorkTimes(parsed);
      const lastWorkTime = parsed[parsed.length - 1];
      setIsWorking(lastWorkTime && lastWorkTime.end === null);
      alert("作業時間データをインポートしました。");
    } catch (error) {
      console.error("作業時間のインポート中にエラーが発生しました:", error);
      alert(
        "作業時間データのインポートに失敗しました。JSONの形式を確認してください。"
      );
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

  return (
    <WorkTimeContext.Provider value={value}>
      {children}
    </WorkTimeContext.Provider>
  );
}

/**
 * 作業時間コンテキスト (`WorkTimeContext`) に安全にアクセスするためのカスタムフック。
 * このフックは必ず `WorkTimeProvider` の内部で使用する必要があります。
 * @returns {WorkTimeContextType} 作業時間コンテキストの値。
 * @throws {Error} `WorkTimeProvider` の外部で呼び出された場合にエラーをスローします。
 */
export function useWorkTimeContext(): WorkTimeContextType {
  const context = useContext(WorkTimeContext);
  if (context === undefined) {
    throw new Error(
      "useWorkTimeContext must be used within a WorkTimeProvider"
    );
  }
  return context;
}
