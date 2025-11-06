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
 * Generates a JWT for the GitHub App.
 * @returns {string} The generated JWT.
 */
function getAppToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now,
    exp: now + 60, // 1 minute
    iss: GITHUB_APP_ID,
  };

  const privateKey = GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');
  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
}

/**
 * Generates a GitHub App token and uses it to create an installation access token.
 * This token can be used to authenticate with the GitHub API on behalf of a GitHub App installation.
 * @param installationId The ID of the GitHub App installation.
 * @returns A promise that resolves to the installation access token.
 */
async function getInstallationAccessToken(installationId: string) {
  const appToken = getAppToken();

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
  if (!response.ok) {
    console.error('getInstallationAccessToken: Failed to get access token', response.status, data);
    throw new GitHubAPIError(data.message || 'Failed to get installation access token', response.status);
  }
  return data.token;
}

/**
 * Retrieves the session and returns the appropriate headers for making requests to the GitHub API.
 * It determines the correct GitHub App installation for the given repository,
 * generates an installation access token, and uses it for authentication.
 * @param owner The owner of the repository.
 * @param repo The name of the repository.
 * @returns A promise that resolves to the headers for a GitHub API request.
 * @throws {GitHubAPIError} If the session is not found, the installation cannot be determined, or an access token cannot be obtained.
 */
async function getGitHubHeaders(owner: string, repo: string) {
  const appToken = getAppToken();
  console.log(`getGitHubHeaders: Finding installation for ${owner}/${repo}`);

  // Find the installation for the specific repository, authenticated as the app
  const installationResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/installation`, {
    headers: {
      'Authorization': `Bearer ${appToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!installationResponse.ok) {
    const errorBody = await installationResponse.text();
    console.error(
      `getGitHubHeaders: Failed to get installation for ${owner}/${repo}. Status: ${installationResponse.status}`,
      errorBody
    );
    if (installationResponse.status === 404) {
      throw new GitHubAPIError(`GitHub App not installed on ${owner}/${repo}.`, 404);
    }
    throw new GitHubAPIError("Failed to get installation for repository.", installationResponse.status);
  }

  const installation = await installationResponse.json();
  const installationId = installation.id;

  if (!installationId) {
    console.error(`getGitHubHeaders: No installation ID found for ${owner}/${repo}.`);
    throw new GitHubAPIError(`Could not find GitHub App installation for ${owner}/${repo}.`, 404);
  }

  console.log(`getGitHubHeaders: Found installationId: ${installationId} for ${owner}/${repo}.`);
  const token = await getInstallationAccessToken(installationId.toString());

  if (!token) {
    console.error("getGitHubHeaders: Could not obtain installation access token.");
    throw new GitHubAPIError("Unauthorized: Could not obtain installation access token.", 401);
  }

  return {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
  };
}


/**
 * Fetches data from the GitHub API using the appropriate authentication for the specified repository.
 * @param url The GitHub API URL to fetch from.
 * @param owner The owner of the repository.
 * @param repo The name of the repository.
 * @returns A promise that resolves to the raw response from the GitHub API.
 * @throws {GitHubAPIError} If the fetch fails or the response is not ok.
 */
export async function fetchFromGitHub(url: string, owner: string, repo: string) {
  try {
    const headers = await getGitHubHeaders(owner, repo);
    console.log("fetchFromGitHub: Attempting to fetch from URL:", url);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`fetchFromGitHub: Request failed with status ${response.status}. Response: ${errorText}`);
      let errorData: Record<string, unknown> = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // Not a JSON response, which is fine.
      }
      throw new GitHubAPIError(String(errorData.message || errorText || "Failed to fetch from GitHub"), response.status);
    }

    return response;
  } catch (error) {
    console.error('fetchFromGitHub: Caught an error:', error);
    if (error instanceof GitHubAPIError) {
      throw error; // Re-throw custom error
    }
    // Handle network errors or other unexpected issues
    throw new GitHubAPIError('An unexpected error occurred while fetching from GitHub.', 500);
  }
}
