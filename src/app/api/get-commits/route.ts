import { NextResponse } from 'next/server';
import { fetchFromGitHub, GitHubAPIError } from '@/lib/github';
import {
  getJstDate,
  getWeeklyDateRange,
  getDailyDateRange,
  fetchCommitsForBranch,
  fetchCommitsFromAllBranches,
  formatCommits,
  handleError,
  parseAndValidateRequest,
  getDateRange,
  getCommits,
} from './helpers';

async function processRequest(request: Request) {
  const { owner, repo, branch, date, reportType } = await parseAndValidateRequest(request);
  const targetDate = getJstDate(date);
  const { after, before } = getDateRange(reportType, targetDate);
  const commits = await getCommits(owner, repo, branch, after, before);
  const formattedCommits = formatCommits(commits);
  return NextResponse.json({ commits: formattedCommits });
}

export async function POST(request: Request) {
  console.log('github-commits API: Request received.');
  try {
    return await processRequest(request);
  } catch (error: unknown) {
    console.error('github-commits API: Error in POST handler', error);
    return handleError(error);
  }
}
