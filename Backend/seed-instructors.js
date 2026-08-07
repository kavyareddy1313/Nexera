import { Client } from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

/**
 * Seeds instructor accounts & published courses with community groups.
 * 
 * This script:
 * 1. Creates 3 instructor accounts (in Users table + auth.users + profiles)
 * 2. Creates 6 published courses across different categories
 * 3. Creates a WhatsApp-style community group for each course
 * 4. Adds the instructor as the group admin
 * 5. Seeds a welcome system message in each group
 * 
 * Run: node seed-instructors.js
 */

const AVATAR_COLORS = [
  { bg: '#6366f1', text: '#ffffff' },
  { bg: '#ec4899', text: '#ffffff' },
  { bg: '#10b981', text: '#ffffff' },
];

const PASSWORD = 'Nexera@123';

const seedInstructors = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🌱 Seeding Instructor Accounts & Published Courses...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    const hashedPassword = await bcrypt.hash(PASSWORD, 12);

    // ─── Instructor accounts ──────────────────────────────
    const instructors = [
      {
        id: crypto.randomUUID(),
        fullName: 'Dr. Ananya Sharma',
        username: 'ananya.sharma',
        email: 'ananya@nexera.dev',
        color: AVATAR_COLORS[0],
        initials: 'AS',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80'
      },
      {
        id: crypto.randomUUID(),
        fullName: 'Prof. James Mitchell',
        username: 'james.mitchell',
        email: 'james@nexera.dev',
        color: AVATAR_COLORS[1],
        initials: 'JM',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80'
      },
      {
        id: crypto.randomUUID(),
        fullName: 'Kavya Reddy',
        username: 'kavya.reddy',
        email: 'kavya@nexera.dev',
        color: AVATAR_COLORS[2],
        initials: 'KR',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&q=80'
      },
    ];

    // Create each instructor
    for (const inst of instructors) {
      // 1. Check if user already exists by email
      const existingUser = await client.query(
        `SELECT id FROM "Users" WHERE email = $1`, [inst.email]
      );
      
      if (existingUser.rows.length > 0) {
        // Update existing user to instructor role
        inst.id = existingUser.rows[0].id;
        await client.query(
          `UPDATE "Users" SET role = 'instructor', full_name = $1, username = $2, avatar_url = $3 WHERE id = $4`,
          [inst.fullName, inst.username, inst.avatar, inst.id]
        );
        console.log(`  ♻️  Updated existing user → ${inst.email} (role → instructor)`);
      } else {
        // Create new user in Users table
        await client.query(
          `INSERT INTO "Users" (id, full_name, username, email, password, role, avatar_url, is_online, email_verified, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'instructor', $6, false, true, NOW(), NOW())
           ON CONFLICT (id) DO NOTHING`,
          [inst.id, inst.fullName, inst.username, inst.email, hashedPassword, inst.avatar]
        );
        console.log(`  ✅ Created instructor → ${inst.email}`);
      }

      // 2. Sync to auth.users (for Supabase chat compatibility)
      await client.query(
        `INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
         VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, $3, NOW(), '{}', $4, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
        [inst.id, inst.email, hashedPassword, JSON.stringify({ full_name: inst.fullName })]
      );

      // 3. Sync to public.profiles
      await client.query(
        `INSERT INTO public.profiles (id, full_name, avatar_url, status, initials, avatar_color_bg, avatar_color_text, created_at, updated_at)
         VALUES ($1, $2, $3, 'online', $4, $5, $6, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE 
         SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url, 
             initials = EXCLUDED.initials, avatar_color_bg = EXCLUDED.avatar_color_bg, 
             avatar_color_text = EXCLUDED.avatar_color_text, updated_at = NOW()`,
        [inst.id, inst.fullName, inst.avatar, inst.initials, inst.color.bg, inst.color.text]
      );
    }

    console.log('');

    // ─── Courses ──────────────────────────────────────────
    const courses = [
      {
        title: 'Fullstack React & Node Masterclass',
        description: 'Build production-grade SaaS applications from scratch using React, Node.js, PostgreSQL, and WebSockets. Master authentication, real-time features, deployment, and performance optimization.',
        price: 4999,
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
        rating: 4.8,
        students: 1250,
        category: 'Development',
        duration: '40 Hours',
        instructorIdx: 0,
      },
      {
        title: 'UI/UX Design for Developers',
        description: 'Master Tailwind CSS, Figma, and modern design systems to create stunning user interfaces. Learn color theory, typography, layout principles, and responsive design patterns.',
        price: 2999,
        thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
        rating: 4.9,
        students: 890,
        category: 'Design',
        duration: '15 Hours',
        instructorIdx: 0,
      },
      {
        title: 'Advanced System Architecture',
        description: 'Scale your applications to handle millions of users. Learn microservices, event-driven architecture, caching strategies, load balancing, and distributed systems design.',
        price: 7999,
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
        rating: 4.7,
        students: 430,
        category: 'Architecture',
        duration: '25 Hours',
        instructorIdx: 1,
      },
      {
        title: 'Machine Learning with Python',
        description: 'From linear regression to deep neural networks. Master scikit-learn, TensorFlow, and PyTorch with hands-on projects in computer vision, NLP, and recommendation systems.',
        price: 5999,
        thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80',
        rating: 4.6,
        students: 2100,
        category: 'Data Science',
        duration: '35 Hours',
        instructorIdx: 1,
      },
      {
        title: 'DevOps & Cloud Engineering',
        description: 'Master Docker, Kubernetes, CI/CD pipelines, AWS, and infrastructure-as-code. Deploy applications with zero downtime and monitor production systems at scale.',
        price: 6499,
        thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&q=80',
        rating: 4.8,
        students: 780,
        category: 'Development',
        duration: '30 Hours',
        instructorIdx: 2,
      },
      {
        title: 'Mobile App Development with Flutter',
        description: 'Build beautiful, natively compiled applications for iOS and Android from a single codebase. Master Dart, state management, Firebase integration, and app store deployment.',
        price: 3999,
        thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
        rating: 4.9,
        students: 1560,
        category: 'Development',
        duration: '28 Hours',
        instructorIdx: 2,
      },
    ];

    // Clear existing seeded courses (but not manually created ones)
    for (const c of courses) {
      await client.query(`DELETE FROM "Courses" WHERE title = $1`, [c.title]);
    }

    console.log('  📚 Creating courses & community groups...');
    console.log('');

    for (const c of courses) {
      const instructor = instructors[c.instructorIdx];
      const courseId = crypto.randomUUID();
      const conversationId = crypto.randomUUID();

      // 1. Create the community group conversation
      await client.query(
        `INSERT INTO public.conversations (id, type, name, description, created_by, last_activity_at)
         VALUES ($1, 'group', $2, $3, $4, NOW())`,
        [conversationId, `${c.title} Community`, `Official community group for "${c.title}". Chat, share files, and join live sessions.`, instructor.id]
      );

      // 2. Add instructor as admin of the group
      await client.query(
        `INSERT INTO public.conversation_members (conversation_id, user_id, role)
         VALUES ($1, $2, 'admin')`,
        [conversationId, instructor.id]
      );

      // 3. Create the course with conversation_id linked
      await client.query(
        `INSERT INTO "Courses" (id, title, description, price, thumbnail_url, rating, students_enrolled, category, duration, instructor_id, conversation_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
        [courseId, c.title, c.description, c.price, c.thumbnail, c.rating, c.students, c.category, c.duration, instructor.id, conversationId]
      );

      // 4. Send a system welcome message
      const welcomeMsgId = crypto.randomUUID();
      await client.query(
        `INSERT INTO public.messages (id, conversation_id, content, type, created_at)
         VALUES ($1, $2, $3, 'system', NOW())`,
        [welcomeMsgId, conversationId, `📚 Welcome to "${c.title}" Community! This group was created by ${instructor.fullName}. Students who enroll will be added here automatically.`]
      );

      // 5. Update last_message on conversation
      await client.query(
        `UPDATE public.conversations SET last_message_id = $1, last_activity_at = NOW() WHERE id = $2`,
        [welcomeMsgId, conversationId]
      );

      console.log(`  ✅ ${c.title}`);
      console.log(`     → Instructor: ${instructor.fullName} | Price: ₹${c.price} | Group: ${c.title} Community`);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🚀 INSTRUCTORS & COURSES SEEDED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('  📧 Instructor Login Credentials (password: Nexera@123):');
    console.log('  ─────────────────────────────────────────────────────');
    for (const inst of instructors) {
      console.log(`  ${inst.email.padEnd(24)} → ${inst.fullName} (instructor)`);
    }
    console.log('');
    console.log('  📚 Published Courses:');
    console.log('  ─────────────────────────────────────────────────────');
    for (const c of courses) {
      console.log(`  ₹${String(c.price).padEnd(6)} ${c.title} → by ${instructors[c.instructorIdx].fullName}`);
    }
    console.log('');
    console.log('  💬 Each course has an auto-created community group in /chat');
    console.log('  🎓 Students who enroll via payment will join the group automatically');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    try { await client.end(); } catch (_) {}
  }
};

seedInstructors();
