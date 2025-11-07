// src/app/api/get-branches/route.ts
import { NextResponse } from 'next/server';
import { fetchFromGitHub } from '@/lib/github';
import { AppError, GitHubAPIError, ValidationError } from '@/lib/errors';
import type { ApiResponse } from '@/types/api';

interface RequestBody {
  owner: string;
  repo: string;
}

interface GitHubBranch {
  name: string;
}

interface BranchesResponse {
  branches: string[];
}

async function fetchBranches(owner: string, repo: string): Promise<string[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/branches`;
  const response = await fetchFromGitHub(url, owner, repo);
  const branches: GitHubBranch[] = await response.json();
  return branches.map((b) => b.name);
}

function handleError(error: unknown): NextResponse<ApiResponse<null>> {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message, status: error.statusCode }, { status: error.statusCode });
  }
  if (error instanceof GitHubAPIError && error.statusCode === 404) {
    return NextResponse.json({ error: 'Repository not found. It might be a private repository you do not have access to, or the name is incorrect.', status: 404 }, { status: 404 });
  }
  return NextResponse.json({ error: 'An unexpected error occurred', status: 500 }, { status: 500 });
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<BranchesResponse | null>>> {
  try {
    const { owner, repo }: RequestBody = await request.json();

    if (!owner || !repo) {
      throw new ValidationError('owner and repo are required', 'owner/repo');
    }

    const branchNames = await fetchBranches(owner, repo);

    return NextResponse.json({ data: { branches: branchNames }, status: 200 });
  } catch (error: unknown) {
    return handleError(error);
  }
}
