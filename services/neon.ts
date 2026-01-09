import { neon } from '@neondatabase/serverless';
import { Prospect, User, UploadRecord } from '../types';

/**
 * --- SAFE ENVIRONMENT VARIABLE EXTRACTION ---
 */

let RAW_MAIN_URL: string | undefined = undefined;

// 1. Try process.env
try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
        // @ts-ignore
        if (process.env.DATABASE_URL) RAW_MAIN_URL = process.env.DATABASE_URL;
    }
} catch (e) {}

// 2. Fallback to import.meta.env
if (!RAW_MAIN_URL) {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            if (!RAW_MAIN_URL && import.meta.env.VITE_DATABASE_URL) RAW_MAIN_URL = import.meta.env.VITE_DATABASE_URL;
        }
    } catch (e) {}
}

/**
 * HELPER: Add SSL mode if missing
 */
const formatConnectionUrl = (url: string | undefined): string | undefined => {
    if (!url || typeof url !== 'string' || url.trim() === '') return undefined;
    if (!url.includes('sslmode=')) {
        return url.includes('?') ? `${url}&sslmode=require` : `${url}?sslmode=require`;
    }
    return url;
};

const MAIN_DB_URL = formatConnectionUrl(RAW_MAIN_URL);

// Debug Logs
console.group("🔌 Database Connection Debug");
console.log("Database URL:", MAIN_DB_URL ? "✅ Ready" : "❌ Missing URL");
console.groupEnd();

// Initialize Client (Single Source of Truth)
const sql = MAIN_DB_URL ? neon(MAIN_DB_URL) : null;

export const NeonService = {
  
  isConnected: () => !!sql,
  isAuthConnected: () => !!sql, // Backward compatibility alias

  /**
   * Initializes schema in MAIN DB.
   * Now includes full user profile fields since we removed external Auth DB.
   */
  async initSchema() {
    if (!sql) return;

    try {
      // 1. Base Users Table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          email TEXT PRIMARY KEY,
          password TEXT,
          name TEXT,
          company_name TEXT,
          logo_url TEXT,
          plan TEXT DEFAULT 'free',
          role TEXT DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 2. Migrations: Add columns if table existed from previous version but lacked auth fields
      // This ensures we don't break existing data, but we enable the new features.
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT`; } catch (e) {}
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`; } catch (e) {}
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT`; } catch (e) {}
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_url TEXT`; } catch (e) {}
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free'`; } catch (e) {}
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'`; } catch (e) {}

      // 3. Uploads Table
      await sql`
        CREATE TABLE IF NOT EXISTS uploads (
          id SERIAL PRIMARY KEY,
          user_email TEXT REFERENCES users(email),
          filename TEXT NOT NULL,
          sheet_name TEXT NOT NULL,
          mapped_config JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 4. Prospects Table
      await sql`
        CREATE TABLE IF NOT EXISTS prospects (
          id TEXT PRIMARY KEY,
          upload_id INTEGER REFERENCES uploads(id),
          user_email TEXT REFERENCES users(email),
          data JSONB NOT NULL,
          status TEXT DEFAULT 'Nuevo',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      console.log('✅ Main DB Schema Synced');

      // 5. Seed default admin if empty (Optional helper for quick start)
      const userCount = await sql`SELECT count(*) FROM users`;
      if (Number(userCount[0].count) === 0) {
          console.log("🌱 Seeding default admin user...");
          await sql`
            INSERT INTO users (email, password, name, company_name, plan, role)
            VALUES (
                'admin@humanflow.com', 
                'admin', 
                'Admin HumanFlow', 
                'HumanFlow HQ', 
                'unlimited', 
                'admin'
            )
          `;
      }

    } catch (error) {
      console.error('❌ Error initializing Main DB:', error);
    }
  },

  /**
   * Login Logic: Queries 'users' table in the MAIN DB.
   */
  async loginUser(email: string, password: string): Promise<User | null> {
    const cleanEmail = email.toLowerCase().trim();

    // --- 🚀 DEMO MODE ACCESS (Bypass DB entirely) ---
    if (cleanEmail === 'demo@humanflow.com' && password === 'demo') {
        console.log("🚀 ACCESS GRANTED: DEMO MODE ENABLED");
        
        // Sync Demo user to DB if connected, just so foreign keys work
        if (sql) {
            try {
                await sql`
                    INSERT INTO users (email, name, company_name) 
                    VALUES (${cleanEmail}, 'Usuario Demo', 'HumanFlow Demo')
                    ON CONFLICT (email) 
                    DO UPDATE SET last_seen = CURRENT_TIMESTAMP
                `;
            } catch (e) {}
        }

        return {
            id: 'demo-user-id',
            email: 'demo@humanflow.com',
            name: 'Usuario Demo',
            company_name: 'HumanFlow Demo',
            logo_url: 'https://cdn-icons-png.flaticon.com/512/9187/9187604.png',
            plan: 'unlimited',
            role: 'demo'
        };
    }
    
    // --- REAL DB LOGIN ---
    if (!sql) {
        console.error("❌ Fatal: Database connection not initialized.");
        return null;
    }

    try {
        console.log(`🔐 Authenticating ${cleanEmail} against Main DB...`);
        
        const users = await sql`
            SELECT * 
            FROM users 
            WHERE LOWER(email) = ${cleanEmail}
        `;

        if (users.length === 0) {
            console.warn(`❌ Login Failed: User not found.`);
            return null;
        }

        const user = users[0];
        const dbPassword = String(user.password || '');
        const inputPassword = String(password || '');

        // Note: In production, use bcrypt/argon2. For this app scope, text comparison is used.
        if (dbPassword !== inputPassword) {
            console.warn("❌ Login Failed: Password mismatch.");
            return null;
        }

        console.log("✅ Login Successful");

        // Update Last Seen
        try {
            await sql`UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE email = ${cleanEmail}`;
        } catch(e) {}

        return {
            id: user.id || cleanEmail, // Fallback ID
            email: user.email,
            name: user.name || cleanEmail.split('@')[0],
            company_name: user.company_name || "Mi Empresa",
            logo_url: user.logo_url,
            plan: user.plan,
            role: user.role
        };

    } catch (err) {
        console.error("⚠️ Database Error during login:", err);
        return null;
    }
  },

  async saveSession(email: string, filename: string, sheetName: string, mapping: any, prospects: Prospect[]) {
    // Graceful fallback for Demo/Local mode if DB is missing
    if (!sql) {
        console.warn("⚠️ SAVE SKIPPED: No DB Connection. Operating in Local Mode.");
        return -1;
    }

    // Ensure status default
    const prospectsWithStatus = prospects.map(p => ({
        ...p,
        estado: p.estado || 'Nuevo'
    }));

    // Create Upload Record
    const uploadResult = await sql`
        INSERT INTO uploads (user_email, filename, sheet_name, mapped_config)
        VALUES (${email}, ${filename}, ${sheetName}, ${mapping})
        RETURNING id
    `;
    const uploadId = uploadResult[0].id;

    // Batch Insert Prospects
    const batchSize = 50;
    for (let i = 0; i < prospectsWithStatus.length; i += batchSize) {
        const chunk = prospectsWithStatus.slice(i, i + batchSize);
        await Promise.all(chunk.map(p => {
             return sql`
                INSERT INTO prospects (id, upload_id, user_email, data, status)
                VALUES (${p.id}, ${uploadId}, ${email}, ${p}, ${p.estado})
            `;
        }));
    }

    return uploadId;
  },

  async updateProspectStatus(prospectId: string, newStatus: string) {
    if (!sql) return;
    try {
        await sql`
            UPDATE prospects 
            SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ${prospectId}
        `;
    } catch (e) { console.error(e); }
  },

  async getUserUploads(email: string): Promise<UploadRecord[]> {
      if (!sql) return [];
      try {
        const result = await sql`
            SELECT 
                u.id, u.filename, u.sheet_name, u.created_at,
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
          console.error("History Error:", e);
          return [];
      }
  },

  async getSessionProspects(uploadId: number): Promise<{ prospects: Prospect[], mapping: any }> {
      if (uploadId === -1) throw new Error("Local session cannot be resumed.");
      
      if (!sql) throw new Error("No Data Connection");
      
      const uploadRes = await sql`SELECT mapped_config FROM uploads WHERE id = ${uploadId}`;
      if (!uploadRes.length) throw new Error("Upload not found");
      
      const prospectsRes = await sql`SELECT data, status FROM prospects WHERE upload_id = ${uploadId}`;
      const prospects = prospectsRes.map(row => ({
          ...row.data as Prospect,
          estado: row.status
      }));

      return { prospects, mapping: uploadRes[0].mapped_config };
  }
};