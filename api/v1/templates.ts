import { neon } from '@neondatabase/serverless';
import { verifyApiKey } from '../authHelper';

const dbUrl = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
const sql = dbUrl ? neon(dbUrl) : null;

export default async function handler(req: any, res: any) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
