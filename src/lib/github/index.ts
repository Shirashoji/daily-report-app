// src/lib/github/index.ts
import jwt from 'jsonwebtoken';
import { GitHubAPIError, AppError } from '@/lib/errors';

const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_APP_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY;

/**
 * Generates a JWT for the GitHub App.
 * @returns {string} The generated JWT.
 * @private
 */
function getAppToken(): string {
  if (!GITHUB_APP_ID || !GITHUB_APP_PRIVATE_KEY) {
    throw new AppError('GitHub App credentials are not configured.', 'CONFIG_ERROR', 500);
  }
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now,
    exp: now + 60, // 1 minute
    iss: GITHUB_APP_ID,
  };

  const privateKey = GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');
  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}

/**
 * Generates a GitHub App token and uses it to create an installation access token.
 * This token can be used to authenticate with the GitHub API on behalf of a GitHub App installation.
 * @param {string} installationId The ID of the GitHub App installation.
 * @returns {Promise<string>} A promise that resolves to the installation access token.
 * @throws {GitHubAPIError} If the access token cannot be obtained.
 * @private
 */
async function getInstallationAccessToken(installationId: string): Promise<string> {
  const appToken = getAppToken();

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new GitHubAPIError(data.message || 'Failed to get installation access token', response.status);
  }
  return data.token;
}

/**
 * Retrieves the session and returns the appropriate headers for making requests to the GitHub API.
 * It determines the correct GitHub App installation for the given repository,
 * generates an installation access token, and uses it for authentication.
 * @param {string} owner The owner of the repository.
 * @param {string} repo The name of the repository.
 * @returns {Promise<Record<string, string>>} A promise that resolves to the headers for a GitHub API request.
 * @throws {GitHubAPIError} If the installation cannot be determined, or an access token cannot be obtained.
 * @private
 */
async function getGitHubHeaders(owner: string, repo: string): Promise<Record<string, string>> {
  const appToken = getAppToken();

  const installationResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/installation`, {
    headers: {
      'Authorization': `Bearer ${appToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!installationResponse.ok) {
    if (installationResponse.status === 404) {
      throw new GitHubAPIError(`GitHub App not installed on ${owner}/${repo}. Please install it to proceed.`, 404);
    }
    throw new GitHubAPIError('Failed to get installation for repository.', installationResponse.status);
  }

  const installation = await installationResponse.json();
  const installationId = installation.id;

  if (!installationId) {
    throw new GitHubAPIError(`Could not find GitHub App installation for ${owner}/${repo}.`, 404);
  }

  const token = await getInstallationAccessToken(installationId.toString());

  if (!token) {
    throw new GitHubAPIError('Unauthorized: Could not obtain installation access token.', 401);
  }

  return {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
  };
}

/**
 * Fetches data from the GitHub API using the appropriate authentication for the specified repository.
 * @param {string} url The GitHub API URL to fetch from.
 * @param {string} owner The owner of the repository.
 * @param {string} repo The name of the repository.
 * @returns {Promise<Response>} A promise that resolves to the raw response from the GitHub API.
 * @throws {GitHubAPIError} If the fetch fails or the response is not ok.
 * @throws {AppError} For unexpected errors.
 * @example
 * const response = await fetchFromGitHub(
 *   'https://api.github.com/repos/owner/repo',
 *   'owner',
 *   'repo'
 * );
 */
export async function fetchFromGitHub(url: string, owner: string, repo: string): Promise<Response> {
  try {
    const headers = await getGitHubHeaders(owner, repo);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GitHubAPIError(
        errorData.message || `GitHub API request failed: ${response.status}`,
        response.status
      );
    }

    return response;
  } catch (error) {
    if (error instanceof GitHubAPIError || error instanceof AppError) {
      throw error;
    }
    throw new AppError('An unexpected error occurred while fetching from GitHub.', 'UNKNOWN_ERROR', 500);
  }
}