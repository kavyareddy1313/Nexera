import { Client } from 'pg';
import crypto from 'crypto';
import 'dotenv/config';

const seedData = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🌱 Seeding Nexera database...');

    // Users data
    const userData = [
      { id: crypto.randomUUID(), fullName: 'Ethan Winters', email: 'ethan@nexera.dev', colorBg: '#6366f1', colorText: '#ffffff', initials: 'EW' },
      { id: crypto.randomUUID(), fullName: 'Sarah Connor', email: 'sarah@nexera.dev', colorBg: '#ec4899', colorText: '#ffffff', initials: 'SC' },
      { id: crypto.randomUUID(), fullName: 'Marcus Reeves', email: 'marcus@nexera.dev', colorBg: '#10b981', colorText: '#ffffff', initials: 'MR' },
      { id: crypto.randomUUID(), fullName: 'Priya Kapoor', email: 'priya@nexera.dev', colorBg: '#f59e0b', colorText: '#ffffff', initials: 'PK' },
      { id: crypto.randomUUID(), fullName: 'Liam Chen', email: 'liam@nexera.dev', colorBg: '#3b82f6', colorText: '#ffffff', initials: 'LC' },
      { id: crypto.randomUUID(), fullName: 'Nora Silva', email: 'nora@nexera.dev', colorBg: '#8b5cf6', colorText: '#ffffff', initials: 'NS' },
      { id: crypto.randomUUID(), fullName: 'Arjun Patel', email: 'arjun@nexera.dev', colorBg: '#ef4444', colorText: '#ffffff', initials: 'AP' },
      { id: crypto.randomUUID(), fullName: 'Zara Ali', email: 'zara@nexera.dev', colorBg: '#14b8a6', colorText: '#ffffff', initials: 'ZA' },
    ];

    console.log('Clearing existing data...');
    await client.query('DELETE FROM auth.users'); // Cascades to everything!
    await client.query('DELETE FROM public.workspaces');

    console.log('Creating auth users...');
    for (const u of userData) {
      const rawMetaData = JSON.stringify({ full_name: u.fullName });
      await client.query(`
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
        VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, crypt('Nexera@123', gen_salt('bf')), now(), $3, now(), now())
      `, [u.id, u.email, rawMetaData]);

      // The trigger creates the profile. Update it with colors and initials.
      await client.query(`
        UPDATE public.profiles 
        SET avatar_color_bg = $1, avatar_color_text = $2, initials = $3, status = 'online'
        WHERE id = $4
      `, [u.colorBg, u.colorText, u.initials, u.id]);
    }

    console.log('✅ 8 users ready');

    // Create Workspace
    const workspaceId = crypto.randomUUID();
    await client.query(`
      INSERT INTO public.workspaces (id, name, slug, owner_id) 
      VALUES ($1, 'Nexera HQ', 'nexera-hq', $2)
    `, [workspaceId, userData[0].id]);

    // Create 5 Channels
    const channels = [
      { id: crypto.randomUUID(), name: 'general', desc: 'General discussion' },
      { id: crypto.randomUUID(), name: 'engineering', desc: 'Engineering team' },
      { id: crypto.randomUUID(), name: 'design', desc: 'Design and UI/UX' },
      { id: crypto.randomUUID(), name: 'marketing', desc: 'Marketing strategies' },
      { id: crypto.randomUUID(), name: 'random', desc: 'Watercooler chat' },
    ];

    for (const ch of channels) {
      await client.query(`
        INSERT INTO public.conversations (id, type, name, description, created_by)
        VALUES ($1, 'group', $2, $3, $4)
      `, [ch.id, ch.name, ch.desc, userData[0].id]);

      // Add all users to all channels
      for (const u of userData) {
        await client.query(`
          INSERT INTO public.conversation_members (conversation_id, user_id, role)
          VALUES ($1, $2, 'member')
        `, [ch.id, u.id]);
      }
    }
    console.log('✅ 5 channels created');

    // DM between Priya and Arjun
    const dmId = crypto.randomUUID();
    await client.query(`
      INSERT INTO public.conversations (id, type, created_by)
      VALUES ($1, 'dm', $2)
    `, [dmId, userData[3].id]); // Priya

    await client.query(`
      INSERT INTO public.conversation_members (conversation_id, user_id, role)
      VALUES ($1, $2, 'member'), ($1, $3, 'member')
    `, [dmId, userData[3].id, userData[6].id]); // Priya and Arjun

    // Seed Messages in DM
    const msgId1 = crypto.randomUUID();
    await client.query(`
      INSERT INTO public.messages (id, conversation_id, sender_id, type, content)
      VALUES ($1, $2, $3, 'text', 'Hey Arjun, did you finish the new design for the sidebar?')
    `, [msgId1, dmId, userData[3].id]);

    const msgId2 = crypto.randomUUID();
    await client.query(`
      INSERT INTO public.messages (id, conversation_id, sender_id, type, content)
      VALUES ($1, $2, $3, 'text', 'Yes! I just pushed it. Let me know what you think.')
    `, [msgId2, dmId, userData[6].id]);

    // Update last_message_id on DM
    await client.query(`
      UPDATE public.conversations SET last_message_id = $1 WHERE id = $2
    `, [msgId2, dmId]);

    // Seed Message in General
    const msgGen = crypto.randomUUID();
    await client.query(`
      INSERT INTO public.messages (id, conversation_id, sender_id, type, content)
      VALUES ($1, $2, $3, 'text', 'Welcome to Nexera everyone! 🚀')
    `, [msgGen, channels[0].id, userData[0].id]);
    await client.query(`
      UPDATE public.conversations SET last_message_id = $1 WHERE id = $2
    `, [msgGen, channels[0].id]);

    console.log('✅ Messages seeded');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🚀 NEXERA DATABASE SEEDED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Login credentials (password: Nexera@123):');
    for (const u of userData) {
      console.log(`  ${u.email.padEnd(20)} → ${u.fullName}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

seedData();
