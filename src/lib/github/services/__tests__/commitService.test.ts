// src/lib/github/services/__tests__/commitService.test.ts

import { getCommits } from "../commitService";
import { fetchFromGitHub } from "@/lib/github";

// fetchFromGitHubをモック化
jest.mock("@/lib/github", () => ({
  fetchFromGitHub: jest.fn(),
}));

// fetchFromGitHubのモックを型付け
const mockedFetchFromGitHub = fetchFromGitHub as jest.Mock;

// テスト用のダミーデータ
const mockCommit1 = { sha: "sha1", commit: { author: { name: "author1", date: "2025-11-13T12:00:00Z" }, message: "feat: commit 1" } };
const mockCommit2 = { sha: "sha2", commit: { author: { name: "author2", date: "2025-11-13T10:00:00Z" }, message: "fix: commit 2" } };
const mockCommit3 = { sha: "sha3", commit: { author: { name: "author1", date: "2025-11-13T14:00:00Z" }, message: "docs: commit 3" } };
const mockCommitMain = { sha: "sha_main", commit: { author: { name: "author_main", date: "2025-11-13T11:00:00Z" }, message: "merge commit" } };
const mockCommitDev = { sha: "sha_dev", commit: { author: { name: "author_dev", date: "2025-11-13T13:00:00Z" }, message: "dev commit" } };


describe("commitService", () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    mockedFetchFromGitHub.mockClear();
  });

  describe("getCommits (single branch)", () => {
    it("should fetch and return sorted commits for a single branch", async () => {
      mockedFetchFromGitHub.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockCommit1, mockCommit2, mockCommit3],
      });

      const commits = await getCommits("owner", "repo", "main", "since", "until");

      expect(mockedFetchFromGitHub).toHaveBeenCalledTimes(1);
      expect(mockedFetchFromGitHub).toHaveBeenCalledWith(
        "https://api.github.com/repos/owner/repo/commits?sha=main&since=since&until=until",
        "owner",
        "repo"
      );
      
      expect(commits).toHaveLength(3);
      // 日付で降順にソートされていることを確認 (mockCommit3 -> mockCommit1 -> mockCommit2)
      expect(commits[0].sha).toBe(mockCommit3.sha.substring(0, 7));
      expect(commits[1].sha).toBe(mockCommit1.sha.substring(0, 7));
      expect(commits[2].sha).toBe(mockCommit2.sha.substring(0, 7));
    });

    it("should return an empty array if fetching commits fails", async () => {
        mockedFetchFromGitHub.mockResolvedValueOnce({
            ok: false,
            statusText: "Not Found",
        });

        const commits = await getCommits("owner", "repo", "non-existent-branch", "since", "until");
        expect(commits).toEqual([]);
    });
  });

  describe("getCommits (all branches)", () => {
    it("should fetch from all branches, deduplicate, and sort commits", async () => {
      // 1. Mock branches fetch
      mockedFetchFromGitHub.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ name: "main" }, { name: "develop" }],
      });
      // 2. Mock main branch commits fetch (including a duplicate: mockCommit1)
      mockedFetchFromGitHub.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockCommitMain, mockCommit1],
      });
      // 3. Mock develop branch commits fetch
      mockedFetchFromGitHub.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockCommitDev, mockCommit1],
      });

      const commits = await getCommits("owner", "repo", "all", "since", "until");

      expect(mockedFetchFromGitHub).toHaveBeenCalledTimes(3);
      expect(mockedFetchFromGitHub).toHaveBeenCalledWith("https://api.github.com/repos/owner/repo/branches", "owner", "repo");
      expect(mockedFetchFromGitHub).toHaveBeenCalledWith("https://api.github.com/repos/owner/repo/commits?sha=main&since=since&until=until", "owner", "repo");
      expect(mockedFetchFromGitHub).toHaveBeenCalledWith("https://api.github.com/repos/owner/repo/commits?sha=develop&since=since&until=until", "owner", "repo");

      // 重複が排除されているか確認 (mockCommit1は1つだけ)
      expect(commits).toHaveLength(3);
      const shas = commits.map(c => c.sha);
      expect(shas).toContain(mockCommitMain.sha.substring(0, 7));
      expect(shas).toContain(mockCommitDev.sha.substring(0, 7));
      expect(shas).toContain(mockCommit1.sha.substring(0, 7));

      // 日付で降順にソートされているか確認 (mockCommitDev -> mockCommit1 -> mockCommitMain)
      expect(commits[0].sha).toBe(mockCommitDev.sha.substring(0, 7));
      expect(commits[1].sha).toBe(mockCommit1.sha.substring(0, 7));
      expect(commits[2].sha).toBe(mockCommitMain.sha.substring(0, 7));
    });

    it("should throw an error if fetching branches fails", async () => {
        mockedFetchFromGitHub.mockResolvedValueOnce({
            ok: false,
            statusText: "Forbidden",
        });

        await expect(getCommits("owner", "repo", "all", "since", "until")).rejects.toThrow(
            "Failed to fetch branches for owner/repo: Forbidden"
        );
    });
  });
});
