// src/hooks/useWorkTime.ts
import {
  useWorkTimeContext,
  WorkTimeContextType,
} from "@/contexts/WorkTimeContext";

/**
 * 作業時間コンテキスト (`WorkTimeContext`) にアクセスするためのカスタムフック。
 * このフックを通じて、作業時間のエントリを管理するための状態と関数を取得できます。
 *
 * @returns {WorkTimeContextType} 作業時間コンテキスト。具体的には、作業時間のリスト、追加・更新・削除する関数などが含まれます。
 */
export function useWorkTime(): WorkTimeContextType {
  return useWorkTimeContext();
}
