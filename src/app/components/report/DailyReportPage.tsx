'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

import { useWorkTime } from '../../hooks/useWorkTime';
import { useSettings } from '../../hooks/useSettings';
import DailyWorkTime from '../DailyWorkTime';
import WorkTimeRecorder from '../WorkTimeRecorder';
import ReportHeader from './ReportHeader';
import CommitHistoryView from './CommitHistoryView';
import GeneratedReportView from './GeneratedReportView';
import { useCommitHistory } from '../../hooks/useCommitHistory';
import { useGitHub } from '../../hooks/useGitHub';

export default function DailyReportPage() {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.error) {
      alert(`Authentication Error: ${session.error}`);
      signOut(); // Force sign out to clear the session
    }
  }, [session]);

  const { workTimes } = useWorkTime();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
  }, []);

  const { model, handleSetModel } = useSettings();
  const { githubOwner, githubRepo, selectedBranch } = useGitHub(session);

  const {
    commitHistory,
  } = useCommitHistory(session, githubOwner, githubRepo, selectedBranch, startDate, endDate, 'daily');

  return (
    <div className="container mx-auto p-4">
      <WorkTimeRecorder />

      <div className="mb-8 p-4 border rounded-md">
        <DailyWorkTime startDate={startDate} endDate={endDate} />
      </div>

      <ReportHeader
        initialReportType="daily"
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        model={model}
        handleSetModel={handleSetModel}
      />

      <div className="grid grid-cols-2 gap-8">
        <CommitHistoryView
          initialReportType="daily"
          startDate={startDate}
          endDate={endDate}
          commitHistory={commitHistory}
        />
        <GeneratedReportView
          initialReportType="daily"
          commitHistory={commitHistory}
          model={model}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </div>
  );
}
