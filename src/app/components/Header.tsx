"use client";

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

const GITHUB_APP_NAME = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">
          <Link href="/daily">レポート作成ツール</Link>
        </h1>
        <nav className="flex items-center space-x-4">
          <Link href="/daily" className="hover:underline">日報</Link>
          <Link href="/meeting" className="hover:underline">MTG</Link>
          <Link href="/stats" className="hover:underline">統計</Link>
          <Link href="/settings" className="hover:underline">設定</Link>
          {session ? (
            <>
              <span className="text-sm">{session.user?.name || session.user?.email}</span>
              <button onClick={() => signOut()} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded">
                Sign out
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button onClick={() => signIn('github')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">
                Sign in with GitHub
              </button>
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
