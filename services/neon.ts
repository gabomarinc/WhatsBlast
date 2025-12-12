import { neon } from '@neondatabase/serverless';
import { Prospect, User, UploadRecord } from '../types';

/**
 * Robust helper to get environment variables in Vite/Vercel environments.
 * It checks import.meta.env first (Vite standard), then process.env (Vercel/Node).
 */
const getEnvVar = (key: string, viteKey: string): string | undefined => {
  // 1. Check Vite Standard (import.meta.env)
  // Casting import.meta to any to avoid TS errors if types aren't fully set up for Vite
  const meta = import.meta as any;
  if (typeof meta !== 'undefined' && meta.env) {
    if (meta.env[viteKey]) return meta.env[viteKey];
    if (meta.env[key]) return meta.env[key];
  }

  // 2. Check Global Process (Node/Vercel injected)
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
    // @ts-ignore
    if (process.env[viteKey]) return process.env[viteKey];
    // @ts-ignore
    if (process.env[key]) return process.env[key];
  }

  return undefined;
};

// --- CONFIGURATION ---

const MAIN_DB_URL = getEnvVar('DATABASE_URL', 'VITE_DATABASE_URL');
const AUTH_DB_URL = getEnvVar('AUTH_DATABASE_URL', 'VITE_AUTH_DATABASE_URL');

// Debug logs to help user verify connection in browser console
console.log(`🔌 Main DB Configured: ${!!MAIN_DB_URL}`);
console.log(`🔐 Auth DB Configured: ${!!AUTH_DB_URL}`);

// Initialize SQL Clients
const sqlMain = MAIN_DB_URL ? neon(MAIN_DB_URL) : null;
const sqlAuth = AUTH_DB_URL ? neon(AUTH_DB_URL) : null;

export const NeonService = {
  
  /** Checks if Main DB (Data) is connected */
  isConnected: () => !!sqlMain,

  /** Checks if Auth DB (Users) is connected */
  isAuthConnected: () => !!sqlAuth,

  /**
   * Initializes the schema ONLY for the Main Database (Prospects/Uploads).
   * It assumes the Auth Database schema is managed separately/manually.
   */
  async initSchema() {
    if (!sqlMain) return;

    try {
      console.log('⚙️ Initializing Main DB Schema...');
      
      // We keep a local copy of users in Main DB just for referencing/Foreign Keys, 
      // but the source of truth for login is Auth DB.
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

      console.log('✅ Main DB Schema Initialized');
    } catch (error) {
      console.error('❌ Error initializing Main DB:', error);
    }
  },

  /**
   * Authenticates against the AUTH_DATABASE_URL.
   * NOTE: Queries the 'companies' table.
   */
  async loginUser(email: string, password: string): Promise<User | null> {
    const cleanEmail = email.toLowerCase().trim();
    let finalUser: User = { email: cleanEmail };
    let isAuthenticated = false;

    if (sqlAuth) {
      try {
        console.log(`🔐 Checking credentials for ${cleanEmail} in Auth DB (table: companies)...`);
        
        // CHANGED: Query 'companies' table instead of 'users'
        // Using SELECT * to handle dynamic schema differences gracefully
        const externalUser = await sqlAuth`
            SELECT *
            FROM companies 
            WHERE email = ${cleanEmail} 
            AND password = ${password}
            LIMIT 1
        `;

        if (externalUser && externalUser.length > 0) {
          const u = externalUser[0];
          isAuthenticated = true;
          
          // Map DB columns to User object
          // Priority: u.company_name -> u.name
          finalUser = {
            ...finalUser,
            id: u.id,
            // If it's a companies table, 'name' is likely the Company Name
            // We use 'name' as fallback for company_name if the specific column doesn't exist
            company_name: u.company_name || u.name, 
            name: u.contact_name || u.name || cleanEmail.split('@')[0], // Try to find a human name, fallback to company name
            logo_url: u.logo_url,
            plan: u.plan,
            role: u.role
          };
          console.log("✅ Login successful");
        } else {
            console.warn("❌ Login Failed: Invalid Credentials or User not found.");
            return null; 
        }
      } catch (err) {
        console.error("⚠️ CRITICAL Auth DB Error:", err);
        return null;
      }
    } else {
        console.error("❌ Fatal: No AUTH_DATABASE_URL provided.");
        return null;
    }

    if (!isAuthenticated) return null;

    // Sync user existence to Main DB for foreign key constraints
    if (sqlMain) {
      try {
        await sqlMain`
          INSERT INTO users (email) 
          VALUES (${cleanEmail})
          ON CONFLICT (email) 
          DO UPDATE SET last_seen = CURRENT_TIMESTAMP
        `;
      } catch (e) {
        console.warn("⚠️ Could not sync user to Main DB (Non-critical):", e);
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
            const status = p.estado || 'Nuevo';
            return sqlMain`
                INSERT INTO prospects (id, upload_id, user_email, data, status)
                VALUES (${p.id}, ${uploadId}, ${email}, ${p}, ${status})
            `;
        }));
      }

      return uploadId;
    } catch (error) {
      console.error('❌ Error saving session to Main DB:', error);
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
    } catch (e) {
       console.error("Error updating status:", e);
    }
  },

  // --- RECOVERY METHODS ---

  async getUserUploads(email: string): Promise<UploadRecord[]> {
      if (!sqlMain) return [];
      try {
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
          console.error("Error fetching history from Main DB:", e);
          return [];
      }
  },

  async getSessionProspects(uploadId: number): Promise<{ prospects: Prospect[], mapping: any }> {
      if (!sqlMain) throw new Error("No Main DB Connection");

      const uploadRes = await sqlMain`SELECT mapped_config FROM uploads WHERE id = ${uploadId}`;
      if (uploadRes.length === 0) throw new Error("Upload not found");
      const mapping = uploadRes[0].mapped_config;

      const prospectsRes = await sqlMain`SELECT data, status FROM prospects WHERE upload_id = ${uploadId}`;
      
      const prospects = prospectsRes.map(row => {
          const p = row.data as Prospect;
          return { ...p, estado: row.status };
      });

      return { prospects, mapping };
  }
};