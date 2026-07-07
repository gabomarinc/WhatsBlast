import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export default async function handler(req: any, res: any) {
  const email = req.headers['x-user-email'] as string;
  if (!email) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  if (!sql) {
    return res.status(500).json({ error: 'Sin conexión a base de datos' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // GET: List all tokens for the user
  if (req.method === 'GET') {
    try {
      const tokens = await sql`
        SELECT id, name, token, created_at, last_used_at
        FROM api_tokens
        WHERE user_email = ${cleanEmail}
        ORDER BY created_at DESC
      `;
      return res.status(200).json(tokens);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: 'Error al listar tokens: ' + e.message });
    }
  }

  // POST: Create a new token
  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'El nombre del token es requerido' });
    }

    try {
      // Generate secure 32 byte hex token prefixed with kl_ (Kônsul Leads)
      const tokenString = 'kl_' + crypto.randomBytes(24).toString('hex');

      const result = await sql`
        INSERT INTO api_tokens (user_email, name, token)
        VALUES (${cleanEmail}, ${name}, ${tokenString})
        RETURNING id, name, token, created_at
      `;

      return res.status(201).json(result[0]);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: 'Error al crear token: ' + e.message });
    }
  }

  // DELETE: Revoke a token
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID de token requerido' });
    }

    try {
      await sql`
        DELETE FROM api_tokens
        WHERE id = ${parseInt(id, 10)} AND user_email = ${cleanEmail}
      `;
      return res.status(200).json({ success: true });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: 'Error al eliminar token: ' + e.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
