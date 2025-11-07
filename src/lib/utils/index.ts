// src/lib/utils/index.ts

/**
 * Formats a Date object into a YYYY-MM-DD string.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
export const formatDate = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a Date object into a HH:MM string.
 * @param {Date} time - The date to format.
 * @returns {string} The formatted time string.
 */
export const formatWorkTime = (time: Date): string => {
  return time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Calculates the duration between two dates in minutes.
 * @param {Date} start - The start date.
 * @param {Date | null} end - The end date.
 * @returns {number} The duration in minutes.
 */
export const calculateWorkDuration = (start: Date, end: Date | null): number => {
  if (!end) return 0;
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / 60000); // in minutes
};