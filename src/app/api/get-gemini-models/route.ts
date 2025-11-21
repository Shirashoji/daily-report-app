import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import type { ApiResponse } from '@/types/api';
import { getGeminiModels } from '@/services/gemini';

/**
 * クライアントに返すGeminiモデル情報の型定義。
 */
interface GeminiModel {
  /** モデルの内部名 (例: "models/gemini-1.5-flash")。 */
  name: string;
  /** モデルの表示名。 */
  displayName: string;
}

/**
 * このAPIの成功レスポンスのデータ部分の型定義。
 */
interface ModelsResponse {
  /** Geminiモデルのリスト。 */
  models: GeminiModel[];
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
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { data: null, error: '予期せぬエラーが発生しました。', status: 500 },
    { status: 500 }
  );
}

/**
 * GET /api/get-gemini-models
 * 利用可能なGeminiモデルのリストを取得するAPIエンドポイント。
 * @returns モデルリストまたはエラーを含むNextResponse。
 */
export async function GET(): Promise<NextResponse<ApiResponse<ModelsResponse | null>>> {
  try {
    const geminiModels = await getGeminiModels();

    // APIからのレスポンスをクライアントが必要とする形式に整形
    const models = geminiModels.map((model) => ({
      name: model.name,
      displayName: model.displayName,
    }));

    return NextResponse.json({ data: { models }, status: 200 });
  } catch (error: unknown) {
    return handleError(error);
  }
}
