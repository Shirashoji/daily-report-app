// src/hooks/useGeminiModels.ts
import { useState, useEffect } from 'react';
import type { ApiResponse } from '@/types/api';

interface GeminiModel {
  name: string;
  displayName: string;
}

interface ModelsResponse {
  models: GeminiModel[];
}

interface UseGeminiModelsReturn {
  models: GeminiModel[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch the list of available Gemini models.
 * @returns {UseGeminiModelsReturn} An object containing the models, loading state, and error.
 */
export function useGeminiModels(): UseGeminiModelsReturn {
  const [models, setModels] = useState<GeminiModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/get-gemini-models');
        const data: ApiResponse<ModelsResponse> = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error || 'Failed to fetch Gemini models.');
        }
        
        // Filter for models that support 'generateContent' and are not embeddings
        const filteredModels = data.data?.models.filter(model => 
          model.name.includes('gemini') && !model.name.includes('embedding')
        ) || [];

        setModels(filteredModels);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  return { models, isLoading, error };
}