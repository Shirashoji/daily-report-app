// @ts-expect-error - モジュールの拡張のため
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * NextAuthの組み込みセッション型をカスタムプロパティで拡張します。
   * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
   */
  interface Session {
    /**
     * GitHub APIへのアクセスに使用するアクセストークン。
     */
    accessToken?: string;
    /**
     * 認証プロセスでエラーが発生した場合のエラー情報。
     */
    error?: string;
    /**
     * ユーザー情報。DefaultSessionのuser型を拡張しています。
     */
    user: {
      /**
       * ユーザーのGitHub ID。
       */
      id?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /**
   * NextAuthの組み込みJWT型をカスタムプロパティで拡張します。
   * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
   */
  interface JWT {
    /**
     * JWTに含まれるアクセストークン。
     */
    accessToken?: string;
  }
}