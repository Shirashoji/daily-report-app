import { NextResponse } from 'next/server';
import { fetchFromGitHub, GitHubAPIError } from '@/lib/github';

interface GitHubBranch {
  name: string;
}


export async function POST(request: Request) {
  console.log('github-branches API: Request received.');
  try {
    const body = await request.json();
    const { owner, repo } = body;

    if (!owner || !repo) {
      return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 });
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/branches`;
    console.log('github-branches API: Fetching from URL:', url);

    const response = await fetchFromGitHub(url);
    const branches: GitHubBranch[] = await response.json();
    const branchNames = branches.map((b) => b.name);

    console.log('github-branches API: Successfully fetched branches.', branchNames);
    return NextResponse.json({ branches: branchNames });

  } catch (error: unknown) {
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
}