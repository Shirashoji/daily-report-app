/**
 * アプリケーションの基本的なカスタムエラークラス。
 * エラーコードとHTTPステータスコードを保持します。
 */
export class AppError extends Error {
  /**
   * @param message - エラーメッセージ。
   * @param code - エラーを識別するためのユニークなコード。
   * @param statusCode - HTTPステータスコード。デフォルトは500。
   */
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * GitHub APIに関連するエラーを示すクラス。
 * AppErrorを継承します。
 */
export class GitHubAPIError extends AppError {
  /**
   * @param message - エラーメッセージ。
   * @param statusCode - GitHub APIから返されたHTTPステータスコード。
   */
  constructor(message: string, statusCode: number) {
    super(message, 'GITHUB_API_ERROR', statusCode);
    this.name = 'GitHubAPIError';
  }
}

/**
 * バリデーションエラーを示すクラス。
 * AppErrorを継承します。
 */
export class ValidationError extends AppError {
  /**
   * @param message - エラーメッセージ。
   * @param field - バリデーションエラーが発生したフィールド名。
   */
  constructor(
    message: string,
    public field: string
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}
