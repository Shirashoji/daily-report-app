'use client';

import { useWorkTime } from '../hooks/useWorkTime';
import { formatDate } from '../../lib/utils';

const formatWorkTime = (date: Date) => {
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return jstDate.toISOString().slice(11, 16);
};

const calculateWorkDuration = (start: Date, end: Date) => {
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / (1000 * 60));
};

export default function DailyWorkTime({ startDate, endDate }: { startDate: Date, endDate: Date }) {
  const {
    workTimes,
    editingWorkTimeIndex,
    handleEditWorkTime,
    handleSaveWorkTime,
    handleCancelEdit,
    handleDeleteWorkTime,
    calculateTotalWorkDuration,
  } = useWorkTime();

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">記録された作業（{formatDate(startDate)} ~ {formatDate(endDate)}）</h3>
        <span className="text-lg font-medium">
          合計: {Math.floor(calculateTotalWorkDuration(workTimes.filter(wt => {
            const wtStart = new Date(wt.start);
            return wtStart >= startDate && wtStart <= endDate;
          })) / 60)}時間 {calculateTotalWorkDuration(workTimes.filter(wt => {
            const wtStart = new Date(wt.start);
            return wtStart >= startDate && wtStart <= endDate;
          })) % 60}分
        </span>
      </div>
      <ul className="space-y-2">
        {workTimes
          .map((wt, _index) => ({ ...wt, originalIndex: _index })) // 元のインデックスを保持
          .filter(wt => {
            const wtStart = new Date(wt.start); // workTimesのstart時刻 (UTC)
            return wtStart >= startDate && wtStart <= endDate;
          })
          .map((wt) => (
            <li key={wt.originalIndex} className="p-3 bg-gray-100 rounded-md">
              <div className="flex items-center justify-between mb-2">
                {editingWorkTimeIndex === wt.originalIndex ? (
                  <>
                    <input
                      type="time"
                      defaultValue={formatWorkTime(wt.start)}
                      id={`start-time-${wt.originalIndex}`}
                      className="border-gray-300 rounded-md"
                    />
                    <span className="mx-2">〜</span>
                    <input
                      type="time"
                      defaultValue={wt.end ? formatWorkTime(wt.end) : ''}
                      id={`end-time-${wt.originalIndex}`}
                      className="border-gray-300 rounded-md"
                    />
                    <div className="ml-auto">
                      <button onClick={() => handleSaveWorkTime(wt.originalIndex, (document.getElementById(`start-time-${wt.originalIndex}`) as HTMLInputElement).value, (document.getElementById(`end-time-${wt.originalIndex}`) as HTMLInputElement).value)} className="bg-blue-500 text-white px-3 py-1 rounded-md mr-2">保存</button>
                      <button onClick={handleCancelEdit} className="bg-gray-500 text-white px-3 py-1 rounded-md">キャンセル</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span>
                      {formatWorkTime(wt.start)} 〜 {wt.end ? formatWorkTime(wt.end) : '作業中...'}
                      {wt.end && `(${calculateWorkDuration(wt.start, wt.end)}分)`}
                    </span>
                    <div>
                      <button onClick={() => handleEditWorkTime(wt.originalIndex)} className="bg-gray-300 text-black px-3 py-1 rounded-md mr-2">編集</button>
                      <button onClick={() => handleDeleteWorkTime(wt.originalIndex)} className="bg-red-500 text-white px-3 py-1 rounded-md">削除</button>
                    </div>
                  </>
                )}
              </div>
              {wt.memo && (
                <pre className="whitespace-pre-wrap bg-white p-2 rounded text-sm">{wt.memo}</pre>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
