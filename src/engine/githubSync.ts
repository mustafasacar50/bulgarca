import { GitHubConfig } from '../types/sync';

/**
 * Fetches a file from GitHub repository
 */
export async function getGithubFile({ token, owner, repo, path, branch }: GitHubConfig & { path: string }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub error: ${response.statusText}`);

  const data = await response.json();
  if (!data.content) return { content: null, sha: data.sha };
  
  try {
    const b64 = data.content.replace(/\n/g, '');
    const binStr = atob(b64);
    const decoded = decodeURIComponent(
      Array.prototype.map.call(binStr, (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    
    if (!decoded || decoded.trim() === '') {
      return { content: null, sha: data.sha };
    }

    return {
      content: JSON.parse(decoded),
      sha: data.sha,
    };
  } catch (e) {
    console.error('Decoding or Parsing error:', e);
    throw new Error('Dosya içeriği geçersiz veya çözümlenemedi (JSON formatı hatalı olabilir).');
  }
}

/**
 * Updates or creates a file in GitHub repository
 */
export async function putGithubFile({
  token,
  owner,
  repo,
  path,
  branch,
  content,
  sha,
  message,
}: GitHubConfig & { path: string; content: any; sha?: string; message: string }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
      sha,
      branch,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GitHub error: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Higher level function to save JSON content to GitHub
 */
export async function saveJsonToGithub<T>(config: GitHubConfig, path: string, content: T, message: string) {
  const existing = await getGithubFile({ ...config, path });
  return putGithubFile({
    ...config,
    path,
    content,
    sha: existing?.sha,
    message,
  });
}

/**
 * Tests connection to GitHub repository
 */
export async function testGithubConnection(config: GitHubConfig) {
  try {
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Load user data from specific path
 */
export async function loadUserDataFile<T>(config: GitHubConfig, fileName: string): Promise<T | null> {
  const result = await getGithubFile({ ...config, path: `users/mustafa/${fileName}` });
  return result?.content as T || null;
}

/**
 * Save user data to specific path
 */
export async function saveUserDataFile<T>(config: GitHubConfig, fileName: string, data: T) {
  return saveJsonToGithub(config, `users/mustafa/${fileName}`, data, `Update ${fileName}`);
}
