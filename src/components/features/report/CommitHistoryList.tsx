// src/components/features/report/CommitHistoryList.tsx
'use client';

import type { ReactElement } from 'react';

interface CommitHistoryListProps {
  commitHistory: string;
}

/**
 * A simple component to display the commit history in a preformatted block.
 * @component
 */
export default function CommitHistoryList({ commitHistory }: CommitHistoryListProps): ReactElement {
  return (
    <pre className="bg-gray-100 p-2 rounded-md overflow-auto h-80 text-sm">{commitHistory}</pre>
  );
}
