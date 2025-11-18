// src/components/common/Navigation.tsx
import Link from 'next/link';
import type { ReactElement } from 'react';

export function Navigation(): ReactElement {
  return (
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
    </nav>
  );
}
