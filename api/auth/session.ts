import { parse } from 'cookie';
import { jwtVerify } from 'jose';

export default async function handler(req: any, res: any) {
  const KINDE_CLIENT_SECRET = process.env.KINDE_CLIENT_SECRET;
  if (!KINDE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Missing Kinde secret' });
  }

  const cookies = parse(req.headers.cookie || '');
  const sessionToken = cookies.app_session;

  if (!sessionToken) {
    return res.status(200).json({ user: null });
  }

  try {
    const secret = new TextEncoder().encode(KINDE_CLIENT_SECRET);
    const { payload } = await jwtVerify(sessionToken, secret);
    
    return res.status(200).json({ user: payload });
  } catch (error) {
    return res.status(200).json({ user: null }); // Invalid or expired token
  }
}
