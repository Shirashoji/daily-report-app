import { useState, useEffect } from 'react';
import { Session } from 'next-auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchBranches(owner: string, repo: string, session: Session | null) {
  if (owner && repo && session) {

    try {
      const response = await fetch(`${API_BASE_URL}/api/get-branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo }),
      });
      const data = await response.json();
      if (response.ok) {
        return { branches: data.branches || [], error: null };
      } else {
        const errorDetails = data.details ? `: ${data.details}` : '';
        console.error(`Failed to fetch branches: ${data.error}${errorDetails}`);
        const errorMessage = data.details ? `${data.error}: ${data.details}` : data.error;
        return { branches: [], error: errorMessage || 'Failed to fetch branches.' };
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { branches: [], error: errorMessage };
    }
  }
  return { branches: [], error: null };
}

export function useGitHub(session: Session | null) {
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('all');

  useEffect(() => {
    const savedGithubOwner = localStorage.getItem('githubOwner') || '';
    const savedGithubRepo = localStorage.getItem('githubRepo') || '';
    setGithubOwner(savedGithubOwner);
    setGithubRepo(savedGithubRepo);
  }, []);

  const handleSetGithubOwner = (owner: string) => {
    setGithubOwner(owner);
    localStorage.setItem('githubOwner', owner);
  };

  const handleSetGithubRepo = (repo: string) => {
    setGithubRepo(repo);
    localStorage.setItem('githubRepo', repo);
  };

  useEffect(() => {
    const loadBranches = async () => {
      if (githubOwner && githubRepo) {
        const { branches, error } = await fetchBranches(githubOwner, githubRepo, session);
        setBranches(branches);
        setBranchesError(error);
      }
    };
    loadBranches();
  }, [githubOwner, githubRepo, session]);

  return {
    githubOwner,
    githubRepo,
    branches,
    branchesError,
    selectedBranch,
    handleSetGithubOwner,
    handleSetGithubRepo,
    setSelectedBranch,
  };
}
