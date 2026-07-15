import { serialize } from 'cookie';

export default async function handler(req: any, res: any) {
  const KINDE_ISSUER_URL = process.env.KINDE_ISSUER_URL;
  const KINDE_SITE_URL = process.env.KINDE_SITE_URL || 'http://localhost:5173';
  const KINDE_POST_LOGOUT_REDIRECT_URL = process.env.KINDE_POST_LOGOUT_REDIRECT_URL || KINDE_SITE_URL;

  res.setHeader('Set-Cookie', [
    serialize('app_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: -1,
    })
  ]);

  if (!KINDE_ISSUER_URL) {
    return res.redirect(302, KINDE_POST_LOGOUT_REDIRECT_URL);
  }

  const logoutUrl = new URL(`${KINDE_ISSUER_URL}/logout`);
  logoutUrl.searchParams.append('redirect', KINDE_POST_LOGOUT_REDIRECT_URL);

  return res.redirect(302, logoutUrl.toString());
}
