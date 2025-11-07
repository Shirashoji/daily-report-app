// src/app/meeting/page.tsx
import ReportPage from '@/components/features/report/ReportPage';
import type { ReactElement } from 'react';

export default function MeetingPage(): ReactElement {
  return <ReportPage reportType="meeting" />;
}
