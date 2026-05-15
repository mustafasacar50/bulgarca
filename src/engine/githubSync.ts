import { GitHubConfig } from '../types/sync';

export class GithubApiError extends Error {
  constructor(public status: number, public body: any, message: string) {
    super(message);
    this.name = 'GithubApiError';
  }
}

/**
 * Fetches a file from GitHub repository
 */
export async function getGithubFile({ token, owner, repo, path, branch }: GitHubConfig & { path: string }) {
  // Normalize path: remove leading slashes
  const cleanPath = path.replace(/^\/+/, '');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}?ref=${branch}&_t=${Date.now()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      },
    });

    if (response.status === 404) return null;
    
    if (!response.ok) {
      let errorBody;
      try { errorBody = await response.json(); } catch { errorBody = await response.text(); }
      throw new GithubApiError(response.status, errorBody, `GitHub API Error (${response.status}): ${JSON.stringify(errorBody)}`);
    }

    const data = await response.json();
    if (!data.content) return { content: null, sha: data.sha };
    
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
  } catch (e: any) {
    if (e instanceof GithubApiError) throw e;
    // Generic fetch error (network, CORS, etc.)
    throw new Error(`GitHub bağlantı hatası (${cleanPath}): ${e.message}`);
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
  const cleanPath = path.replace(/^\/+/, '');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;
  
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
    let errorBody;
    try { errorBody = await response.json(); } catch { errorBody = await response.text(); }
    throw new GithubApiError(response.status, errorBody, `GitHub Update Error (${response.status}): ${JSON.stringify(errorBody)}`);
  }

  return response.json();
}

/**
 * Higher level function to save JSON content to GitHub
 * Handles 409 conflicts by retrying with a fresh SHA
 */
export async function saveJsonToGithub<T>(config: GitHubConfig, path: string, content: T, message: string, retryCount = 0): Promise<any> {
  const cleanPath = path.replace(/^\/+/, '');
  
  // 1. Check if exists and get current SHA
  let existing;
  try {
    existing = await getGithubFile({ ...config, path: cleanPath });
  } catch (e) {
    // If it's a real error (not 404), log and throw
    console.error(`Fetch error before save (${cleanPath}):`, e);
    throw e;
  }
  
  // 2. Perform the update/creation
  try {
    return await putGithubFile({
      ...config,
      path: cleanPath,
      content,
      sha: existing?.sha,
      message,
    });
  } catch (error: any) {
    // 409 Conflict or 422 Unprocessable Entity (often SHA mismatch)
    const status = error.status;
    const isConflict = status === 409 || status === 422 || error.message?.toLowerCase().includes('conflict') || error.message?.toLowerCase().includes('sha');
    
    if (isConflict && retryCount < 5) {
      console.warn(`GitHub conflict detected for ${cleanPath}. Retrying (${retryCount + 1}/5) with fresh SHA...`);
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return saveJsonToGithub(config, cleanPath, content, message, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Applies an import bundle to the content repository with idempotency and conflict resolution
 */
export async function applyImportBundleToGithub(
  config: GitHubConfig,
  bundle: any,
  options: { onProgress?: (msg: string) => void, force?: boolean } = {}
) {
  const { onProgress, force = false } = options;
  const { files = [], patches = [], package_id, bundle_id, commit_message } = bundle;
  const bid = package_id || bundle_id;
  const msg = commit_message || `Import BULGARCA content package: ${bid}`;

  const summary = {
    added: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    details: [] as string[]
  };

  // Check if already applied
  const appliedBundles = JSON.parse(localStorage.getItem('bulgarca.appliedBundles.v1') || '[]');
  if (appliedBundles.includes(bid) && !force) {
    throw new Error(`ALREADY_APPLIED:${bid}`);
  }

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // 1. Process regular files
  for (const file of files) {
    await delay(300);
    const cleanPath = file.path.replace(/^\/+/, '');
    try {
      if (onProgress) onProgress(`Dosya işleniyor: ${cleanPath}`);
      const existing = await getGithubFile({ ...config, path: cleanPath });
      
      const isNew = !existing;
      await saveJsonToGithub(config, cleanPath, file.content, msg);

      if (isNew) {
        summary.added++;
        summary.details.push(`Eklendi: ${cleanPath}`);
      } else {
        summary.updated++;
        summary.details.push(`Güncellendi: ${cleanPath}`);
      }
    } catch (e: any) {
      summary.errors++;
      summary.details.push(`Hata (${cleanPath}): ${e.message}`);
    }
  }

  // 2. Process patches
  for (const patch of patches) {
    await delay(300);
    const targetPath = patch.target_path.replace(/^\/+/, '');
    try {
      if (onProgress) onProgress(`Yama uygulanıyor: ${targetPath}`);
      
      // ALWAYS get fresh file right before patch
      const existing = await getGithubFile({ ...config, path: targetPath });
      
      // Default content if file missing
      let content = existing?.content;
      if (!content) {
        if (targetPath.includes('manifest.json')) {
          content = { lessons: [], rule_files: [], glossary_files: [] };
        } else if (patch.operation.startsWith('merge_')) {
          content = patch.operation === 'merge_manifest_lessons' ? { lessons: [] } : [];
        } else {
          content = {};
        }
      }
      
      let changed = false;

      if (patch.operation === 'merge_manifest_lessons') {
        if (!content.lessons) content.lessons = [];
        const newLessons = patch.data.lessons || patch.data;
        if (Array.isArray(newLessons)) {
          newLessons.forEach((newL: any) => {
            const lid = newL.id || newL.lesson_id;
            const idx = content.lessons.findIndex((l: any) => (l.id || l.lesson_id) === lid);
            if (idx >= 0) {
              if (force) {
                content.lessons[idx] = { ...content.lessons[idx], ...newL };
                changed = true;
              } else {
                summary.skipped++;
                summary.details.push(`Atlandı (Mevcut): Ders ${lid}`);
              }
            } else {
              content.lessons.push(newL);
              changed = true;
            }
          });
        }
        
        if (patch.data.rule_files) {
          const currentRules = content.rule_files || [];
          const combined = Array.from(new Set([...currentRules, ...patch.data.rule_files]));
          if (combined.length !== currentRules.length) {
            content.rule_files = combined;
            changed = true;
          }
        }
        if (patch.data.glossary_files) {
          const currentGlossaries = content.glossary_files || [];
          const combined = Array.from(new Set([...currentGlossaries, ...patch.data.glossary_files]));
          if (combined.length !== currentGlossaries.length) {
            content.glossary_files = combined;
            changed = true;
          }
        }

      } else if (patch.operation === 'merge_by_entry_id') {
        const entries = Array.isArray(content) ? content : (content.entries || []);
        const newEntries = patch.data.entries || patch.data;
        if (Array.isArray(newEntries)) {
          newEntries.forEach((newE: any) => {
            const idx = entries.findIndex((e: any) => e.entry_id === newE.entry_id);
            if (idx >= 0) {
              if (force) { entries[idx] = { ...entries[idx], ...newE }; changed = true; }
            } else { entries.push(newE); changed = true; }
          });
        }
        if (!Array.isArray(content)) content.entries = entries; else content = entries;

      } else if (patch.operation === 'merge_by_rule_id') {
        const rules = Array.isArray(content) ? content : (content.rules || []);
        const newRules = patch.data.rules || patch.data;
        if (Array.isArray(newRules)) {
          newRules.forEach((newR: any) => {
            const idx = rules.findIndex((r: any) => r.rule_id === newR.rule_id);
            if (idx >= 0) {
              if (force) { rules[idx] = { ...rules[idx], ...newR }; changed = true; }
            } else { rules.push(newR); changed = true; }
          });
        }
        if (!Array.isArray(content)) content.rules = rules; else content = rules;

      } else if (patch.operation === 'merge_sources') {
        const sources = Array.isArray(content) ? content : (content.sources || []);
        const newSources = patch.data.sources || patch.data;
        if (Array.isArray(newSources)) {
          newSources.forEach((newS: any) => {
            const idx = sources.findIndex((s: any) => s.source_id === newS.source_id);
            if (idx >= 0) {
              if (force) { sources[idx] = { ...sources[idx], ...newS }; changed = true; }
            } else { sources.push(newS); changed = true; }
          });
        }
        if (!Array.isArray(content)) content.sources = sources; else content = sources;
      }

      if (changed) {
        await saveJsonToGithub(config, targetPath, content, msg);
        summary.updated++;
        summary.details.push(`Yamalandı: ${targetPath}`);
      }
    } catch (e: any) {
      summary.errors++;
      summary.details.push(`Hata (Yama ${targetPath}): ${e.message}`);
    }
  }

  // Save to applied bundles
  if (bid && summary.errors === 0) {
    const updatedApplied = Array.from(new Set([...appliedBundles, bid]));
    localStorage.setItem('bulgarca.appliedBundles.v1', JSON.stringify(updatedApplied));
  }

  return { success: true, package_id: bid, summary };
}

/**
 * Connection and helper functions remain same but simplified
 */
export async function testGithubConnection(config: GitHubConfig) {
  try {
    const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
      headers: { Authorization: `token ${config.token}`, Accept: 'application/vnd.github.v3+json' },
    });
    return response.ok;
  } catch { return false; }
}

export async function loadUserDataFile<T>(config: GitHubConfig, fileName: string): Promise<T | null> {
  const userPath = config.username || 'mustafa';
  const result = await getGithubFile({ ...config, path: `users/${userPath}/${fileName}` });
  return result?.content as T || null;
}

export async function saveUserDataFile<T>(config: GitHubConfig, fileName: string, data: T) {
  const userPath = config.username || 'mustafa';
  return saveJsonToGithub(config, `users/${userPath}/${fileName}`, data, `Update ${fileName}`);
}
