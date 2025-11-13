// src/components/features/report/ReportHeader.tsx
"use client";

import { useDateContext } from "@/contexts/DateContext";
import { formatDate } from "@/lib/utils";
import { useGeminiModels } from "@/hooks/useGeminiModels";
import type { ReportType } from "@/types/report";
import type { ReactElement } from "react";

/**
 * `ReportHeader`コンポーネントのプロパティの型定義。
 */
interface ReportHeaderProps {
  /** レポートの種類 ('daily' または 'meeting')。 */
  initialReportType: ReportType;
  /** 現在選択されているAIモデル名。 */
  model: string;
  /** AIモデルを設定する関数。 */
  handleSetModel: (model: string) => void;
}

/**
 * レポートページ（日報・議事録）のヘッダー部分を担当するコンポーネント。
 * レポートの対象期間や、使用するAIモデルの選択機能を提供します。
 * @param {ReportHeaderProps} props - コンポーネントのプロパティ。
 * @returns {ReactElement} 日付選択やモデル選択のUIを含むヘッダー要素。
 */
export default function ReportHeader({
  initialReportType,
  model,
  handleSetModel,
}: ReportHeaderProps): ReactElement {
  const { startDate, endDate, setStartDate, setEndDate } = useDateContext();
  // 利用可能なGeminiモデルのリストを取得するためのカスタムフック
  const { models, isLoading, error } = useGeminiModels();

  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      {/* 日報ページの場合、単一の日付選択を表示 */}
      {initialReportType === "daily" && (
        <div>
          <label
            htmlFor="date-select"
            className="block text-sm font-medium text-gray-700"
          >
            対象日:
          </label>
          <input
            type="date"
            id="date-select"
            value={formatDate(startDate)}
            onChange={(e) => {
              // 選択された日付で開始日と終了日を更新（同日の00:00:00から23:59:59まで）
              const date = new Date(e.target.value + "T00:00:00");
              setStartDate(date);
              setEndDate(new Date(e.target.value + "T23:59:59"));
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          />
        </div>
      )}
      {/* 議事録ページの場合、期間の開始日と終了日を選択 */}
      {initialReportType === "meeting" && (
        <>
          <div>
            <label
              htmlFor="start-date-select"
              className="block text-sm font-medium text-gray-700"
            >
              開始日:
            </label>
            <input
              type="date"
              id="start-date-select"
              value={formatDate(startDate)}
              onChange={(e) =>
                setStartDate(new Date(e.target.value + "T00:00:00"))
              }
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="end-date-select"
              className="block text-sm font-medium text-gray-700"
            >
              終了日:
            </label>
            <input
              type="date"
              id="end-date-select"
              value={formatDate(endDate)}
              onChange={(e) =>
                setEndDate(new Date(e.target.value + "T23:59:59"))
              }
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
        </>
      )}
      <div>
        <label
          htmlFor="model-select"
          className="block text-sm font-medium text-gray-700"
        >
          Geminiモデルを選択:
        </label>
        <select
          id="model-select"
          value={model}
          onChange={(e) => handleSetModel(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          disabled={isLoading || !!error}
        >
          {/* モデルリストの読み込み状態に応じて表示を切り替え */}
          {isLoading && <option>モデルを読み込み中...</option>}
          {error && <option>モデルの読み込みに失敗</option>}
          {!isLoading &&
            !error &&
            models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.displayName}
              </option>
            ))}
        </select>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    </div>
  );
}