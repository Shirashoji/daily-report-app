// src/hooks/useGitHub.ts
import { useState, useEffect, useCallback } from 'react';
import { Session } from 'next-auth';
import type { ApiResponse } from '@/types/api';

interface UseGitHubReturn {
  githubOwner: string;
  githubRepo: string;
  branches: string[];
  branchesLoading: boolean;
  branchesError: string | null;
  selectedBranch: string;
  handleSetGithubOwner: (owner: string) => void;
  handleSetGithubRepo: (repo: string) => void;
  setSelectedBranch: (branch: string) => void;
  refetchBranches: () => void;
}

interface BranchesResponse {
  branches: string[];
}

/**
 * Custom hook to manage GitHub repository settings and fetch branches.
 * @param {Session | null} session - The NextAuth session object.
 * @returns {UseGitHubReturn} An object containing GitHub state and setters.
 */
export function useGitHub(session: Session | null): UseGitHubReturn {
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('all');

  useEffect(() => {
    const savedGithubOwner = localStorage.getItem('githubOwner') || '';
    const savedGithubRepo = localStorage.getItem('githubRepo') || '';
    if (savedGithubOwner) setGithubOwner(savedGithubOwner);
    if (savedGithubRepo) setGithubRepo(savedGithubRepo);
  }, []);

  const handleSetGithubOwner = (owner: string): void => {
    setGithubOwner(owner);
    localStorage.setItem('githubOwner', owner);
  };

  const handleSetGithubRepo = (repo: string): void => {
    setGithubRepo(repo);
    localStorage.setItem('githubRepo', repo);
  };

  const fetchBranches = useCallback(async (): Promise<void> => {
    if (githubOwner && githubRepo && session) {
      setBranchesLoading(true);
      setBranchesError(null);
      try {
        const response = await fetch('/api/get-branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner: githubOwner, repo: githubRepo }),
        });
        const data: ApiResponse<BranchesResponse> = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || 'Failed to fetch branches.');
        }
        setBranches(data.data?.branches || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setBranchesError(errorMessage);
      } finally {
        setBranchesLoading(false);
      }
    }
  }, [githubOwner, githubRepo, session]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return {
    githubOwner,
    githubRepo,
    branches,
    branchesLoading,
    branchesError,
    selectedBranch,
    handleSetGithubOwner,
    handleSetGithubRepo,
    setSelectedBranch,
    refetchBranches: fetchBranches,
  };
}
