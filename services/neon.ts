import { neon } from '@neondatabase/serverless';
import { Prospect, User, UploadRecord } from '../types';

const getEnvVar = (key: string, viteKey: string) => {
  try {
    const metaEnv = (import.meta as any).env || {};
    if (metaEnv[viteKey]) return metaEnv[viteKey];

    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
    
    // @ts-ignore
    return process.env[key];
  } catch {
    return null;
  }
};

const MAIN_DB_URL = getEnvVar('DATABASE_URL', 'VITE_DATABASE_URL');
if (MAIN_DB_URL) {
  console.log('🔌 Main DB URL found');
} else {
  console.warn('⚠️ No DATABASE_URL found. App will run in offline mode.');
}

const sqlMain = MAIN_DB_URL ? neon(MAIN_DB_URL) : null;

const AUTH_DB_URL = getEnvVar('AUTH_DATABASE_URL', 'VITE_AUTH_DATABASE_URL');
if (AUTH_DB_URL) console.log('🔌 Auth DB URL found');

const sqlAuth = AUTH_DB_URL ? neon(AUTH_DB_URL) : null;

export const NeonService = {
  
  isConnected: () => !!sqlMain,
  isAuthConnected: () => !!sqlAuth,

  async initSchema() {
    if (!sqlMain) return;

    try {
      console.log('⚙️ Initializing Schema...');
      
      await sqlMain`
        CREATE TABLE IF NOT EXISTS users (
          email TEXT PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await sqlMain`
        CREATE TABLE IF NOT EXISTS uploads (
          id SERIAL PRIMARY KEY,
          user_email TEXT REFERENCES users(email),
          filename TEXT NOT NULL,
          sheet_name TEXT NOT NULL,
          mapped_config JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await sqlMain`
        CREATE TABLE IF NOT EXISTS prospects (
          id TEXT PRIMARY KEY,
          upload_id INTEGER REFERENCES uploads(id),
          user_email TEXT REFERENCES users(email),
          data JSONB NOT NULL,
          status TEXT DEFAULT 'Nuevo',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      console.log('✅ Main DB Schema Initialized/Verified');
    } catch (error) {
      console.error('❌ Error initializing Main DB:', error);
    }
  },

  async loginUser(email: string, password: string): Promise<User | null> {
    const cleanEmail = email.toLowerCase().trim();
    let finalUser: User = { email: cleanEmail };
    let isAuthenticated = false;

    if (sqlAuth) {
      try {
        console.log(`🔐 Authenticating ${cleanEmail}...`);
        const externalUser = await sqlAuth`
            SELECT id, name, logo_url, plan, company_name, role 
            FROM users 
            WHERE email = ${cleanEmail} 
            AND password = ${password}
            LIMIT 1
        `;

        if (externalUser && externalUser.length > 0) {
          const u = externalUser[0];
          isAuthenticated = true;
          finalUser = {
            ...finalUser,
            id: u.id,
            name: u.name,
            logo_url: u.logo_url,
            plan: u.plan,
            company_name: u.company_name,
            role: u.role
          };
        } else {
            return null; 
        }
      } catch (err) {
        console.error("⚠️ Auth DB Error:", err);
        return null; 
      }
    } else {
        console.log("ℹ️ Demo Mode (No Auth DB).");
        isAuthenticated = true;
    }

    if (!isAuthenticated) return null;

    if (sqlMain) {
      try {
        await sqlMain`
          INSERT INTO users (email) 
          VALUES (${cleanEmail})
          ON CONFLICT (email) 
          DO UPDATE SET last_seen = CURRENT_TIMESTAMP
        `;
      } catch {
        // Ignore sync errors
      }
    }

    return finalUser;
  },

  async saveSession(email: string, filename: string, sheetName: string, mapping: any, prospects: Prospect[]) {
    if (!sqlMain) return null;

    try {
      // Create Upload Record
      const uploadResult = await sqlMain`
        INSERT INTO uploads (user_email, filename, sheet_name, mapped_config)
        VALUES (${email}, ${filename}, ${sheetName}, ${mapping})
        RETURNING id
      `;
      
      const uploadId = uploadResult[0].id;
      const batchSize = 50;
      
      // Save prospects in batches
      for (let i = 0; i < prospects.length; i += batchSize) {
        const chunk = prospects.slice(i, i + batchSize);
        await Promise.all(chunk.map(p => {
            // Ensure status is synced
            const status = p.estado || 'Nuevo';
            return sqlMain`
                INSERT INTO prospects (id, upload_id, user_email, data, status)
                VALUES (${p.id}, ${uploadId}, ${email}, ${p}, ${status})
            `;
        }));
      }

      return uploadId;
    } catch (error) {
      console.error('❌ Error saving session:', error);
      throw error;
    }
  },

  async updateProspectStatus(prospectId: string, newStatus: string) {
    if (!sqlMain) return;
    try {
      await sqlMain`
          UPDATE prospects 
          SET 
              status = ${newStatus},
              updated_at = CURRENT_TIMESTAMP,
              data = jsonb_set(data, '{estado}', ${`"${newStatus}"`}) 
          WHERE id = ${prospectId}
      `;
    } catch {
       // Silent fail in background
    }
  },

  // --- RECOVERY METHODS ---

  /**
   * Gets the list of previous uploads for the dashboard/connect screen
   */
  async getUserUploads(email: string): Promise<UploadRecord[]> {
      if (!sqlMain) return [];
      try {
        // We join to count prospects and how many are contacted
        const result = await sqlMain`
            SELECT 
                u.id, 
                u.filename, 
                u.sheet_name, 
                u.created_at,
                COUNT(p.id) as total_prospects,
                COUNT(CASE WHEN p.status ILIKE '%contactado%' OR p.status ILIKE '%éxito%' THEN 1 END) as contacted_count
            FROM uploads u
            LEFT JOIN prospects p ON u.id = p.upload_id
            WHERE u.user_email = ${email}
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT 10
        `;
        // @ts-ignore
        return result.map(r => ({
            id: r.id,
            filename: r.filename,
            sheet_name: r.sheet_name,
            created_at: r.created_at,
            total_prospects: Number(r.total_prospects),
            contacted_count: Number(r.contacted_count)
        }));
      } catch (e) {
          console.error("Error fetching history", e);
          return [];
      }
  },

  /**
   * Rehydrates a full session from DB
   */
  async getSessionProspects(uploadId: number): Promise<{ prospects: Prospect[], mapping: any }> {
      if (!sqlMain) throw new Error("No DB Connection");

      // 1. Get Mapping Config
      const uploadRes = await sqlMain`SELECT mapped_config FROM uploads WHERE id = ${uploadId}`;
      if (uploadRes.length === 0) throw new Error("Upload not found");
      const mapping = uploadRes[0].mapped_config;

      // 2. Get Prospects (We use the DB status as the source of truth)
      const prospectsRes = await sqlMain`SELECT data, status FROM prospects WHERE upload_id = ${uploadId}`;
      
      const prospects = prospectsRes.map(row => {
          const p = row.data as Prospect;
          // Override the JSON state with the indexed DB state which tracks updates
          return { ...p, estado: row.status };
      });

      return { prospects, mapping };
  }
};