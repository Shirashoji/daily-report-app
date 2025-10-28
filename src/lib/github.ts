// src/lib/github.ts
import { auth } from '@/app/api/auth/[...nextauth]/route';
import jwt from "jsonwebtoken";

const GITHUB_APP_ID = process.env.GITHUB_APP_ID!;
const GITHUB_APP_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY!;

export class GitHubAPIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GitHubAPIError';
    this.status = status;
  }
}

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
