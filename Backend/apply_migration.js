import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const applyMigration = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    // Drop and recreate public schema
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;');
    console.log('Reset public schema.');

    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    // Ensure correct order
    const orderedFiles = [
      '20240101000000_initial_schema.sql',
      '002_chat_whatsapp.sql',
      '003_add_profile_colors.sql'
    ];

    for (const file of orderedFiles) {
      console.log(`Applying ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      try {
        await client.query(sql);
        console.log(`Successfully applied ${file}`);
      } catch (e) {
        console.log(`Error applying ${file}: ${e.message}`);
        return; // stop on error
      }
    }
    
    console.log('All migrations processed.');
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await client.end();
  }
};

applyMigration();
