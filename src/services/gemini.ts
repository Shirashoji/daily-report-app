import { z } from 'zod';
import { AppError } from '@/lib/errors';

/**
 * Gemini APIのモデル情報のスキーマ
 */
const GeminiModelSchema = z.object({
  name: z.string(),
  version: z.string(),
  displayName: z.string(),
  description: z.string(),
  inputTokenLimit: z.number(),
  outputTokenLimit: z.number(),
  supportedGenerationMethods: z.array(z.string()),
  temperature: z.number().optional(),
  topP: z.number().optional(),
  topK: z.number().optional(),
});

/**
 * Gemini APIのレスポンススキーマ
 */
const GeminiModelsResponseSchema = z.object({
  models: z.array(GeminiModelSchema),
});

export type GeminiModel = z.infer<typeof GeminiModelSchema>;

/**
 * 利用可能なGeminiモデルのリストを取得します。
 * @returns モデルのリスト
 * @throws AppError APIエラーまたはバリデーションエラーが発生した場合
 */
export async function getGeminiModels(): Promise<GeminiModel[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError('Gemini APIキーが設定されていません。', 'CONFIG_ERROR', 500);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AppError(
        errorData.error?.message || `モデルの取得に失敗しました: ${response.status}`,
        'API_ERROR',
        response.status
      );
    }

    const data = await response.json();
    
    // バリデーション実行
    const parsedData = GeminiModelsResponseSchema.parse(data);
    
    return parsedData.models;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof z.ZodError) {
      console.error('Gemini API validation error:', error.errors);
      throw new AppError('Gemini APIからのレスポンス形式が不正です。', 'API_VALIDATION_ERROR', 502);
    }
    throw new AppError('予期せぬエラーが発生しました。', 'UNKNOWN_ERROR', 500);
  }
}
