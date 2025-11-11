// src/app/daily/page.tsx
import ReportPage from "@/components/features/report/ReportPage";
import type { ReactElement } from "react";

/**
 * 日報作成ページのコンポーネント。
 * 共通の `ReportPage` コンポーネントを `reportType="daily"` の設定でレンダリングします。
 * @returns {ReactElement} 日報作成ページのUI。
 */
export default function DailyPage(): ReactElement {
  return <ReportPage reportType="daily" />;
}
