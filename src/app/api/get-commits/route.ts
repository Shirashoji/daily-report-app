// src/app/api/get-commits/route.ts
import { NextResponse } from "next/server";
import { getCommits } from "@/lib/github/services/commitService";
import { AppError, ValidationError } from "@/lib/errors";
import type { ApiResponse } from "@/types/api";
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
  console.error("Unexpected error in /api/get-commits:", error);
  return NextResponse.json(
    { data: null, error: "予期せぬエラーが発生しました。", status: 500 },
    { status: 500 }
  );
}

/**
 * POST /api/get-commits
 * 指定されたリポジトリと期間のコミット履歴を取得するAPIエンドポイント。
 * @param request - Next.jsのRequestオブジェクト。
 * @returns コミットデータの配列またはエラーを含むNextResponse。
 */
export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<CommitData[] | null>>> {
  try {
    const { owner, repo, branch, startDate, endDate }: RequestBody =
      await request.json();

    if (!owner || !repo) {
      throw new ValidationError(
        "リクエストボディには`owner`と`repo`が必要です。"
      );
    }
    if (!startDate || !endDate) {
      throw new ValidationError(
        "リクエストボディには`startDate`と`endDate`が必要です。"
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

    return NextResponse.json({
      data: commits,
      status: 200,
    });
  } catch (error: unknown) {
    return handleError(error);
  }
}
