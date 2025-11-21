import { getGeminiModels } from './gemini';
import { AppError } from '@/lib/errors';

// Mock fetch
global.fetch = jest.fn();

describe('getGeminiModels', () => {
  const mockApiKey = 'test-api-key';
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, GEMINI_API_KEY: mockApiKey };
    (global.fetch as jest.Mock).mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return a list of models when API call is successful', async () => {
    const mockResponse = {
      models: [
        {
          name: 'models/gemini-pro',
          version: '001',
          displayName: 'Gemini Pro',
          description: 'The best model',
          inputTokenLimit: 30720,
          outputTokenLimit: 2048,
          supportedGenerationMethods: ['generateContent', 'countTokens'],
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const models = await getGeminiModels();
    expect(models).toHaveLength(1);
    expect(models[0].name).toBe('models/gemini-pro');
    expect(global.fetch).toHaveBeenCalledWith(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${mockApiKey}`
    );
  });

  it('should throw AppError when API key is missing', async () => {
    process.env.GEMINI_API_KEY = '';
    await expect(getGeminiModels()).rejects.toThrow(AppError);
    await expect(getGeminiModels()).rejects.toThrow('Gemini APIキーが設定されていません。');
  });

  it('should throw AppError when API call fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Bad Request' } }),
    });

    await expect(getGeminiModels()).rejects.toThrow(AppError);
    await expect(getGeminiModels()).rejects.toThrow('Bad Request');
  });

  it('should throw AppError when validation fails', async () => {
    const invalidResponse = {
      models: [
        {
          name: 'models/gemini-pro',
          // Missing required fields
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => invalidResponse,
    });

    await expect(getGeminiModels()).rejects.toThrow(AppError);
    await expect(getGeminiModels()).rejects.toThrow('Gemini APIからのレスポンス形式が不正です。');
  });
});
