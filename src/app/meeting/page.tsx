import MeetingReportPage from '../components/report/MeetingReportPage';
import { WorkTimeProvider } from '../contexts/WorkTimeContext';

export default function MeetingPage() {
  return (
    <WorkTimeProvider>
      <MeetingReportPage />
    </WorkTimeProvider>
  );
}
