import { NextResponse } from 'next/server';
import { fetchBranches, handleError, parseAndValidateRequest } from './helpers';

export async function POST(request: Request) {
  console.log('github-branches API: Request received.');
  try {
    const { owner, repo } = await parseAndValidateRequest(request);
    const branchNames = await fetchBranches(owner, repo);
    console.log('github-branches API: Successfully fetched branches.', branchNames);
    return NextResponse.json({ branches: branchNames });
  } catch (error: unknown) {
    return handleError(error);
  }
}