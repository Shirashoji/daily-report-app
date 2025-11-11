// src/lib/utils/index.ts

/**
 * Dateオブジェクトを「YYYY-MM-DD」形式の文字列にフォーマットします。
 * @param {Date} date - フォーマットするDateオブジェクト。
 * @returns {string} フォーマットされた日付文字列。
 */
export const formatDate = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Dateオブジェクトを「HH:MM」形式の文字列にフォーマットします。
 * @param {Date} time - フォーマットするDateオブジェクト。
 * @returns {string} フォーマットされた時刻文字列。
 */
export const formatWorkTime = (time: Date): string => {
  return time.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * 2つの日時の間の時間（分）を計算します。
 * @param {Date} start - 開始日時。
 * @param {Date | null} end - 終了日時。
 * @returns {number} 経過時間（分）。終了日時がない場合は0を返します。
 */
export const calculateWorkDuration = (
  start: Date,
  end: Date | null
): number => {
  if (!end) return 0;
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / 60000); // 分単位に変換
};