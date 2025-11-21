// src/hooks/useGeminiModels.ts
import { useState, useEffect } from 'react';
import type { ApiResponse } from '@/types/api';

/**
 * Geminiモデルの情報を格納するインターフェース。
 */
interface GeminiModel {
  /** モデルの内部名（例: "models/gemini-2.5-flash"）。 */
  name: string;
  /** モデルの表示名。 */
  displayName: string;
}

/**
 * モデルリストAPIのレスポンスの型定義。
 */
interface ModelsResponse {
  /** Geminiモデルのリスト。 */
  models: GeminiModel[];
}

/**
 * `useGeminiModels`フックが返す値の型定義。
 */
interface UseGeminiModelsReturn {
  /** 取得したGeminiモデルのリスト。 */
  models: GeminiModel[];
  /** データの読み込み状態を示すフラグ。 */
  isLoading: boolean;
  /** 発生したエラーメッセージ。 */
  error: string | null;
}

/**
 * 利用可能なGeminiモデルのリストを取得するためのカスタムフック。
 * @returns {UseGeminiModelsReturn} モデルリスト、読み込み状態、エラー情報を含むオブジェクト。
 */
export function useGeminiModels(): UseGeminiModelsReturn {
  // Geminiモデルのリストを保持するstate
  const [models, setModels] = useState<GeminiModel[]>([]);
  // データの読み込み状態を管理するstate
  const [isLoading, setIsLoading] = useState(true);
  // エラーメッセージを保持するstate
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * APIからGeminiモデルのリストを非同期で取得する関数。
     */
    const fetchModels = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/get-gemini-models');
        const data: ApiResponse<ModelsResponse> = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error || 'Geminiモデルの取得に失敗しました。');
        }

        // 'generateContent'をサポートし、かつ'embedding'モデルではないモデルのみをフィルタリングする
        const filteredModels =
          data.data?.models.filter(
            (model) => model.name.includes('gemini') && !model.name.includes('embedding')
          ) || [];

        setModels(filteredModels);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました。';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []); // コンポーネントのマウント時に一度だけ実行

  return { models, isLoading, error };
}
