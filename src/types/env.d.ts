declare namespace NodeJS {
  /**
   * Node.jsのプロセス環境変数の型定義を拡張します。
   */
  interface ProcessEnv {
    /**
     * GitHub AppのID。
     */
    GITHUB_APP_ID: string;
    /**
     * GitHub Appの秘密鍵。
     */
    GITHUB_APP_PRIVATE_KEY: string;
    /**
     * GitHub OAuth認証用のクライアントID。
     */
    AUTH_GITHUB_ID: string;
    /**
     * GitHub OAuth認証用のクライアントシークレット。
     */
    AUTH_GITHUB_SECRET: string;
    /**
     * NextAuth.jsがセッションの暗号化に使用するシークレット。
     */
    AUTH_SECRET: string;
    /**
     * Google Gemini APIのAPIキー。
     */
    GEMINI_API_KEY: string;
    /**
     * アプリケーションのAPIのベースURL（クライアントサイドで利用）。
     */
    NEXT_PUBLIC_API_BASE_URL: string;
    /**
     * GitHub Appの名前（クライアントサイドで表示用）。
     */
    NEXT_PUBLIC_GITHUB_APP_NAME?: string;
  }
}
