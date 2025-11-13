// src/app/daily/page.tsx
import ReportPage from "@/components/features/report/ReportPage";
import { DateProvider } from "@/contexts/DateContext";
import type { ReactElement } from "react";

/**
 * 日報作成ページのコンポーネント。
 * 共通の `ReportPage` コンポーネントを `reportType="daily"` の設定でレンダリングします。
 * `DateProvider`でラップすることで、日付関連の状態をコンテキスト経由で提供します。
 * @returns {ReactElement} 日報作成ページのUI。
 */
export default function DailyPage(): ReactElement {
  return (
    <DateProvider reportType="daily">
      <ReportPage reportType="daily" />
    </DateProvider>
  );
}
