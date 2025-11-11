// src/app/api/get-gemini-models/route.ts
import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import type { ApiResponse } from "@/types/api";

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
 * Google AI APIから返されるモデル情報の型定義（必要な部分のみ）。
 */
interface GeminiApiModel {
  name: string;
  displayName: string;
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
 * GET /api/get-gemini-models
 * 利用可能なGeminiモデルのリストを取得するAPIエンドポイント。
 * @returns モデルリストまたはエラーを含むNextResponse。
 */
export async function GET(): Promise<
  NextResponse<ApiResponse<ModelsResponse | null>>
> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AppError(
        "Gemini APIキーが設定されていません。",
        "CONFIG_ERROR",
        500
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AppError(
        errorData.error?.message ||
          `モデルの取得に失敗しました: ${response.status}`,
        "API_ERROR",
        response.status
      );
    }

    const data = await response.json();
    // APIからのレスポンスをクライアントが必要とする形式に整形
    const models = data.models.map((model: GeminiApiModel) => ({
      name: model.name,
      displayName: model.displayName,
    }));

    return NextResponse.json({ data: { models }, status: 200 });
  } catch (error: unknown) {
    return handleError(error);
  }
}