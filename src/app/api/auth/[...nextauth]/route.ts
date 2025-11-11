// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import type { JWT } from "next-auth/jwt";
import type { Account, Session } from "next-auth";

// 必須の環境変数が設定されているかを確認
if (!process.env.AUTH_GITHUB_ID) {
  throw new Error("環境変数 AUTH_GITHUB_ID が設定されていません。");
}
if (!process.env.AUTH_GITHUB_SECRET) {
  throw new Error("環境変数 AUTH_GITHUB_SECRET が設定されていません。");
}
if (!process.env.AUTH_SECRET) {
  throw new Error("環境変数 AUTH_SECRET が設定されていません。");
}

/**
 * NextAuth.jsの設定オブジェクト。
 * 認証プロバイダー、コールバック、セッション管理などを設定します。
 */
const nextAuthOptions: NextAuthConfig = {
  // セッションの暗号化に使用するシークレットキー
  secret: process.env.AUTH_SECRET,
  // Vercel環境でのデプロイ時に必要
  trustHost: true,
  // 認証プロバイダーのリスト
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      // ユーザーにリポジトリへのアクセス権限を要求する
      authorization: { params: { scope: "repo" } },
    }),
  ],
  // 認証フローの特定のイベントで実行されるコールバック関数
  callbacks: {
    /**
     * JWTが作成または更新されるたびに呼び出されます（例: サインイン時）。
     * ここでGitHubから取得したアクセストークンをJWTに含めます。
     * @param {object} params - コールバックに渡されるパラメータ。
     * @param {JWT} params.token - 現在のJWT。
     * @param {Account | null | undefined} params.account - ユーザーがサインインに使用したアカウント情報。
     * @returns {JWT} 更新されたJWT。
     * @see https://next-auth.js.org/configuration/callbacks#jwt-callback
     */
    async jwt({
      token,
      account,
    }: {
      token: JWT;
      account?: Account | null | undefined;
    }) {
      // サインイン時に`account`オブジェクトが存在する場合
      if (account) {
        // GitHubのアクセストークンをJWTに追加
        token.accessToken = account.access_token as string;
      }
      return token;
    },

    /**
     * セッションがチェックされるたびに呼び出されます（例: `useSession`フック使用時）。
     * JWTからアクセストークンを取り出し、クライアントサイドで利用可能なセッションオブジェクトに含めます。
     * @param {object} params - コールバックに渡されるパラメータ。
     * @param {Session} params.session - 現在のセッションオブジェクト。
     * @param {JWT} params.token - JWT。
     * @returns {Session} 更新されたセッションオブジェクト。
     * @see https://next-auth.js.org/configuration/callbacks#session-callback
     */
    async session({ session, token }: { session: Session; token: JWT }) {
      // セッションオブジェクトにアクセストークンを追加
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
};

// NextAuthを初期化し、ハンドラやヘルパー関数をエクスポート
export const { handlers, signIn, signOut, auth } = NextAuth(nextAuthOptions);

// Next.jsのルートハンドラとしてGETとPOSTリクエストを処理
export const GET = handlers.GET;
export const POST = handlers.POST;