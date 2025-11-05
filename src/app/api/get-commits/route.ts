import { NextResponse } from 'next/server';
import { fetchFromGitHub, GitHubAPIError } from '@/lib/github';

interface GitHubCommitResponse {
  sha: string;
  commit: {
    author: { name: string; email: string; date: string };
    message: string;
    tree: { sha: string; url: string };
    url: string;
    comment_count: number;
    verification: { verified: boolean; reason: string; signature: string | null; payload: string | null };
  };
  url: string;
  html_url: string;
  comments_url: string;
  author: { login: string; id: number; node_id: string; avatar_url: string; gravatar_id: string; url: string; html_url: string; followers_url: string; following_url: string; gists_url: string; starred_url: string; subscriptions_url: string; organizations_url: string; repos_url: string; events_url: string; received_events_url: string; type: string; site_admin: boolean };
  committer: { login: string; id: number; node_id: string; avatar_url: string; gravatar_id: string; url: string; html_url: string; followers_url: string; following_url: string; gists_url: string; starred_url: string; subscriptions_url: string; organizations_url: string; repos_url: string; events_url: string; received_events_url: string; type: string; site_admin: boolean };
  parents: { sha: string; url: string; html_url: string }[];
}

interface GitHubBranch {
  name: string;
  commit: { sha: string; url: string };
  protected: boolean;
}


const getJstDateRange = (dateString?: string | null, reportType?: string | null) => {
  const jstOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds

  let year, month, date; // month is 0-based

  if (dateString) {
    const parts = dateString.split('-').map(Number);
    year = parts[0];
    month = parts[1] - 1; // JS month is 0-based
    date = parts[2];
  } else {
    // Fallback to "today" in JST
    const todayJst = new Date(new Date().getTime() + jstOffset);
    year = todayJst.getUTCFullYear();
    month = todayJst.getUTCMonth();
    date = todayJst.getUTCDate();
  }

  const targetDate = new Date(Date.UTC(year, month, date));

  if (reportType === 'meeting') {
    // For meetings, get the whole week (Monday to Sunday) JST
    const dayOfWeek = targetDate.getUTCDay(); // Sunday = 0, Monday = 1, ...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(targetDate);
    monday.setUTCDate(targetDate.getUTCDate() + diffToMonday);
    
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const startOfDayJst = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate(), 0, 0, 0));
    const endOfDayJst = new Date(Date.UTC(sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate(), 23, 59, 59));

    const after = new Date(startOfDayJst.getTime() - jstOffset).toISOString();
    const before = new Date(endOfDayJst.getTime() - jstOffset).toISOString();

    return { after, before };
  } else {
    // Daily report logic (JST day)
    const startOfDayJst = new Date(Date.UTC(year, month, date, 0, 0, 0));
    const endOfDayJst = new Date(Date.UTC(year, month, date, 23, 59, 59));

    const after = new Date(startOfDayJst.getTime() - jstOffset).toISOString();
    const before = new Date(endOfDayJst.getTime() - jstOffset).toISOString();

    return { after, before };
  }
};

export async function POST(request: Request) {
  console.log('github-commits API: Request received.');
  try {
    const body = await request.json();
    const { owner, repo, branch, date, reportType } = body;

    if (!owner || !repo) {
      return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 });
    }

    const { after, before } = getJstDateRange(date, reportType);
    console.log('github-commits API: Date range - after:', after, 'before:', before);

    let allCommits: { sha: string; message: string; author: string; date: string }[] = [];

    if (branch && branch !== 'all') {
      console.log(`github-commits API: Fetching commits for specific branch: ${branch}`);
      const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&since=${after}&until=${before}`;
      const response = await fetchFromGitHub(url);
      const commits: GitHubCommitResponse[] = await response.json();
      allCommits = commits.map((c) => ({
        sha: c.sha.substring(0, 7),
        message: c.commit.message,
        author: c.commit.author.name,
        date: c.commit.author.date,
      }));
      console.log('github-commits API: Successfully fetched commits for specific branch.', allCommits.length);
    } else {
      console.log('github-commits API: Fetching commits from all branches.');
      const branchesUrl = `https://api.github.com/repos/${owner}/${repo}/branches`;
      const branchesResponse = await fetchFromGitHub(branchesUrl);
      const branches: GitHubBranch[] = await branchesResponse.json();
      console.log('github-commits API: Successfully fetched branches.', branches.length);

      const commitPromises = branches.map(async (b) => {
        const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${b.name}&since=${after}&until=${before}`;
        try {
            const commitsResponse = await fetchFromGitHub(commitsUrl);
            return await commitsResponse.json() as GitHubCommitResponse[];
        } catch (error) {
            console.error(`github-commits API: Failed to fetch commits for branch ${b.name}. Error: ${error}`);
            return []; // Gracefully handle errors for single branches
        }
      });

      const results = await Promise.all(commitPromises);
      const commitsBySha = new Map<string, { sha: string; message: string; author: string; date: string }>();
      for (const branchCommits of results) {
        for (const c of branchCommits) {
          if (!commitsBySha.has(c.sha)) {
            commitsBySha.set(c.sha, {
              sha: c.sha.substring(0, 7),
              message: c.commit.message,
              author: c.commit.author.name,
              date: c.commit.author.date,
            });
          }
        }
      }
      allCommits = Array.from(commitsBySha.values());
      console.log('github-commits API: Successfully fetched commits from all branches.', allCommits.length);
    }

    // Sort commits by date descending
    allCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const formattedCommits = allCommits.map(c => `${c.sha} - ${c.author}, ${new Date(c.date).toLocaleString()} : ${c.message}`).join('\n');

    return NextResponse.json({ commits: formattedCommits });

  } catch (error: unknown) {
    console.error(`github-commits API: Error: ${error}`);
    if (error instanceof GitHubAPIError) {
      return NextResponse.json({ error: 'Failed to get commits from GitHub', details: error.message }, { status: error.status });
    }
    if (error instanceof SyntaxError) { // From request.json()
      return NextResponse.json({ error: 'Invalid JSON body', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
