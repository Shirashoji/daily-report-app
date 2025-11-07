'use client';

interface CommitHistoryListProps {
  commitHistory: string;
}

export default function CommitHistoryList({ commitHistory }: CommitHistoryListProps) {
  return (
    <pre className="bg-gray-100 p-2 rounded-md overflow-auto h-80">{commitHistory}</pre>
  );
}
