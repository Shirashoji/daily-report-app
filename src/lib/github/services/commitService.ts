// src/lib/github/services/commitService.ts

import { fetchFromGitHub } from "@/lib/github";
import type { CommitData } from "@/types/github";

/**
 * GitHub APIから返されるコミット情報の型定義（必要な部分のみ）。
 */
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

/**
 * GitHub APIから返されるブランチ情報の型定義（必要な部分のみ）。
 */
interface GitHubBranch {
  name: string;
}

/**
 * 指定された単一のブランチからコミットリストを取得します。
 * @param owner - リポジトリのオーナー名。
 * @param repo - リポジトリ名。
 * @param branch - ブランチ名。
 * @param since - 取得開始日時 (ISO 8601形式)。
 * @param until - 取得終了日時 (ISO 8601形式)。
 * @returns コミットデータの配列を解決するPromise。
 */
async function fetchCommitsForBranch(
  owner: string,
  repo: string,
  branch: string,
  since: string,
  until: string
): Promise<CommitData[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&since=${since}&until=${until}`;
  const response = await fetchFromGitHub(url, owner, repo);
  if (!response.ok) {
    console.error(`Failed to fetch commits for branch ${branch}: ${response.statusText}`);
    // 特定のブランチでのエラーが全体を止めないように空配列を返す
    return [];
  }
  const commits: GitHubCommit[] = await response.json();
  return commits.map((c) => ({
    sha: c.sha.substring(0, 7),
    message: c.commit.message,
    author: c.commit.author.name,
    date: c.commit.author.date,
  }));
}

/**
 * リポジトリの全ブランチからコミットリストを取得します。
 * 各ブランチからコミットを取得し、SHAハッシュで重複を除去します。
 * @param owner - リポジトリのオーナー名。
 * @param repo - リポジトリ名。
 * @param since - 取得開始日時 (ISO 8601形式)。
 * @param until - 取得終了日時 (ISO 8601形式)。
 * @returns 重複除去されたコミットデータの配列を解決するPromise。
 */
async function fetchCommitsFromAllBranches(
  owner: string,
  repo: string,
  since: string,
  until: string
): Promise<CommitData[]> {
  const branchesUrl = `https://api.github.com/repos/${owner}/${repo}/branches`;
  const branchesResponse = await fetchFromGitHub(branchesUrl, owner, repo);
  if (!branchesResponse.ok) {
    throw new Error(`Failed to fetch branches for ${owner}/${repo}: ${branchesResponse.statusText}`);
  }
  const branches: GitHubBranch[] = await branchesResponse.json();

  const commitPromises = branches.map((b) =>
    fetchCommitsForBranch(owner, repo, b.name, since, until)
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

/**
 * ブランチ指定に応じて、単一または全ブランチからコミットを取得し、日付で降順にソートします。
 * @param owner - リポジトリのオーナー名。
 * @param repo - リポジトリ名。
 * @param branch - ブランチ名 ('all'の場合は全ブランチ)。
 * @param since - 取得開始日時 (ISO 8601形式)。
 * @param until - 取得終了日時 (ISO 8601形式)。
 * @returns 日付でソートされたコミットデータの配列を解決するPromise。
 */
export async function getCommits(
  owner: string,
  repo: string,
  branch: string,
  since: string,
  until: string
): Promise<CommitData[]> {
  const commits =
    branch && branch !== "all"
      ? await fetchCommitsForBranch(owner, repo, branch, since, until)
      : await fetchCommitsFromAllBranches(owner, repo, since, until);

  return commits.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
