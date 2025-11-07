// src/hooks/useWorkTime.ts
import { useWorkTimeContext, WorkTimeContextType } from '@/contexts/WorkTimeContext';

/**
 * Custom hook to access the work time context.
 * Provides state and functions for managing work time entries.
 * @returns The work time context.
 */
export function useWorkTime(): WorkTimeContextType {
  return useWorkTimeContext();
}
