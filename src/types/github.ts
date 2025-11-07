export interface Repository {
  owner: string;
  repo: string;
  branch: string;
}

export interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: string;
}
