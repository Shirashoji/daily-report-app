// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/common/AuthSessionProvider";
import Header from "@/components/common/Header";
import { WorkTimeProvider } from "@/contexts/WorkTimeContext";
import { GitHubProvider } from "@/contexts/GitHubContext";
import type { ReactElement } from "react";

const inter = Inter({ subsets: ["latin"] });

/**
 * Next.jsアプリケーションのメタデータ。
 * ページのタイトルや説明などを定義します。
 */
export const metadata: Metadata = {
  title: "日報・議事録作成支援アプリ",
  description:
    "GitHubのコミット履歴から日報や議事録のドラフトを自動生成するアプリケーションです。",
};

/**
 * アプリケーションのルートレイアウト。
 * 全ページで共通のHTML構造、フォント、およびコンテキストプロバイダーを設定します。
 * @param {{ children: React.ReactNode }} props - コンポーネントのプロパティ。
 * @param {React.ReactNode} props.children - Next.jsによって渡される子コンポーネント（各ページ）。
 * @returns {ReactElement} アプリケーション全体のレイアウト。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): ReactElement {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* NextAuth.jsのセッション管理を有効にするプロバイダー */}
        <AuthSessionProvider>
          <GitHubProvider>
            {/* 作業時間の状態管理を行うプロバイダー */}
            <WorkTimeProvider>
              <Header />
              <main>{children}</main>
            </WorkTimeProvider>
          </GitHubProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
