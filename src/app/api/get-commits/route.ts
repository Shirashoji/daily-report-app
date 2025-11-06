import { NextResponse } from 'next/server';
import {
  formatCommits,
  handleError,
  parseAndValidateRequest,
  getCommits,
  JST_OFFSET,
} from './helpers';

async function processRequest(request: Request) {
  const { owner, repo, branch, startDate, endDate } = await parseAndValidateRequest(request);
  const after = new Date(new Date(startDate).getTime() - JST_OFFSET).toISOString();
  const before = new Date(new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - JST_OFFSET)).toISOString();
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
