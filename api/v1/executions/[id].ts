import { neon } from '@neondatabase/serverless';
import { verifyApiKey } from '../../authHelper';

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

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'ID de campaña/ejecución requerido' });
  }

  try {
    const uploadId = parseInt(id, 10);
    
    // 2. Fetch upload metadata
    const uploadResult = await sql`
      SELECT id, filename, sheet_name, created_at
      FROM uploads
      WHERE id = ${uploadId} AND user_email = ${authContext.email}
    `;

    if (uploadResult.length === 0) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    // 3. Aggregate statistics on prospects
    const statsResult = await sql`
      SELECT 
        COUNT(id) as total,
        COUNT(CASE WHEN status = 'Nuevo' THEN 1 END) as pending,
        COUNT(CASE WHEN status ILIKE '%contactado%' OR status ILIKE '%éxito%' THEN 1 END) as contacted
      FROM prospects
      WHERE upload_id = ${uploadId}
    `;

    const stats = statsResult[0];

    return res.status(200).json({
      success: true,
      campaign: uploadResult[0],
      stats: {
        total: Number(stats.total),
        pending: Number(stats.pending),
        contacted: Number(stats.contacted)
      }
    });

  } catch (e: any) {
    console.error("Error in executions detail API:", e);
    return res.status(500).json({ error: 'Internal server error: ' + e.message });
  }
}
