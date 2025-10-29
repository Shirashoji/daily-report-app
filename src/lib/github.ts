// src/lib/github.ts
import { auth } from '@/app/api/auth/[...nextauth]/route';
import jwt from "jsonwebtoken";

const GITHUB_APP_ID = process.env.GITHUB_APP_ID!;
const GITHUB_APP_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY!;

/**
 * Custom error class for GitHub API errors.
 * @param {string} message - The error message.
 * @param {number} status - The HTTP status code.
 * @extends Error
 * @property {number} status - The HTTP status code.
 * @property {string} name - The name of the error.
 *
 */
export class GitHubAPIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GitHubAPIError';
    this.status = status;
  }
}

/**
 * Generates a GitHub App token and uses it to create an installation access token.
 * This token can be used to authenticate with the GitHub API on behalf of a GitHub App installation.
 * @param installationId The ID of the GitHub App installation.
 * @returns A promise that resolves to the installation access token.
 */
async function getInstallationAccessToken(installationId: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now,
    exp: now + 60, // 1 minute
    iss: GITHUB_APP_ID,
  };

  const privateKey = GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');
  const appToken = jwt.sign(payload, privateKey, { algorithm: "RS256" });

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  const data = await response.json();
  return data.token;
}

/**
 * Retrieves the session and returns the appropriate headers for making requests to the GitHub API.
 * If an installation ID is present in the session, it will generate an installation access token.
 * Otherwise, it will use the user's access token.
 * @returns A promise that resolves to the headers for a GitHub API request.
 * @throws {GitHubAPIError} If the session is not found or an access token cannot be obtained.
 */
async function getGitHubHeaders() {
  const session = await auth();
  if (!session) {
    throw new GitHubAPIError('Unauthorized: No session found.', 401);
  }

  let token = session.accessToken;

  if (session.installationId) {
    token = await getInstallationAccessToken(session.installationId);
  }

  if (!token) {
    throw new GitHubAPIError('Unauthorized: No access token found.', 401);
  }

  return {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
  };
}

/**
 * Fetches data from the GitHub API using the appropriate authentication.
 * @param {string} url - The GitHub API URL to fetch from.
 * @returns {Promise<Response>} A promise that resolves to the raw response from the GitHub API.
 * @throws {GitHubAPIError} If the fetch fails or the response is not ok.
 */
export async function fetchFromGitHub(url: string) {
  try {
    const headers = await getGitHubHeaders();
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorData = await response.json();
      throw new GitHubAPIError(errorData.message || 'Failed to fetch from GitHub', response.status);
    }

    return response;
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      throw error; // Re-throw custom error
    }
    // Handle network errors or other unexpected issues
    throw new GitHubAPIError('An unexpected error occurred while fetching from GitHub.', 500);
  }
}
