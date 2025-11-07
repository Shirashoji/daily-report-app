// src/app/daily/page.tsx
import ReportPage from '@/components/features/report/ReportPage';
import type { ReactElement } from 'react';

export default function DailyPage(): ReactElement {
  return <ReportPage reportType="daily" />;
}
