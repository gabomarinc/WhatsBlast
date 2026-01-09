import { neon } from '@neondatabase/serverless';
import { Prospect, User, UploadRecord } from '../types';
import bcrypt from 'bcryptjs';

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
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          recovery_code TEXT,
          recovery_expires TIMESTAMP
        )
      `;

      // 2. Migrations
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT`; } catch (e) {}
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`; } catch (e) {}
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT`; } catch (e) {}
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_url TEXT`; } catch (e) {}
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free'`; } catch (e) {}
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'`; } catch (e) {}
      // Recovery columns
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_code TEXT`; } catch (e) {}
      try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_expires TIMESTAMP`; } catch (e) {}

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

    } catch (error) {
      console.error('❌ Error initializing Main DB:', error);
    }
  },

  /**
   * Registers a new user with hashed password
   */
  async registerUser(email: string, password: string, name: string, companyName: string): Promise<{ success: boolean; user?: User; error?: string }> {
      const cleanEmail = email.toLowerCase().trim();
      
      if (!sql) return { success: false, error: "Sin conexión a DB" };

      try {
          // 1. Check if user exists
          const existing = await sql`SELECT email FROM users WHERE email = ${cleanEmail}`;
          if (existing.length > 0) {
              return { success: false, error: "El correo ya está registrado." };
          }

          // 2. Hash Password
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(password, salt);

          // 3. Insert User
          const result = await sql`
              INSERT INTO users (email, password, name, company_name, plan, role)
              VALUES (${cleanEmail}, ${hash}, ${name}, ${companyName}, 'free', 'user')
              RETURNING email, name, company_name, logo_url, plan, role
          `;

          const user = result[0];

          return { 
              success: true, 
              user: {
                  id: user.email,
                  email: user.email,
                  name: user.name,
                  company_name: user.company_name,
                  logo_url: user.logo_url,
                  plan: user.plan,
                  role: user.role
              }
          };

      } catch (err) {
          console.error("Registration Error:", err);
          return { success: false, error: "Error al crear cuenta." };
      }
  },

  /**
   * Login Logic with Security Upgrade
   * Checks for Bcrypt hash. If plain text matches, upgrades to Bcrypt.
   */
  async loginUser(email: string, password: string): Promise<User | null> {
    const cleanEmail = email.toLowerCase().trim();
    
    if (!sql) {
        console.error("❌ Fatal: Database connection not initialized.");
        return null;
    }

    try {
        console.log(`🔐 Authenticating ${cleanEmail}...`);
        
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
        
        let isValid = false;
        let needsUpgrade = false;

        // 1. Check if it's a bcrypt hash (starts with $2a$ or $2b$)
        const isHash = dbPassword.startsWith('$2a$') || dbPassword.startsWith('$2b$');

        if (isHash) {
            isValid = await bcrypt.compare(inputPassword, dbPassword);
        } else {
            // 2. Legacy Plain Text Check
            if (dbPassword === inputPassword) {
                isValid = true;
                needsUpgrade = true;
            }
        }

        if (!isValid) {
            console.warn("❌ Login Failed: Password mismatch.");
            return null;
        }

        console.log("✅ Login Successful");

        // 3. Upgrade Security if needed (Background task)
        if (needsUpgrade) {
            console.log("🔒 Upgrading password security to Bcrypt...");
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(inputPassword, salt);
            await sql`UPDATE users SET password = ${hash}, last_seen = CURRENT_TIMESTAMP WHERE email = ${cleanEmail}`;
        } else {
            // Just update last seen
            try {
                await sql`UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE email = ${cleanEmail}`;
            } catch(e) {}
        }

        return {
            id: user.id || cleanEmail,
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

  /**
   * Generates a 4-digit code and saves it to DB.
   * In a real app, you would send this via Email API.
   * Here, we return the code to the UI to simulate the email arrival.
   */
  async requestPasswordRecovery(email: string): Promise<{ success: boolean; code?: string; error?: string }> {
      if (!sql) return { success: false, error: "Sin conexión a DB" };
      const cleanEmail = email.toLowerCase().trim();

      try {
        const users = await sql`SELECT email FROM users WHERE LOWER(email) = ${cleanEmail}`;
        if (users.length === 0) return { success: false, error: "Correo no encontrado" };

        // Generate 4 digit code
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Save to DB with 15 min expiration
        await sql`
            UPDATE users 
            SET recovery_code = ${code}, 
                recovery_expires = NOW() + INTERVAL '15 minutes' 
            WHERE email = ${cleanEmail}
        `;

        // We return the code here ONLY because we don't have a real SMTP server.
        // This allows the frontend to show a "Simulated Email" toast.
        return { success: true, code }; 

      } catch (e) {
          console.error(e);
          return { success: false, error: "Error interno" };
      }
  },

  /**
   * Verifies code and sets new hashed password
   */
  async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
      if (!sql) return { success: false, error: "Sin conexión a DB" };
      const cleanEmail = email.toLowerCase().trim();

      try {
          const result = await sql`
            SELECT * FROM users 
            WHERE email = ${cleanEmail} 
            AND recovery_code = ${code}
            AND recovery_expires > NOW()
          `;

          if (result.length === 0) {
              return { success: false, error: "Código inválido o expirado" };
          }

          // Hash new password
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(newPassword, salt);

          // Update password and clear code
          await sql`
            UPDATE users 
            SET password = ${hash}, 
                recovery_code = NULL, 
                recovery_expires = NULL 
            WHERE email = ${cleanEmail}
          `;

          return { success: true };

      } catch (e) {
          console.error(e);
          return { success: false, error: "No se pudo actualizar la contraseña" };
      }
  },

  async saveSession(email: string, filename: string, sheetName: string, mapping: any, prospects: Prospect[]) {
    if (!sql) {
        console.warn("⚠️ SAVE SKIPPED: No DB Connection.");
        return -1;
    }

    // Ensure status default
    const prospectsWithStatus = prospects.map(p => ({
        ...p,
        estado: p.estado || 'Nuevo'
    }));

    const uploadResult = await sql`
        INSERT INTO uploads (user_email, filename, sheet_name, mapped_config)
        VALUES (${email}, ${filename}, ${sheetName}, ${mapping})
        RETURNING id
    `;
    const uploadId = uploadResult[0].id;

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