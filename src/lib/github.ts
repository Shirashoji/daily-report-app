import { auth } from '@/app/api/auth/[...nextauth]/route';

export class GitHubAPIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GitHubAPIError';
    this.status = status;
  }
}

async function getGitHubHeaders() {
  const session = await auth();
  if (!session || !session.accessToken) {
    throw new GitHubAPIError('Unauthorized: No session or access token found.', 401);
  }
  return {
    'Authorization': `token ${session.accessToken}`,
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
    if (error instanceof Error) {
      throw new GitHubAPIError(`An unexpected error occurred while fetching from GitHub: ${error.message}`, 500);
    }
    throw new GitHubAPIError('An unexpected error occurred while fetching from GitHub.', 500);
  }
}
