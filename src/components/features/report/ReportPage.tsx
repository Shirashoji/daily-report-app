// src/components/features/report/ReportPage.tsx
'use client';

import { useState, useEffect, useMemo, useCallback, ReactElement } from 'react';
import { useSession, signOut } from 'next-auth/react';
import dynamic from 'next/dynamic';

import { useSettings } from '@/hooks/useSettings';
import { useCommitHistory } from '@/hooks/useCommitHistory';
import { useGitHub } from '@/hooks/useGitHub';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import ReportHeader from './ReportHeader';
import WorkTimeRecorder from './WorkTimeRecorder';

const CommitHistoryView = dynamic(() => import('./CommitHistoryView'), { loading: () => <p>Loading...</p> });
const GeneratedReportView = dynamic(() => import('./GeneratedReportView'), { loading: () => <p>Loading...</p> });
const DailyWorkTime = dynamic(() => import('./DailyWorkTime'), { loading: () => <p>Loading...</p> });
const MeetingWorkTime = dynamic(() => import('./MeetingWorkTime'), { loading: () => <p>Loading...</p> });


interface ReportPageProps {
  reportType: 'daily' | 'meeting';
}

/**
 * The main page component for creating reports.
 * It orchestrates fetching data, managing state, and rendering the report generation UI.
 * @component
 */
export default function ReportPage({ reportType }: ReportPageProps): ReactElement {
  const { data: session } = useSession();
  const { model, handleSetModel: onModelChange } = useSettings();
  const { githubOwner, githubRepo, selectedBranch } = useGitHub(session);

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    if (session?.error) {
      alert(`Authentication Error: ${session.error}`);
      signOut();
    }
  }, [session]);

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

  const commitHistoryParams = useMemo(() => ({
    session,
    owner: githubOwner,
    repo: githubRepo,
    branch: selectedBranch,
    startDate,
    endDate,
    reportType,
  }), [session, githubOwner, githubRepo, selectedBranch, startDate, endDate, reportType]);

  const { commitHistory, isLoading: isLoadingCommits, error: commitError } = useCommitHistory(commitHistoryParams);

  const handleSetModel = useCallback((model: string) => {
    onModelChange(model);
  }, [onModelChange]);

  return (
    <div className="container mx-auto p-4">
      <ErrorBoundary>
        <WorkTimeRecorder />
      </ErrorBoundary>

      <div className="mb-8 p-4 border rounded-md">
        <ErrorBoundary>
          {reportType === 'daily' ? (
            <DailyWorkTime startDate={startDate} endDate={endDate} />
          ) : (
            <MeetingWorkTime startDate={startDate} endDate={endDate} />
          )}
        </ErrorBoundary>
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
        <ErrorBoundary>
          <CommitHistoryView
            commitHistory={commitHistory}
            isLoading={isLoadingCommits}
            error={commitError}
          />
        </ErrorBoundary>
        <ErrorBoundary>
          <GeneratedReportView
            initialReportType={reportType}
            commitHistory={commitHistory}
            model={model}
            startDate={startDate}
            endDate={endDate}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
