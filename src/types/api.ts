export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface CommitHistoryResponse {
  commits: string;
}
