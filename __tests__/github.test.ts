import nock from 'nock';
import { fetchFromGitHub, GitHubAPIError } from '../src/lib/github';
import assert from 'assert';

// Mock the auth function to return a session
jest.mock('../src/app/api/auth/[...nextauth]/route', () => ({
  auth: jest.fn().mockResolvedValue({ accessToken: 'test-token' }),
}));

describe('fetchFromGitHub', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should include the original error message in the thrown GitHubAPIError', async () => {
    const errorMessage = 'Network error';
    nock('https://api.github.com')
      .get('/test')
      .replyWithError(errorMessage);

    await assert.rejects(
      fetchFromGitHub('https://api.github.com/test'),
      (error: Error) => {
        assert.strictEqual(error instanceof GitHubAPIError, true);
        assert.strictEqual(error.message.includes(errorMessage), true);
        return true;
      }
    );
  });
});
