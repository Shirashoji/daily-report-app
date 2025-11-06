'use client';

import { useWorkTime } from '../hooks/useWorkTime';

export default function WorkTimeRecorder() {
  const { isWorking, currentMemo, handleStartWork, handleEndWork, setCurrentMemo } = useWorkTime();

  return (
    <div className="mb-8 p-4 border rounded-md">
      <h2 className="text-xl font-semibold mb-4">作業時間記録</h2>
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={handleStartWork}
          disabled={isWorking}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          作業開始
        </button>
        <button
          onClick={handleEndWork}
          disabled={!isWorking}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          作業終了
        </button>
      </div>
      {isWorking && (
        <div className="mb-4">
          <label htmlFor="current-memo" className="block text-sm font-medium text-gray-700">作業メモ:</label>
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
