// src/components/features/report/WorkTimeRecorder.tsx
"use client";

import { useWorkTime } from "@/hooks/useWorkTime";
import { Button } from "@/components/ui/Button";
import type { ReactElement } from "react";

/**
 * 作業時間の記録（開始、終了）と、作業中のメモ追加を行うためのコンポーネント。
 * @returns {ReactElement} 作業時間記録用のUI。
 */
export default function WorkTimeRecorder(): ReactElement {
  // 作業時間関連のカスタムフックから状態と関数を取得
  const {
    isWorking,
    currentMemo,
    handleStartWork,
    handleEndWork,
    setCurrentMemo,
  } = useWorkTime();

  return (
    <div className="mb-8 p-4 border rounded-md">
      <h2 className="text-xl font-semibold mb-4">作業時間記録</h2>
      <div className="flex items-center space-x-4 mb-4">
        <Button
          onClick={handleStartWork}
          disabled={isWorking}
          variant="primary"
        >
          作業開始
        </Button>
        <Button onClick={handleEndWork} disabled={!isWorking} variant="danger">
          作業終了
        </Button>
      </div>
      {/* 作業中のみメモ入力欄を表示 */}
      {isWorking && (
        <div className="mb-4">
          <label
            htmlFor="current-memo"
            className="block text-sm font-medium text-gray-700"
          >
            作業メモ:
          </label>
          <textarea
            id="current-memo"
            value={currentMemo}
            onChange={(e) => setCurrentMemo(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            rows={3}
            placeholder="今やっている作業内容をメモ..."
          />
        </div>
      )}
    </div>
  );
}
