// src/app/api/get-commits/route.ts
import { NextResponse } from 'next/server';
import { fetchFromGitHub } from '@/lib/github';
import { AppError, ValidationError } from '@/lib/errors';
import type { ApiResponse, CommitHistoryResponse } from '@/types/api';
import type { CommitData } from '@/types/github';

const JST_OFFSET = 9 * 60 * 60 * 1000;

interface RequestBody {
  owner: string;
  repo: string;
  branch: string;
  startDate: string;
  endDate: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      date: string;
    };
    message: string;
  };
}

interface GitHubBranch {
  name: string;
}

async function fetchCommitsForBranch(owner: string, repo: string, branch: string, since: string, until: string): Promise<CommitData[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&since=${since}&until=${until}`;
  const response = await fetchFromGitHub(url, owner, repo);
  const commits: GitHubCommit[] = await response.json();
  return commits.map((c) => ({
    sha: c.sha.substring(0, 7),
    message: c.commit.message,
    author: c.commit.author.name,
    date: c.commit.author.date,
  }));
}

async function fetchCommitsFromAllBranches(owner: string, repo: string, since: string, until: string): Promise<CommitData[]> {
  const branchesUrl = `https://api.github.com/repos/${owner}/${repo}/branches`;
  const branchesResponse = await fetchFromGitHub(branchesUrl, owner, repo);
  const branches: GitHubBranch[] = await branchesResponse.json();

  const commitPromises = branches.map((b) =>
    fetchCommitsForBranch(owner, repo, b.name, since, until).catch(() => {
      // Gracefully handle errors for single branches by returning an empty array
      return [];
    })
  );

  const results = await Promise.all(commitPromises);
  const commitsBySha = new Map<string, CommitData>();
  for (const branchCommits of results) {
    for (const commit of branchCommits) {
      if (!commitsBySha.has(commit.sha)) {
        commitsBySha.set(commit.sha, commit);
      }
    }
  }
  return Array.from(commitsBySha.values());
}

function formatCommits(commits: CommitData[]): string {
  const sortedCommits = commits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return sortedCommits
    .map((c) => `${c.sha} - ${c.author}, ${new Date(c.date).toLocaleString('ja-JP')} : ${c.message}`)
    .join('\n');
}

async function getCommits(owner: string, repo: string, branch: string, since: string, until: string): Promise<CommitData[]> {
  if (branch && branch !== 'all') {
    return fetchCommitsForBranch(owner, repo, branch, since, until);
  }
  return fetchCommitsFromAllBranches(owner, repo, since, until);
}

function handleError(error: unknown): NextResponse<ApiResponse<null>> {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message, status: error.statusCode }, { status: error.statusCode });
  }
  return NextResponse.json({ error: 'An unexpected error occurred', status: 500 }, { status: 500 });
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<CommitHistoryResponse | null>>> {
  try {
    const { owner, repo, branch, startDate, endDate }: RequestBody = await request.json();

    if (!owner || !repo) {
      throw new ValidationError('owner and repo are required', 'owner/repo');
    }
    if (!startDate || !endDate) {
      throw new ValidationError('startDate and endDate are required', 'date');
    }

    // JST is UTC+9. We adjust the dates to cover the full day in JST.
    const since = new Date(new Date(startDate).getTime() - JST_OFFSET).toISOString();
    const until = new Date(new Date(endDate).getTime() + (24 * 60 * 60 * 1000) - JST_OFFSET).toISOString();

    const commits = await getCommits(owner, repo, branch, since, until);
    const formattedCommits = formatCommits(commits);

    return NextResponse.json({ data: { commits: formattedCommits }, status: 200 });
  } catch (error: unknown) {
    return handleError(error);
  }
}
