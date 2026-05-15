import { VercelRequest, VercelResponse } from '@vercel/node';

const OWNER = 'mustafasacar50';
const REPO = 'bulgarca-user-data';
const BRANCH = 'main';
const TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  if (!TOKEN) {
    console.error('GITHUB_TOKEN is not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const path = 'registry/requests.json';
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;
    
    // 1. Get existing requests
    const getRes = await fetch(url, {
      headers: { Authorization: `token ${TOKEN}` }
    });
    
    let existingRequests = [];
    let sha = undefined;

    if (getRes.ok) {
      const data: any = await getRes.json();
      sha = data.sha;
      const content = Buffer.from(data.content, 'base64').toString();
      existingRequests = JSON.parse(content);
    } else if (getRes.status !== 404) {
      throw new Error('Failed to fetch registry');
    }

    // 2. Add new request
    const newRequest = {
      username,
      email,
      password, // Note: In a real app, hash this!
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };

    // Check if already exists
    if (existingRequests.some((r: any) => r.username === username || r.email === email)) {
      return res.status(400).json({ error: 'Bu kullanıcı adı veya e-posta ile zaten bir başvuru var.' });
    }

    existingRequests.push(newRequest);

    // 3. Save back to GitHub
    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `New registration request from ${username}`,
        content: Buffer.from(JSON.stringify(existingRequests, null, 2)).toString('base64'),
        sha,
        branch: BRANCH
      })
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      console.error('GitHub PUT error:', err);
      throw new Error('Failed to save request to GitHub');
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Register API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
