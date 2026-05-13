export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface SyncState {
  isSyncing: boolean;
  lastSync?: string;
  error?: string;
}
