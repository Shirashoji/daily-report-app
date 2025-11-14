// src/contexts/GitHubContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { useSession } from "next-auth/react";
import type { ApiResponse } from "@/types/api";

interface BranchesResponse {
  branches: string[];
}

interface GitHubContextType {
  githubOwner: string;
  setGithubOwner: (owner: string) => void;
  githubRepo: string;
  setGithubRepo: (repo: string) => void;
  branches: string[];
  branchesLoading: boolean;
  branchesError: string | null;
  selectedBranch: string;
  setSelectedBranch: Dispatch<SetStateAction<string>>;
  refetchBranches: () => void;
}

import type { ReactElement } from "react";

// ... (imports)

// ... (interface)

const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

export function GitHubProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const { data: session } = useSession();
  const [githubOwner, setGithubOwnerState] = useState("");
  const [githubRepo, setGithubRepoState] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("all");

  useEffect(() => {
    const savedOwner = localStorage.getItem("githubOwner") || "";
    const savedRepo = localStorage.getItem("githubRepo") || "";
    setGithubOwnerState(savedOwner);
    setGithubRepoState(savedRepo);
  }, []);

  const setGithubOwner = (owner: string): void => {
    setGithubOwnerState(owner);
    localStorage.setItem("githubOwner", owner);
  };

  const setGithubRepo = (repo: string): void => {
    setGithubRepoState(repo);
    localStorage.setItem("githubRepo", repo);
  };

  const fetchBranches = useCallback(async () => {
    if (githubOwner && githubRepo && session) {
      setBranchesLoading(true);
      setBranchesError(null);
      try {
        const response = await fetch("/api/get-branches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner: githubOwner, repo: githubRepo }),
        });
        const data: ApiResponse<BranchesResponse> = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || "ブランチの取得に失敗しました。");
        }
        setBranches(data.data?.branches || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "不明なエラーが発生しました。";
        setBranchesError(errorMessage);
      } finally {
        setBranchesLoading(false);
      }
    } else {
      setBranches([]); // owner/repoがない場合はブランチリストをクリア
    }
  }, [githubOwner, githubRepo, session]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const value = {
    githubOwner,
    setGithubOwner,
    githubRepo,
    setGithubRepo,
    branches,
    branchesLoading,
    branchesError,
    selectedBranch,
    setSelectedBranch,
    refetchBranches: fetchBranches,
  };

  return (
    <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>
  );
}

export function useGitHubContext(): GitHubContextType {
  const context = useContext(GitHubContext);
  if (context === undefined) {
    throw new Error("useGitHubContext must be used within a GitHubProvider");
  }
  return context;
}
