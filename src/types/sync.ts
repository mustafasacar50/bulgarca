export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  username?: string;
}

export interface SyncState {
  isSyncing: boolean;
  lastSync?: string;
  error?: string;
}
