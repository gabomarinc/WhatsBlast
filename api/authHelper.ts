import { neon } from '@neondatabase/serverless';

const dbUrl = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
const sql = dbUrl ? neon(dbUrl) : null;

export async function verifyApiKey(req: any): Promise<{ email: string } | null> {
  let apiKey = req.headers['x-api-key'];
  
  if (!apiKey && req.headers['authorization']) {
    const authHeader = req.headers['authorization'] as string;
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      apiKey = authHeader.substring(7).trim();
    }
  }

  if (!apiKey && req.query) {
    apiKey = req.query.apiKey || req.query.api_key || req.query.token;
  }

  if (!apiKey || !sql) return null;

  try {
    const tokens = await sql`
      SELECT user_email FROM api_tokens 
      WHERE token = ${apiKey}
    `;

    if (tokens.length > 0) {
      // Update last used timestamp asynchronously
      sql`
        UPDATE api_tokens 
        SET last_used_at = CURRENT_TIMESTAMP 
        WHERE token = ${apiKey}
      `.catch(e => console.error("Error updating token last_used_at:", e));

      return { email: tokens[0].user_email };
    }
  } catch (e) {
    console.error("API authentication error:", e);
  }

  return null;
}
