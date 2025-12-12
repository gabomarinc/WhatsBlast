import { neon } from '@neondatabase/serverless';
import { Prospect, User } from '../types';

// Helper to safely get environment variables from either VITE_ prefix or injected process.env
const getEnvVar = (key: string, viteKey: string) => {
  try {
    // 1. Try standard Vite Environment Variable (import.meta.env)
    const metaEnv = (import.meta as any).env || {};
    if (metaEnv[viteKey]) return metaEnv[viteKey];

    // 2. Try Injected Process Env (from vite.config.ts define)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
    
    // 3. Fallback
    // @ts-ignore
    return process.env[key];
  } catch (e) {
    return null;
  }
};

// 1. MAIN DB (HumanFlow Data - Writes allowed)
const MAIN_DB_URL = getEnvVar('DATABASE_URL', 'VITE_DATABASE_URL');
// Debug log to verify connection string presence (hiding credentials)
if (MAIN_DB_URL) {
  console.log('🔌 Main DB URL found:', MAIN_DB_URL.split('@')[1] || '...Hidden...');
} else {
  console.warn('⚠️ No DATABASE_URL found. App will run in offline mode.');
}

const sqlMain = MAIN_DB_URL ? neon(MAIN_DB_URL) : null;

// 2. AUTH DB (External Tool - Read Only recommended)
const AUTH_DB_URL = getEnvVar('AUTH_DATABASE_URL', 'VITE_AUTH_DATABASE_URL');
if (AUTH_DB_URL) console.log('🔌 Auth DB URL found');

const sqlAuth = AUTH_DB_URL ? neon(AUTH_DB_URL) : null;

export const NeonService = {
  
  /**
   * Checks if MAIN connection is available
   */
  isConnected: () => !!sqlMain,

  /**
   * Initializes the schema ONLY on the Main DB.
   */
  async initSchema() {
    if (!sqlMain) return;

    try {
      console.log('⚙️ Initializing Schema...');
      
      // 1. Users Table
      await sqlMain`
        CREATE TABLE IF NOT EXISTS users (
          email TEXT PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 2. Uploads
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

      // 3. Prospects
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

  /**
   * Logs a user in using the "Dual Database" strategy.
   */
  async loginUser(email: string): Promise<User | null> {
    const cleanEmail = email.toLowerCase().trim();
    let finalUser: User = { email: cleanEmail };

    // STEP 1: Fetch from External Auth DB (If available)
    if (sqlAuth) {
      try {
        const externalUser = await sqlAuth`
            SELECT id, name, logo_url, plan, company_name, role 
            FROM users 
            WHERE email = ${cleanEmail} 
            LIMIT 1
        `;

        if (externalUser && externalUser.length > 0) {
          const u = externalUser[0];
          console.log("✅ User found in External DB");
          finalUser = {
            ...finalUser,
            id: u.id,
            name: u.name,
            logo_url: u.logo_url,
            plan: u.plan,
            company_name: u.company_name,
            role: u.role
          };
        }
      } catch (err) {
        console.warn("⚠️ Error fetching from Auth DB:", err);
      }
    }

    // STEP 2: Ensure User exists in Main DB (Writes)
    if (sqlMain) {
      try {
        console.log(`💾 Syncing user ${cleanEmail} to Main DB...`);
        await sqlMain`
          INSERT INTO users (email) 
          VALUES (${cleanEmail})
          ON CONFLICT (email) 
          DO UPDATE SET last_seen = CURRENT_TIMESTAMP
        `;
        console.log("✅ User synced to Main DB");
      } catch (err) {
        console.error("❌ Error syncing user to Main DB", err);
        // We continue even if write fails, but warn the dev
      }
    } else {
        console.warn("⚠️ Main DB not connected. User not saved locally.");
    }

    return finalUser;
  },

  /**
   * Saves session to Main DB
   */
  async saveSession(email: string, filename: string, sheetName: string, mapping: any, prospects: Prospect[]) {
    if (!sqlMain) {
        console.error("❌ Cannot save session: No Main DB connection.");
        return null;
    }

    try {
      console.log(`💾 Saving session for ${email} file: ${filename}`);
      
      // Create Upload Record
      const uploadResult = await sqlMain`
        INSERT INTO uploads (user_email, filename, sheet_name, mapped_config)
        VALUES (${email}, ${filename}, ${sheetName}, ${mapping})
        RETURNING id
      `;
      
      const uploadId = uploadResult[0].id;
      console.log(`✅ Upload record created ID: ${uploadId}`);

      // Save Prospects Batch
      const batchSize = 50;
      for (let i = 0; i < prospects.length; i += batchSize) {
        const chunk = prospects.slice(i, i + batchSize);
        await Promise.all(chunk.map(p => sqlMain`
            INSERT INTO prospects (id, upload_id, user_email, data, status)
            VALUES (${p.id}, ${uploadId}, ${email}, ${p}, ${p.estado || 'Nuevo'})
        `));
      }
      console.log(`✅ ${prospects.length} prospects saved.`);

      return uploadId;
    } catch (error) {
      console.error('❌ Error saving session to DB:', error);
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
    } catch (error) {
       console.error("Error updating status:", error);
    }
  },

  async getUserHistory(email: string) {
      if (!sqlMain) return [];
      return await sqlMain`
        SELECT * FROM uploads WHERE user_email = ${email} ORDER BY created_at DESC LIMIT 5
      `;
  }
};