// src/app/meeting/page.tsx
import ReportPage from "@/components/features/report/ReportPage";
import type { ReactElement } from "react";

/**
 * MTG資料作成ページのコンポーネント。
 * 共通の `ReportPage` コンポーネントを `reportType="meeting"` の設定でレンダリングします。
 * @returns {ReactElement} MTG資料作成ページのUI。
 */
export default function MeetingPage(): ReactElement {
  return <ReportPage reportType="meeting" />;
}
