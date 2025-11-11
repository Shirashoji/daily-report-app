"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactElement, ReactNode } from "react";

/**
 * NextAuth.jsの `SessionProvider` でアプリケーションをラップするクライアントサイドコンポーネント。
 * これにより、アプリケーション内のどこからでも `useSession` フックを通じてセッション情報にアクセスできるようになります。
 *
 * @param {{ children: ReactNode }} props - コンポーネントのプロパティ。
 * @param {ReactNode} props.children - ラップする子コンポーネント。
 * @returns {ReactElement} `SessionProvider` でラップされた子コンポーネント。
 * @see https://next-auth.js.org/getting-started/client#sessionprovider
 */
export default function AuthSessionProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return <SessionProvider>{children}</SessionProvider>;
}