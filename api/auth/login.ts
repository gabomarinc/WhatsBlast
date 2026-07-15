import { serialize } from 'cookie';
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  const KINDE_ISSUER_URL = process.env.KINDE_ISSUER_URL;
  const KINDE_CLIENT_ID = process.env.KINDE_CLIENT_ID;
  const KINDE_SITE_URL = process.env.KINDE_SITE_URL || 'http://localhost:5173';

  if (!KINDE_ISSUER_URL || !KINDE_CLIENT_ID) {
    return res.status(500).json({ error: 'Missing Kinde environment variables' });
  }

  const prompt = req.query?.prompt;

  const code_verifier = crypto.randomBytes(32).toString('base64url');
  const code_challenge = crypto
    .createHash('sha256')
    .update(code_verifier)
    .digest('base64url');

  const state = crypto.randomBytes(16).toString('hex');

  const redirectUri = `${KINDE_SITE_URL}/api/auth/callback`;

  const authUrl = new URL(`${KINDE_ISSUER_URL}/oauth2/auth`);
  authUrl.searchParams.append('client_id', KINDE_CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', 'openid profile email');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('code_challenge', code_challenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');

  if (prompt === 'none') {
    authUrl.searchParams.append('prompt', 'none');
  }

  res.setHeader('Set-Cookie', [
    serialize('kinde_code_verifier', code_verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15, // 15 minutes
    }),
    serialize('kinde_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15,
    })
  ]);

  return res.redirect(302, authUrl.toString());
}
