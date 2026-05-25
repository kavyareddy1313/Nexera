import { Client } from 'pg';
import 'dotenv/config';

const checkTables = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Tables:', result.rows.map(r => r.table_name));
  } finally {
    await client.end();
  }
};
checkTables();
