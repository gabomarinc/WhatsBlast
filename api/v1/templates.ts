import { neon } from '@neondatabase/serverless';
import { verifyApiKey } from '../authHelper';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Authenticate API Key
  const authContext = await verifyApiKey(req);
  if (!authContext) {
    return res.status(401).json({ error: 'API key inválida o no provista' });
  }

  if (!sql) {
    return res.status(500).json({ error: 'Sin conexión a base de datos' });
  }

  try {
    // 2. Fetch Templates
    const templates = await sql`
      SELECT id, name, content, created_at, updated_at
      FROM templates
      WHERE user_email = ${authContext.email}
      ORDER BY created_at DESC
    `;

    return res.status(200).json(templates);
  } catch (e: any) {
    console.error("Error in public templates API:", e);
    return res.status(500).json({ error: 'Internal server error: ' + e.message });
  }
}
