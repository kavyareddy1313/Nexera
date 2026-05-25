import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const AVATAR_COLORS = [
  { bg: '#EEF2FF', text: '#3730A3' },
  { bg: '#F0FDF4', text: '#166534' },
  { bg: '#FDF4FF', text: '#7E22CE' },
  { bg: '#FFF7ED', text: '#9A3412' },
  { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#EAF3DE', text: '#27500A' },
  { bg: '#FAEEDA', text: '#633806' },
  { bg: '#FAECE7', text: '#712B13' },
  { bg: '#EEEDFE', text: '#3C3489' },
  { bg: '#E1F5EE', text: '#085041' },
];

const TEST_USERS = Array.from({ length: 10 }, (_, i) => ({
  email:        `test${i + 1}@gmail.com`,
  password:     '123456789',
  display_name: `Test User ${i + 1}`,
  username:     `test${i + 1}`,
  bio:          `Hi, I am test${i + 1}. Testing Nexera chat.`,
  status:       i % 3 === 0 ? 'away' : 'online',
  initials:     `T${i + 1}`,
  avatar_color_bg:   AVATAR_COLORS[i].bg,
  avatar_color_text: AVATAR_COLORS[i].text,
}));

async function seed() {
  console.log('Connecting to database...');
  await client.connect();

  for (const user of TEST_USERS) {
    console.log(`Seeding ${user.email}...`);
    
    // Check if user exists in Users table
    const checkUser = await client.query('SELECT id FROM "Users" WHERE email = $1', [user.email]);
    let userId;
    
    if (checkUser.rows.length > 0) {
      userId = checkUser.rows[0].id;
      console.log(`  User already exists in Users table (ID: ${userId})`);
    } else {
      userId = uuidv4();
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await client.query(
        `INSERT INTO "Users" (id, full_name, username, email, password, is_online, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
        [userId, user.display_name, user.username, user.email, hashedPassword]
      );
      console.log(`  Created in Users table (ID: ${userId})`);
    }

    // Insert into auth.users to satisfy profiles.id foreign key constraint
    try {
      await client.query(
        `INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
         VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, 'dummy', NOW(), '{}', '{}', NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [userId, user.email]
      );
      console.log(`  Created in auth.users (to satisfy FK)`);
    } catch (err) {
      console.error(`  Error inserting into auth.users:`, err.message);
    }

    // Upsert into public.profiles
    try {
      await client.query(
        `UPDATE public.profiles 
         SET full_name = $1, status = $2, initials = $3, avatar_color_bg = $4, avatar_color_text = $5
         WHERE id = $6`,
        [
          user.display_name, 
          user.status, 
          user.initials, 
          user.avatar_color_bg, 
          user.avatar_color_text,
          userId
        ]
      );
      console.log(`  Updated public.profiles table with avatar colors`);
    } catch (err) {
      console.error(`  Error updating profiles:`, err.message);
    }
  }

  console.log('\\nDone! 10 test users seeded.');
  console.log('You can login with test1@gmail.com - test10@gmail.com and password 123456789');
  await client.end();
}

seed().catch(console.error);
