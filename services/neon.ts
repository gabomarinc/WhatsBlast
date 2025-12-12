import { neon } from '@neondatabase/serverless';
import { Prospect } from '../types';

// NOTE: In a production environment, this URL should be proxied through a backend
// to avoid exposing credentials in the client bundle.
// Safely access env to avoid "Cannot read properties of undefined" if import.meta.env is missing
const env = (import.meta as any).env || {};
const DATABASE_URL = env.VITE_DATABASE_URL;

const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

export const NeonService = {
  
  /**
   * Checks if connection is available
   */
  isConnected: () => !!sql,

  /**
   * Initializes the database schema if it doesn't exist.
   * Tables: users, uploads, prospects
   */
  async initSchema() {
    if (!sql) return;

    try {
      // 1. Users Table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          email TEXT PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 2. Uploads (Workbooks) Metadata
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

      // 3. Prospects Data (Stored as JSONB to handle dynamic Excel columns)
      // We index the upload_id for fast retrieval per session
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

      console.log('✅ Neon DB Schema Initialized');
    } catch (error) {
      console.error('❌ Error initializing DB:', error);
      // We don't throw here to avoid blocking the app start if DB is misconfigured
      // The app will continue in offline mode (sql check handles it in other methods)
    }
  },

  /**
   * Logs a user in (or creates them) and updates last_seen.
   */
  async loginUser(email: string) {
    if (!sql) return;
    const cleanEmail = email.toLowerCase().trim();
    
    try {
      await sql`
        INSERT INTO users (email) 
        VALUES (${cleanEmail})
        ON CONFLICT (email) 
        DO UPDATE SET last_seen = CURRENT_TIMESTAMP
      `;
    } catch (error) {
        console.error("Error logging in user:", error);
    }
    return cleanEmail;
  },

  /**
   * Saves a new workbook upload and its prospects.
   */
  async saveSession(email: string, filename: string, sheetName: string, mapping: any, prospects: Prospect[]) {
    if (!sql) return null;

    try {
      // 1. Create Upload Record
      const uploadResult = await sql`
        INSERT INTO uploads (user_email, filename, sheet_name, mapped_config)
        VALUES (${email}, ${filename}, ${sheetName}, ${mapping})
        RETURNING id
      `;
      
      const uploadId = uploadResult[0].id;

      // 2. Save Prospects in Batch
      const batchSize = 50;
      for (let i = 0; i < prospects.length; i += batchSize) {
        const chunk = prospects.slice(i, i + batchSize);
        
        await Promise.all(chunk.map(p => sql`
            INSERT INTO prospects (id, upload_id, user_email, data, status)
            VALUES (${p.id}, ${uploadId}, ${email}, ${p}, ${p.estado || 'Nuevo'})
        `));
      }

      return uploadId;

    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  },

  /**
   * Updates the status of a single prospect
   */
  async updateProspectStatus(prospectId: string, newStatus: string) {
    if (!sql) return;

    try {
      // Update the top level status AND the JSONB data
      await sql`
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

  /**
   * (Optional) Fetch recent uploads for a user
   */
  async getUserHistory(email: string) {
      if (!sql) return [];
      return await sql`
        SELECT * FROM uploads WHERE user_email = ${email} ORDER BY created_at DESC LIMIT 5
      `;
  }
};