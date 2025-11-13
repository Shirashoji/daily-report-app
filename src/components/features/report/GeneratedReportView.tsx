// src/components/features/report/GeneratedReportView.tsx
"use client";

import { useReportGenerator } from "@/hooks/useReportGenerator";
import { useWorkTime } from "@/hooks/useWorkTime";
import { Button } from "@/components/ui/Button";
import type { ReportType } from "@/types/report";
import type { CommitData } from "@/types/github";
import type { ReactElement } from "react";

/**
 * `GeneratedReportView`コンポーネントのプロパティの型定義。
 */
interface GeneratedReportViewProps {
  /** 初期表示するレポートの種類 ('daily' または 'meeting')。 */
  initialReportType: ReportType;
  /** レポート生成の元となるコミットデータの配列。 */
  commits: CommitData[];
  /** レポート生成に使用するAIモデル名。 */
  model: string;
}

/**
 * AIによって生成されたレポートを表示し、ユーザーとの対話（再生成、コピー）を担うコンポーネント。
 * @param {GeneratedReportViewProps} props - コンポーネントのプロパティ。
 * @returns {ReactElement} 生成されたレポートの表示と操作ボタンを含むUI。
 */
export default function GeneratedReportView({
  initialReportType,
  commits,
  model,
}: GeneratedReportViewProps): ReactElement {
  // 作業時間コンテキストから作業時間のリストを取得
  const { workTimes } = useWorkTime();
  // レポート生成関連のフックから状態と関数を取得
  const {
    generatedText,
    isLoading,
    error,
    generateReport,
    copyToClipboard,
    setGeneratedText,
  } = useReportGenerator({
    commits,
    model,
    workTimes,
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">
        生成された{initialReportType === "daily" ? "日報" : "MTG資料"}
      </h2>
      <textarea
        className="w-full h-96 p-2 border rounded-md bg-gray-50"
        value={generatedText}
        onChange={(e) => setGeneratedText(e.target.value)}
        placeholder="ここにレポートが生成されます..."
      />
      <div className="mt-4 flex items-center space-x-2">
        <Button
          onClick={() => generateReport(initialReportType)}
          isLoading={isLoading}
          disabled={isLoading || commits.length === 0} // Disable if no commits
        >
          {/* レポートタイプに応じてボタンのテキストを変更 */}
          {initialReportType === "daily" ? "日報を生成" : "MTG資料を生成"}
        </Button>
        <Button
          variant="secondary"
          onClick={copyToClipboard}
          disabled={!generatedText || isLoading}
        >
          クリップボードにコピー
        </Button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">エラー: {error}</p>}
    </div>
  );
}
