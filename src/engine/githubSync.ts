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

/**
 * Applies an import bundle to the content repository
 */
export async function applyImportBundleToGithub(
  config: GitHubConfig,
  bundle: any,
  onProgress?: (msg: string) => void
) {
  const { files = [], patches = [], package_id, commit_message } = bundle;
  const msg = commit_message || `Import BULGARCA content package: ${package_id}`;

  // 1. Process regular files
  for (const file of files) {
    if (onProgress) onProgress(`Yükleniyor: ${file.path}`);
    await saveJsonToGithub(config, file.path, file.content, msg);
  }

  // 2. Process patches
  for (const patch of patches) {
    if (onProgress) onProgress(`Yamalanıyor: ${patch.target_path}`);
    const existing = await getGithubFile({ ...config, path: patch.target_path });
    let content = existing?.content || (patch.operation === 'merge_by_entry_id' || patch.operation === 'merge_by_rule_id' || patch.operation === 'merge_sources' ? [] : {});

    if (patch.operation === 'merge_manifest_lessons') {
      // Merge lessons into manifest
      if (!content.lessons) content.lessons = [];
      const newLessons = patch.data.lessons || patch.data;
      newLessons.forEach((newL: any) => {
        const idx = content.lessons.findIndex((l: any) => l.id === newL.id || l.lesson_id === newL.lesson_id);
        if (idx >= 0) content.lessons[idx] = { ...content.lessons[idx], ...newL };
        else content.lessons.push(newL);
      });
    } else if (patch.operation === 'merge_by_entry_id') {
      // Merge glossary entries
      const entries = Array.isArray(content) ? content : (content.entries || []);
      const newEntries = patch.data.entries || patch.data;
      newEntries.forEach((newE: any) => {
        const idx = entries.findIndex((e: any) => e.entry_id === newE.entry_id);
        if (idx >= 0) entries[idx] = { ...entries[idx], ...newE };
        else entries.push(newE);
      });
      if (!Array.isArray(content)) content.entries = entries;
      else content = entries;
    } else if (patch.operation === 'merge_by_rule_id') {
      // Merge rules
      const rules = Array.isArray(content) ? content : (content.rules || []);
      const newRules = patch.data.rules || patch.data;
      newRules.forEach((newR: any) => {
        const idx = rules.findIndex((r: any) => r.rule_id === newR.rule_id);
        if (idx >= 0) rules[idx] = { ...rules[idx], ...newR };
        else rules.push(newR);
      });
      if (!Array.isArray(content)) content.rules = rules;
      else content = rules;
    } else if (patch.operation === 'merge_sources') {
      // Merge sources
      const sources = Array.isArray(content) ? content : (content.sources || []);
      const newSources = patch.data.sources || patch.data;
      newSources.forEach((newS: any) => {
        const idx = sources.findIndex((s: any) => s.source_id === newS.source_id);
        if (idx >= 0) sources[idx] = { ...sources[idx], ...newS };
        else sources.push(newS);
      });
      if (!Array.isArray(content)) content.sources = sources;
      else content = sources;
    }

    await saveJsonToGithub(config, patch.target_path, content, msg);
  }

  return { success: true, package_id };
}
