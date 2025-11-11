// src/hooks/useGitHub.ts
import { useState, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import type { ApiResponse } from "@/types/api";

/**
 * `useGitHub`フックが返す値の型定義。
 */
interface UseGitHubReturn {
  /** GitHubリポジトリのオーナー名。 */
  githubOwner: string;
  /** GitHubリポジトリ名。 */
  githubRepo: string;
  /** 取得したブランチ名のリスト。 */
  branches: string[];
  /** ブランチリストの読み込み状態を示すフラグ。 */
  branchesLoading: boolean;
  /** ブランチリスト取得時に発生したエラーメッセージ。 */
  branchesError: string | null;
  /** 選択されているブランチ名。 */
  selectedBranch: string;
  /** GitHubオーナー名を設定する関数。localStorageにも保存されます。 */
  handleSetGithubOwner: (owner: string) => void;
  /** GitHubリポジトリ名を設定する関数。localStorageにも保存されます。 */
  handleSetGithubRepo: (repo: string) => void;
  /** 選択するブランチ名を設定する関数。 */
  setSelectedBranch: (branch: string) => void;
  /** ブランチリストを再取得する関数。 */
  refetchBranches: () => void;
}

/**
 * ブランチリストAPIのレスポンスの型定義。
 */
interface BranchesResponse {
  /** ブランチ名の配列。 */
  branches: string[];
}

/**
 * GitHubリポジトリの設定（オーナー、リポジトリ名）を管理し、ブランチリストを取得するためのカスタムフック。
 * 設定値はlocalStorageに永続化されます。
 * @param {Session | null} session - NextAuthのセッションオブジェクト。
 * @returns {UseGitHubReturn} GitHub関連の状態とそれを更新する関数群を含むオブジェクト。
 */
export function useGitHub(session: Session | null): UseGitHubReturn {
  // GitHubオーナー名を管理するstate
  const [githubOwner, setGithubOwner] = useState("");
  // GitHubリポジトリ名を管理するstate
  const [githubRepo, setGithubRepo] = useState("");
  // ブランチリストを管理するstate
  const [branches, setBranches] = useState<string[]>([]);
  // ブランチリストの読み込み状態を管理するstate
  const [branchesLoading, setBranchesLoading] = useState(false);
  // ブランチリスト取得時のエラーメッセージを管理するstate
  const [branchesError, setBranchesError] = useState<string | null>(null);
  // 選択中のブランチ名を管理するstate
  const [selectedBranch, setSelectedBranch] = useState("all");

  // マウント時にlocalStorageから保存されたオーナー名とリポジトリ名を読み込む
  useEffect(() => {
    const savedGithubOwner = localStorage.getItem("githubOwner") || "";
    const savedGithubRepo = localStorage.getItem("githubRepo") || "";
    if (savedGithubOwner) setGithubOwner(savedGithubOwner);
    if (savedGithubRepo) setGithubRepo(savedGithubRepo);
  }, []);

  /**
   * GitHubオーナー名を設定し、localStorageに保存する。
   * @param {string} owner - 設定するオーナー名。
   */
  const handleSetGithubOwner = (owner: string): void => {
    setGithubOwner(owner);
    localStorage.setItem("githubOwner", owner);
  };

  /**
   * GitHubリポジトリ名を設定し、localStorageに保存する。
   * @param {string} repo - 設定するリポジトリ名。
   */
  const handleSetGithubRepo = (repo: string): void => {
    setGithubRepo(repo);
    localStorage.setItem("githubRepo", repo);
  };

  /**
   * API経由でリポジトリのブランチリストを取得する。
   */
  const fetchBranches = useCallback(async (): Promise<void> => {
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
    }
  }, [githubOwner, githubRepo, session]);

  // オーナー名、リポジトリ名、セッションが変更された時にブランチリストを再取得
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

