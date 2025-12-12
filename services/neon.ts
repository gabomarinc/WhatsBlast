import { neon } from '@neondatabase/serverless';
import { Prospect, User, UploadRecord } from '../types';

/**
 * --- SAFE ENVIRONMENT VARIABLE EXTRACTION ---
 * The app was crashing because it tried to read import.meta.env.VITE_... when import.meta.env was undefined.
 * We now use a defensive approach with try-catch blocks to safely retrieve the connection strings.
 */

let RAW_MAIN_URL: string | undefined = undefined;
let RAW_AUTH_URL: string | undefined = undefined;

// 1. Try process.env (Injected by vite.config.ts define)
try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
        // @ts-ignore
        if (process.env.DATABASE_URL) RAW_MAIN_URL = process.env.DATABASE_URL;
        // @ts-ignore
        if (process.env.AUTH_DATABASE_URL) RAW_AUTH_URL = process.env.AUTH_DATABASE_URL;
    }
} catch (e) {}

// 2. Fallback to import.meta.env (Standard Vite) if not found yet
if (!RAW_MAIN_URL || !RAW_AUTH_URL) {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            if (!RAW_MAIN_URL && import.meta.env.VITE_DATABASE_URL) RAW_MAIN_URL = import.meta.env.VITE_DATABASE_URL;
            // @ts-ignore
            if (!RAW_AUTH_URL && import.meta.env.VITE_AUTH_DATABASE_URL) RAW_AUTH_URL = import.meta.env.VITE_AUTH_DATABASE_URL;
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
const AUTH_DB_URL = formatConnectionUrl(RAW_AUTH_URL);

// Debug Logs
console.group("🔌 Database Connection Debug");
console.log("Main DB Status:", MAIN_DB_URL ? "✅ Ready" : "❌ Missing URL");
console.log("Auth DB Status:", AUTH_DB_URL ? "✅ Ready" : "❌ Missing URL");
console.groupEnd();

// Initialize Clients
const sqlMain = MAIN_DB_URL ? neon(MAIN_DB_URL) : null;
const sqlAuth = AUTH_DB_URL ? neon(AUTH_DB_URL) : null;

export const NeonService = {
  
  isConnected: () => !!sqlMain,
  isAuthConnected: () => !!sqlAuth,

  /**
   * Initializes schema in MAIN DB.
   */
  async initSchema() {
    if (!sqlMain) return;

    try {
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
      console.log('✅ Main DB Schema Synced');
    } catch (error) {
      console.error('❌ Error initializing Main DB:', error);
    }
  },

  /**
   * Login Logic: Queries 'companies' table in Auth DB.
   */
  async loginUser(email: string, password: string): Promise<User | null> {
    const cleanEmail = email.toLowerCase().trim();
    
    if (!sqlAuth) {
        console.error("❌ Fatal: Auth Database connection not initialized.");
        return null;
    }

    try {
        console.log(`🔐 Authenticating ${cleanEmail} against 'companies' table...`);
        
        // CORRECTED: Query 'companies' table
        const companies = await sqlAuth`
            SELECT * 
            FROM companies 
            WHERE email = ${cleanEmail} 
            AND password = ${password}
            LIMIT 1
        `;

        if (companies.length === 0) {
            console.warn("❌ Login Failed: Invalid credentials or company not found.");
            return null;
        }

        const company = companies[0];
        
        // Map fields to User type
        const userProfile: User = {
            id: company.id,
            email: company.email,
            name: company.contact_name || company.name || company.company_name || cleanEmail.split('@')[0],
            company_name: company.company_name || company.name || "Mi Empresa",
            logo_url: company.logo_url,
            plan: company.plan,
            role: company.role
        };

        // Sync to Main DB for reference
        if (sqlMain) {
            try {
                await sqlMain`
                    INSERT INTO users (email) 
                    VALUES (${cleanEmail})
                    ON CONFLICT (email) 
                    DO UPDATE SET last_seen = CURRENT_TIMESTAMP
                `;
            } catch (syncErr) {
                console.warn("⚠️ Main DB Sync Warning:", syncErr);
            }
        }

        return userProfile;

    } catch (err) {
        console.error("⚠️ Auth DB Error:", err);
        return null;
    }
  },

  async saveSession(email: string, filename: string, sheetName: string, mapping: any, prospects: Prospect[]) {
    if (!sqlMain) throw new Error("No Data Connection");

    // Ensure status default
    const prospectsWithStatus = prospects.map(p => ({
        ...p,
        estado: p.estado || 'Nuevo'
    }));

    // Create Upload Record
    const uploadResult = await sqlMain`
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
             return sqlMain`
                INSERT INTO prospects (id, upload_id, user_email, data, status)
                VALUES (${p.id}, ${uploadId}, ${email}, ${p}, ${p.estado})
            `;
        }));
    }

    return uploadId;
  },

  async updateProspectStatus(prospectId: string, newStatus: string) {
    if (!sqlMain) return;
    try {
        await sqlMain`
            UPDATE prospects 
            SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ${prospectId}
        `;
    } catch (e) { console.error(e); }
  },

  async getUserUploads(email: string): Promise<UploadRecord[]> {
      if (!sqlMain) return [];
      try {
        const result = await sqlMain`
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
      if (!sqlMain) throw new Error("No Data Connection");
      
      const uploadRes = await sqlMain`SELECT mapped_config FROM uploads WHERE id = ${uploadId}`;
      if (!uploadRes.length) throw new Error("Upload not found");
      
      const prospectsRes = await sqlMain`SELECT data, status FROM prospects WHERE upload_id = ${uploadId}`;
      const prospects = prospectsRes.map(row => ({
          ...row.data as Prospect,
          estado: row.status
      }));

      return { prospects, mapping: uploadRes[0].mapped_config };
  }
};