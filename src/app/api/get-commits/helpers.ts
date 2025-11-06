import { NextResponse } from 'next/server';
import { fetchFromGitHub, GitHubAPIError } from '@/lib/github';
import { GitHubCommitResponse, GitHubBranch } from './interfaces';

export const JST_OFFSET = 9 * 60 * 60 * 1000;

export const getJstDate = (dateString?: string | null) => {
  if (!dateString) {
    return new Date(new Date().getTime() + JST_OFFSET);
  }
  const [year, month, date] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date));
};

export const getWeeklyDateRange = (targetDate: Date) => {
  const dayOfWeek = targetDate.getUTCDay(); // Sunday = 0, Monday = 1, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(targetDate);
  monday.setUTCDate(targetDate.getUTCDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const startOfDayJst = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
  const endOfDayJst = new Date(Date.UTC(sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate(), 23, 59, 59));

  return {
    after: new Date(startOfDayJst.getTime() - JST_OFFSET).toISOString(),
    before: new Date(endOfDayJst.getTime() - JST_OFFSET).toISOString(),
  };
};

export const getDailyDateRange = (targetDate: Date) => {
  const year = targetDate.getUTCFullYear();
  const month = targetDate.getUTCMonth();
  const date = targetDate.getUTCDate();

  const startOfDayJst = new Date(Date.UTC(year, month, date));
  const endOfDayJst = new Date(Date.UTC(year, month, date, 23, 59, 59));

  return {
    after: new Date(startOfDayJst.getTime() - JST_OFFSET).toISOString(),
    before: new Date(endOfDayJst.getTime() - JST_OFFSET).toISOString(),
  };
};

export async function fetchCommitsForBranch(owner: string, repo: string, branch: string, after: string, before: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&since=${after}&until=${before}`;
  const response = await fetchFromGitHub(url, owner, repo);
  const commits = await response.json();
  return commits.map((c: GitHubCommitResponse) => ({
    sha: c.sha.substring(0, 7),
    message: c.commit.message,
    author: c.commit.author.name,
    date: c.commit.author.date,
  }));
}

export async function fetchCommitsFromAllBranches(owner: string, repo: string, after: string, before: string) {
  const branchesUrl = `https://api.github.com/repos/${owner}/${repo}/branches`;
  const branchesResponse = await fetchFromGitHub(branchesUrl, owner, repo);
  const branches = await branchesResponse.json();

  const commitPromises = branches.map((b: GitHubBranch) => {
    return fetchCommitsForBranch(owner, repo, b.name, after, before).catch(error => {
      console.error(`github-commits API: Failed to fetch commits for branch ${b.name}. Error: ${error}`);
      return []; // Gracefully handle errors for single branches
    });
  });

  const results = await Promise.all(commitPromises);
  const commitsBySha = new Map<string, { sha: string; message: string; author: string; date: string }>();
  for (const branchCommits of results) {
    for (const c of branchCommits) {
      if (!commitsBySha.has(c.sha)) {
        commitsBySha.set(c.sha, c);
      }
    }
  }
  return Array.from(commitsBySha.values());
}

export const formatCommits = (commits: { sha: string; message: string; author: string; date: string }[]) => {
  const sortedCommits = commits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return sortedCommits.map(c => `${c.sha} - ${c.author}, ${new Date(c.date).toLocaleString()} : ${c.message}`).join('\n');
};

export function handleError(error: unknown) {
  console.error(`github-commits API: Error: ${error}`);
  if (error instanceof GitHubAPIError) {
    return NextResponse.json({ error: 'Failed to get commits from GitHub', details: error.message }, { status: error.status });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: 'Invalid JSON body', details: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
}

export async function parseAndValidateRequest(request: Request) {
  const body = await request.json();
  const { owner, repo, branch, startDate, endDate } = body;

  if (!owner || !repo) {
    throw new GitHubAPIError('owner and repo are required', 400);
  }

  return { owner, repo, branch, startDate, endDate };
}


export async function getCommits(owner: string, repo: string, branch: string, after: string, before: string) {
  console.log('getCommits: owner', owner);
  console.log('getCommits: repo', repo);
  console.log('getCommits: branch', branch);
  console.log('getCommits: after', after);
  console.log('getCommits: before', before);
  if (branch && branch !== 'all') {
    const commits = await fetchCommitsForBranch(owner, repo, branch, after, before);
    console.log('getCommits: commits', commits);
    return commits;
  }
  const commits = await fetchCommitsFromAllBranches(owner, repo, after, before);
  console.log('getCommits: commits', commits);
  return commits;
}
