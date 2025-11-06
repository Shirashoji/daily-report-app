import { NextResponse } from 'next/server';
import { fetchFromGitHub, GitHubAPIError } from '@/lib/github';
import { GitHubBranch } from './interfaces';

export async function parseAndValidateRequest(request: Request) {
  const body = await request.json();
  const { owner, repo } = body;

  if (!owner || !repo) {
    throw new GitHubAPIError('owner and repo are required', 400);
  }

  return { owner, repo };
}

export async function fetchBranches(owner: string, repo: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/branches`;
  console.log('github-branches API: Fetching from URL:', url);

  const response = await fetchFromGitHub(url, owner, repo);
  const branches: GitHubBranch[] = await response.json();
  return branches.map((b) => b.name);
}

export function handleError(error: unknown) {
  console.error(`github-branches API: Error: ${error}`);
  if (error instanceof GitHubAPIError) {
    // Specific handling for 404 which might have been re-thrown
    if (error.status === 404) {
        return NextResponse.json({ error: 'Repository not found. It might be a private repository you do not have access to, or the name is incorrect.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch from GitHub', details: error.message }, { status: error.status });
  }
  if (error instanceof SyntaxError) { // From request.json()
    return NextResponse.json({ error: 'Invalid JSON body', details: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
}
