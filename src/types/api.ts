/**
 * APIレスポンスの汎用的な構造を定義するインターフェース。
 * @template T - レスポンスデータの型。
 */
export interface ApiResponse<T> {
  /**
   * 成功した場合のレスポンスデータ。
   */
  data?: T;
  /**
   * エラーが発生した場合のエラーメッセージ。
   */
  error?: string;
  /**
   * HTTPステータスコード。
   */
  status: number;
}

/**
 * コミット履歴APIのレスポンスの型定義。
 */
export interface CommitHistoryResponse {
  /**
   * 取得したコミット履歴の文字列。
   */
  commits: string;
}
