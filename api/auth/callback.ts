import { parse, serialize } from 'cookie';
import { decodeJwt, SignJWT } from 'jose';
import { neon } from '@neondatabase/serverless';

const dbUrl = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
const sql = dbUrl ? neon(dbUrl) : null;

export default async function handler(req: any, res: any) {
  const KINDE_ISSUER_URL = process.env.KINDE_ISSUER_URL;
  const KINDE_CLIENT_ID = process.env.KINDE_CLIENT_ID;
  const KINDE_CLIENT_SECRET = process.env.KINDE_CLIENT_SECRET;
  const KINDE_SITE_URL = process.env.KINDE_SITE_URL || 'http://localhost:5173';
  const KINDE_POST_LOGIN_REDIRECT_URL = process.env.KINDE_POST_LOGIN_REDIRECT_URL || `${KINDE_SITE_URL}/#dashboard`;

  if (!KINDE_ISSUER_URL || !KINDE_CLIENT_ID || !KINDE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Missing Kinde environment variables' });
  }

  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error('Kinde Auth Error:', error, error_description);
    if (error === 'login_required' || error === 'interaction_required') {
       return res.redirect(302, `${KINDE_SITE_URL}/#connect`);
    }
    return res.status(400).send(`Authentication error: ${error_description || error}`);
  }

  if (!code) {
    return res.status(400).send('No authorization code provided');
  }

  const cookies = parse(req.headers.cookie || '');
  const storedState = cookies.kinde_state;
  const codeVerifier = cookies.kinde_code_verifier;

  if (!storedState || !codeVerifier || state !== storedState) {
    return res.status(400).send('Invalid state or missing code verifier. Please try logging in again.');
  }

  const redirectUri = `${KINDE_SITE_URL}/api/auth/callback`;

  try {
    const tokenResponse = await fetch(`${KINDE_ISSUER_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${KINDE_CLIENT_ID}:${KINDE_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('Token exchange failed:', err);
      return res.status(400).send('Failed to exchange code for token');
    }

    const tokens = await tokenResponse.json();
    const idToken = tokens.id_token;
    
    const userPayload = decodeJwt(idToken);
    const email = userPayload.email as string;
    const name = userPayload.name as string || '';
    const picture = userPayload.picture as string || '';

    if (sql && email) {
      await sql`
        INSERT INTO users (email, name, logo_url, plan, role, company_name)
        VALUES (${email}, ${name}, ${picture}, 'free', 'user', '')
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          logo_url = EXCLUDED.logo_url,
          last_seen = CURRENT_TIMESTAMP
      `;
    }

    const sessionData = {
      email,
      name,
      logo_url: picture,
      id: userPayload.sub as string
    };
    
    const secret = new TextEncoder().encode(KINDE_CLIENT_SECRET);
    const sessionToken = await new SignJWT(sessionData)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    res.setHeader('Set-Cookie', [
      serialize('app_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }),
      serialize('kinde_code_verifier', '', { maxAge: -1, path: '/' }),
      serialize('kinde_state', '', { maxAge: -1, path: '/' })
    ]);

    return res.redirect(302, KINDE_POST_LOGIN_REDIRECT_URL);
  } catch (err: any) {
    console.error('Callback error:', err);
    return res.status(500).send('Internal Server Error during authentication');
  }
}
