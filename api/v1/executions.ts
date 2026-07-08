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

  if (req.method !== 'POST') {
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

  const { filename, sheet_name, mapping, prospects } = req.body;
  if (!filename || !sheet_name || !mapping || !prospects || !Array.isArray(prospects)) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos (filename, sheet_name, mapping, prospects)' });
  }

  try {
    const userEmail = authContext.email;

    // 2. Insert upload session
    const uploadResult = await sql`
        INSERT INTO uploads (user_email, filename, sheet_name, mapped_config)
        VALUES (${userEmail}, ${filename}, ${sheet_name}, ${mapping})
        RETURNING id
    `;
    const uploadId = uploadResult[0].id;

    // 3. Batch insert prospects
    const batchSize = 50;
    for (let i = 0; i < prospects.length; i += batchSize) {
        const chunk = prospects.slice(i, i + batchSize);
        await Promise.all(chunk.map((p: any) => {
             const prospectId = p.id || Math.random().toString(36).substring(2, 9);
             const status = p.estado || p.status || 'Nuevo';
             return sql`
                INSERT INTO prospects (id, upload_id, user_email, data, status)
                VALUES (${prospectId}, ${uploadId}, ${userEmail}, ${p}, ${status})
            `;
        }));
    }

    return res.status(201).json({
      success: true,
      message: 'Campaña iniciada y prospectos cargados con éxito',
      upload_id: uploadId,
      total_imported: prospects.length
    });

  } catch (e: any) {
    console.error("Error in public execution API:", e);
    return res.status(500).json({ error: 'Internal server error: ' + e.message });
  }
}
