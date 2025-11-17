// src/components/common/Header.tsx
'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import type { ReactElement } from 'react';

const GITHUB_APP_NAME = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;

/**
 * アプリケーション全体のヘッダーコンポーネント。
 * ナビゲーションリンクと、ユーザーの認証状態に応じたサインイン/サインアウトボタンを表示します。
 * @returns {ReactElement} ヘッダーコンポーネント。
 */
export default function Header(): ReactElement {
  const { data: session } = useSession();

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">
          <Link href="/daily">レポート作成ツール</Link>
        </h1>
        <nav className="flex items-center space-x-4">
          <Link href="/daily" className="hover:underline">
            日報
          </Link>
          <Link href="/meeting" className="hover:underline">
            MTG
          </Link>
          <Link href="/stats" className="hover:underline">
            統計
          </Link>
          <Link href="/settings" className="hover:underline">
            設定
          </Link>
          {session ? (
            // ユーザーがサインインしている場合の表示
            <>
              <span className="text-sm">{session.user?.name || session.user?.email}</span>
              <Button variant="danger" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            // ユーザーがサインアウトしている場合の表示
            <div className="flex items-center space-x-2">
              <Button variant="primary" size="sm" onClick={() => signIn('github')}>
                Sign in with GitHub
              </Button>
              {GITHUB_APP_NAME && (
                <a
                  href={`https://github.com/apps/${GITHUB_APP_NAME}/installations/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded"
                >
                  Install App
                </a>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
