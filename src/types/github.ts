/**
 * GitHubリポジトリを特定するための情報を格納するインターフェース。
 */
export interface Repository {
  /**
   * リポジトリのオーナー名。
   */
  owner: string;
  /**
   * リポジトリ名。
   */
  repo: string;
  /**
   * ブランチ名。
   */
  branch: string;
}

/**
 * GitHubのコミット情報を格納するインターフェース。
 */
export interface CommitData {
  /**
   * コミットのSHAハッシュ。
   */
  sha: string;
  /**
   * コミットメッセージ。
   */
  message: string;
  /**
   * コミットの作者名。
   */
  author: string;
  /**
   * コミット日時（ISO 8601形式）。
   */
  date: string;
}
