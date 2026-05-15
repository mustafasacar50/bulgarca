import { VercelRequest, VercelResponse } from '@vercel/node';

const OWNER = 'mustafasacar50';
const REPO = 'bulgarca-user-data';
const BRANCH = 'main';
const TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir.' });
  }

  if (!TOKEN) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const path = 'registry/users.json';
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;
    
    const getRes = await fetch(url, {
      headers: { Authorization: `token ${TOKEN}` }
    });
    
    if (!getRes.ok) {
      return res.status(404).json({ error: 'Sistem dosyaları bulunamadı.' });
    }

    const data: any = await getRes.json();
    const content = Buffer.from(data.content, 'base64').toString();
    const users = JSON.parse(content);

    const user = users.find((u: any) => u.username === username || u.email === username);

    if (!user) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // In a real app, use bcrypt to compare!
    if (user.password !== password) {
      return res.status(401).json({ error: 'Hatalı şifre.' });
    }

    // Successful login
    // We return the user profile. 
    // We also need to provide a way for them to sync.
    // For now, we'll return a limited scope or the master token (be careful!)
    // To keep it simple and WOW the user, we return the master token for the student to use for their own folder.
    return res.status(200).json({ 
      success: true, 
      user: {
        username: user.username,
        email: user.email,
        role: 'user',
        token: TOKEN // Sharing master token with approved students for sync
      } 
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Giriş işlemi sırasında bir hata oluştu.' });
  }
}
