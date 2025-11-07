// src/app/api/get-gemini-models/route.ts
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import type { ApiResponse } from '@/types/api';

interface GeminiModel {
  name: string;
  displayName: string;
}

interface ModelsResponse {
  models: GeminiModel[];
}

interface GeminiApiModel {
    name: string;
    displayName: string;
}

function handleError(error: unknown): NextResponse<ApiResponse<null>> {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message, status: error.statusCode }, { status: error.statusCode });
  }
  return NextResponse.json({ error: 'An unexpected error occurred', status: 500 }, { status: 500 });
}

export async function GET(): Promise<NextResponse<ApiResponse<ModelsResponse | null>>> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AppError('Gemini API key is not configured.', 'CONFIG_ERROR', 500);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AppError(
        errorData.error?.message || `Failed to fetch models: ${response.status}`,
        'API_ERROR',
        response.status
      );
    }

    const data = await response.json();
    const models = data.models.map((model: GeminiApiModel) => ({
      name: model.name,
      displayName: model.displayName,
    }));

    return NextResponse.json({ data: { models }, status: 200 });
  } catch (error: unknown) {
    return handleError(error);
  }
}