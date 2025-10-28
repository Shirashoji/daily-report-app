import { NextResponse } from 'next/server';
import { fetchFromGitHub, GitHubAPIError } from '@/lib/github';

interface GitHubBranch {
  name: string;
}

interface GitHubRepo {
  private: boolean;
}

export async function POST(request: Request) {
  console.log('github-branches API: Request received.');
  try {
    const body = await request.json();
    const { owner, repo, includePrivate } = body;

    if (!owner || !repo) {
      return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 });
    }

    // First, check if the repo is private and if the user wants to proceed
    if (!includePrivate) {
      const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
      console.log('github-branches API: Checking repo privacy from URL:', repoUrl);
      const repoResponse = await fetchFromGitHub(repoUrl);
      const repoData: GitHubRepo = await repoResponse.json();
      if (repoData.private) {
        return NextResponse.json({ error: 'This is a private repository. Please check the box to include private repositories.' }, { status: 403 });
      }
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
      // If the repo is not found, it could be a private repo that the user doesn't have access to, or a typo.
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
