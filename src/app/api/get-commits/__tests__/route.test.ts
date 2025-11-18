/** @jest-environment node */

// src/app/api/get-commits/__tests__/route.test.ts
import { POST } from '@/app/api/get-commits/route';
import { getCommits } from '@/lib/github/services/commitService';
import type { CommitData } from '@/types/github';

// getCommitsをモック化
jest.mock('@/lib/github/services/commitService');

const mockGetCommits = getCommits as jest.Mock;

describe('POST /api/get-commits', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('正常なリクエストでコミットデータを取得できること', async () => {
    const mockCommits: CommitData[] = [
      {
        sha: '1234567',
        message: 'feat: Initial commit',
        author: 'test-user',
        date: '2024-01-01T12:00:00Z',
      },
    ];
    mockGetCommits.mockResolvedValue(mockCommits);

    const requestBody = {
      owner: 'test-owner',
      repo: 'test-repo',
      branch: 'main',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
    };

    const request = {
      json: async () => Promise.resolve(requestBody),
    } as Request;

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.data).toEqual(mockCommits);
    expect(responseBody.error).toBeUndefined();

    const expectedSince = '2023-12-31T15:00:00.000Z'; // JST 2024-01-01 00:00:00
    const expectedUntil = '2024-01-01T15:00:00.000Z'; // JST 2024-01-02 00:00:00
    expect(mockGetCommits).toHaveBeenCalledWith(
      requestBody.owner,
      requestBody.repo,
      requestBody.branch,
      expect.stringMatching(expectedSince.slice(0, 19)), // ミリ秒を無視
      expect.stringMatching(expectedUntil.slice(0, 19))
    );
  });

  it('ownerかrepoがない場合に400エラーを返すこと', async () => {
    const requestBody = {
      repo: 'test-repo',
      branch: 'main',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
    };

    const request = {
      json: async () => Promise.resolve(requestBody),
    } as Request;

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.data).toBeNull();
    expect(responseBody.error).toBe('リクエストボディには`owner`と`repo`が必要です。');
  });

  it('startDateかendDateがない場合に400エラーを返すこと', async () => {
    const requestBody = {
      owner: 'test-owner',
      repo: 'test-repo',
      branch: 'main',
      endDate: '2024-01-01',
    };

    const request = {
      json: async () => Promise.resolve(requestBody),
    } as Request;

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.data).toBeNull();
    expect(responseBody.error).toBe('リクエストボディには`startDate`と`endDate`が必要です。');
  });

  it('getCommitsでエラーが発生した場合に500エラーを返すこと', async () => {
    const errorMessage = 'Internal Server Error';
    mockGetCommits.mockRejectedValue(new Error(errorMessage));

    const requestBody = {
      owner: 'test-owner',
      repo: 'test-repo',
      branch: 'main',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
    };

    const request = {
      json: async () => Promise.resolve(requestBody),
    } as Request;

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody.data).toBeNull();
    expect(responseBody.error).toBe('予期せぬエラーが発生しました。');
  });
});
