// src/app/meeting/page.tsx
import ReportPage from '@/components/features/report/ReportPage';
import { DateProvider } from '@/contexts/DateContext';
import type { ReactElement } from 'react';

/**
 * MTG資料作成ページのコンポーネント。
 * 共通の `ReportPage` コンポーネントを `reportType="meeting"` の設定でレンダリングします。
 * `DateProvider`でラップすることで、日付関連の状態をコンテキスト経由で提供します。
 * @returns {ReactElement} MTG資料作成ページのUI。
 */
export default function MeetingPage(): ReactElement {
  return (
    <DateProvider reportType="meeting">
      <ReportPage reportType="meeting" />
    </DateProvider>
  );
}
