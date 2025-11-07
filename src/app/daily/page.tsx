import DailyReportPage from '../components/report/DailyReportPage';
import { WorkTimeProvider } from '../contexts/WorkTimeContext';

export default function DailyPage() {
  return (
    <WorkTimeProvider>
      <DailyReportPage />
    </WorkTimeProvider>
  );
}
