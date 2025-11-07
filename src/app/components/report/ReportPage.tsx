'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

import { useSettings } from '../../hooks/useSettings';
import DailyWorkTime from './DailyWorkTime';
import MeetingWorkTime from './MeetingWorkTime';
import WorkTimeRecorder from '../WorkTimeRecorder';
import ReportHeader from './ReportHeader';
import CommitHistoryView from './CommitHistoryView';
import GeneratedReportView from './GeneratedReportView';
import { useCommitHistory } from '../../hooks/useCommitHistory';
import { useGitHub } from '../../hooks/useGitHub';

interface ReportPageProps {
  reportType: 'daily' | 'meeting';
}

export default function ReportPage({ reportType }: ReportPageProps) {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.error) {
      alert(`Authentication Error: ${session.error}`);
      signOut(); // Force sign out to clear the session
    }
  }, [session]);

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    if (reportType === 'daily') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setStartDate(today);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      setEndDate(endOfDay);
    } else {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      setStartDate(sevenDaysAgo);
      setEndDate(today);
    }
  }, [reportType]);

  const { model, handleSetModel } = useSettings();
  const { githubOwner, githubRepo, selectedBranch } = useGitHub(session);

  const {
    commitHistory,
  } = useCommitHistory(session, githubOwner, githubRepo, selectedBranch, startDate, endDate, reportType);

  return (
    <div className="container mx-auto p-4">
      <WorkTimeRecorder />

      <div className="mb-8 p-4 border rounded-md">
        {reportType === 'daily' ? (
          <DailyWorkTime startDate={startDate} endDate={endDate} />
        ) : (
          <MeetingWorkTime startDate={startDate} endDate={endDate} />
        )}
      </div>

      <ReportHeader
        initialReportType={reportType}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        model={model}
        handleSetModel={handleSetModel}
      />

      <div className="grid grid-cols-2 gap-8">
        <CommitHistoryView
          commitHistory={commitHistory}
        />
        <GeneratedReportView
          initialReportType={reportType}
          commitHistory={commitHistory}
          model={model}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </div>
  );
}
