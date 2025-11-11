// src/app/api/get-commits/route.ts
import { NextResponse } from "next/server";
import { fetchFromGitHub } from "@/lib/github";
import { AppError, ValidationError } from "@/lib/errors";
import type { ApiResponse, CommitHistoryResponse } from "@/types/api";
import type { CommitData } from "@/types/github";

// 日本標準時(JST)とUTCの時差（ミリ秒）
const JST_OFFSET = 9 * 60 * 60 * 1000;

/**
 * APIリクエストボディの型定義。
 */
interface RequestBody {
  owner: string;
  repo: string;
  branch: string;
  startDate: string;
  endDate: string;
}

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
  const branches: GitHubBranch[] = await branchesResponse.json();

  const commitPromises = branches.map((b) =>
    fetchCommitsForBranch(owner, repo, b.name, since, until).catch(() => {
      // 特定のブランチでエラーが発生しても全体が停止しないように空配列を返す
      return [];
    })
  );

  const results = await Promise.all(commitPromises);
  // Mapを使ってSHAに基づきコミットの重複を排除
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
 * コミットデータの配列を日付で降順にソートし、整形された文字列に変換します。
 * @param commits - フォーマットするコミットデータの配列。
 * @returns 整形されたコミット履歴の単一文字列。
 */
function formatCommits(commits: CommitData[]): string {
  const sortedCommits = commits.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return sortedCommits
    .map(
      (c) =>
        `${c.sha} - ${c.author}, ${new Date(c.date).toLocaleString(
          "ja-JP"
        )} : ${c.message}`
    )
    .join("\n");
}

/**
 * ブランチ指定に応じて、単一または全ブランチからコミットを取得する処理を振り分けます。
 * @param owner - リポジトリのオーナー名。
 * @param repo - リポジトリ名。
 * @param branch - ブランチ名 ('all'の場合は全ブランチ)。
 * @param since - 取得開始日時 (ISO 8601形式)。
 * @param until - 取得終了日時 (ISO 8601形式)。
 * @returns コミットデータの配列を解決するPromise。
 */
async function getCommits(
  owner: string,
  repo: string,
  branch: string,
  since: string,
  until: string
): Promise<CommitData[]> {
  if (branch && branch !== "all") {
    return fetchCommitsForBranch(owner, repo, branch, since, until);
  }
  return fetchCommitsFromAllBranches(owner, repo, since, until);
}

/**
 * エラーをハンドリングし、適切なNextResponseを返します。
 * @param error - 発生したエラー。
 * @returns エラー情報を含むNextResponse。
 */
function handleError(error: unknown): NextResponse<ApiResponse<null>> {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, status: error.statusCode },
      { status: error.statusCode }
    );
  }
  return NextResponse.json(
    { error: "予期せぬエラーが発生しました。", status: 500 },
    { status: 500 }
  );
}

/**
 * POST /api/get-commits
 * 指定されたリポジトリと期間のコミット履歴を取得するAPIエンドポイント。
 * @param request - Next.jsのRequestオブジェクト。
 * @returns フォーマットされたコミット履歴またはエラーを含むNextResponse。
 */
export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<CommitHistoryResponse | null>>> {
  try {
    const { owner, repo, branch, startDate, endDate }: RequestBody =
      await request.json();

    if (!owner || !repo) {
      throw new ValidationError(
        "リクエストボディには`owner`と`repo`が必要です。",
        "owner/repo"
      );
    }
    if (!startDate || !endDate) {
      throw new ValidationError(
        "リクエストボディには`startDate`と`endDate`が必要です。",
        "date"
      );
    }

    // JSTはUTC+9時間。GitHub APIはUTCで日付を扱うため、JSTでの丸一日をカバーするように時差を調整する。
    const since = new Date(
      new Date(startDate).getTime() - JST_OFFSET
    ).toISOString();
    const until = new Date(
      new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - JST_OFFSET
    ).toISOString();

    const commits = await getCommits(owner, repo, branch, since, until);
    const formattedCommits = formatCommits(commits);

    return NextResponse.json({
      data: { commits: formattedCommits },
      status: 200,
    });
  } catch (error: unknown) {
    return handleError(error);
  }
}
