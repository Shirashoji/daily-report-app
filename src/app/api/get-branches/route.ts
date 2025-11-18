// src/app/api/get-branches/route.ts
import { NextResponse } from 'next/server';
import { fetchFromGitHub } from '@/lib/github';
import { AppError, GitHubAPIError, ValidationError } from '@/lib/errors';
import type { ApiResponse } from '@/types/api';

/**
 * APIリクエストボディの型定義。
 */
interface RequestBody {
  /** GitHubリポジトリのオーナー名。 */
  owner: string;
  /** GitHubリポジトリ名。 */
  repo: string;
}

/**
 * GitHub APIから返されるブランチ情報の型定義（必要な部分のみ）。
 */
interface GitHubBranch {
  /** ブランチ名。 */
  name: string;
}

/**
 * APIレスポンスのデータ部分の型定義。
 */
interface BranchesResponse {
  /** ブランチ名の配列。 */
  branches: string[];
}

/**
 * 指定されたリポジトリのブランチリストをGitHub APIから取得します。
 * @param owner - リポジトリのオーナー名。
 * @param repo - リポジトリ名。
 * @returns ブランチ名の配列を解決するPromise。
 * @throws {GitHubAPIError} GitHub APIからのレスポンスがエラーの場合。
 */
async function fetchBranches(owner: string, repo: string): Promise<string[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/branches`;
  const response = await fetchFromGitHub(url, owner, repo);
  const branches: GitHubBranch[] = await response.json();
  return branches.map((b) => b.name);
}

/**
 * エラーをハンドリングし、適切なNextResponseを返します。
 * @param error - 発生したエラー。
 * @returns エラー情報を含むNextResponse。
 */
function handleError(error: unknown): NextResponse<ApiResponse<null>> {
  if (error instanceof AppError) {
    return NextResponse.json(
      { data: null, error: error.message, status: error.statusCode },
      { status: error.statusCode }
    );
  }
  // リポジトリが見つからない404エラーを特異的にハンドリング
  if (error instanceof GitHubAPIError && error.statusCode === 404) {
    return NextResponse.json(
      {
        data: null,
        error:
          'リポジトリが見つかりません。プライベートリポジトリであるか、名前が間違っている可能性があります。',
        status: 404,
      },
      { status: 404 }
    );
  }
  return NextResponse.json(
    { data: null, error: '予期せぬエラーが発生しました。', status: 500 },
    { status: 500 }
  );
}

/**
 * POST /api/get-branches
 * 指定されたGitHubリポジトリのブランチリストを取得するAPIエンドポイント。
 * @param request - Next.jsのRequestオブジェクト。
 * @returns ブランチリストまたはエラーを含むNextResponse。
 */
export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<BranchesResponse | null>>> {
  try {
    const { owner, repo }: RequestBody = await request.json();

    // リクエストボディの検証
    if (!owner || !repo) {
      throw new ValidationError('リクエストボディには`owner`と`repo`が必要です。', 'owner/repo');
    }

    const branchNames = await fetchBranches(owner, repo);

    return NextResponse.json({ data: { branches: branchNames }, status: 200 });
  } catch (error: unknown) {
    return handleError(error);
  }
}
