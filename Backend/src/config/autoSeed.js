import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from './env.js';
import { logger } from '../middleware/requestLogger.js';

export const autoSeedInstructorsAndCourses = async () => {
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check if courses already exist
    const checkCourses = await client.query(`SELECT COUNT(*) as count FROM "Courses"`);
    const courseCount = parseInt(checkCourses.rows[0]?.count || '0', 10);

    const checkInstructors = await client.query(`SELECT COUNT(*) as count FROM "Users" WHERE role = 'instructor'`);
    const instructorCount = parseInt(checkInstructors.rows[0]?.count || '0', 10);

    // If we already have instructors and courses, let's just make sure passwords and profiles are synced
    const hashedPassword = await bcrypt.hash('Nexera@123', 12);

    const AVATAR_COLORS = [
      { bg: '#6366f1', text: '#ffffff' },
      { bg: '#ec4899', text: '#ffffff' },
      { bg: '#10b981', text: '#ffffff' },
    ];

    const instructors = [
      {
        fullName: 'Dr. Ananya Sharma',
        username: 'ananya.sharma',
        email: 'ananya@nexera.dev',
        color: AVATAR_COLORS[0],
        initials: 'AS',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80'
      },
      {
        fullName: 'Prof. James Mitchell',
        username: 'james.mitchell',
        email: 'james@nexera.dev',
        color: AVATAR_COLORS[1],
        initials: 'JM',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80'
      },
      {
        fullName: 'Kavya Reddy',
        username: 'kavya.reddy',
        email: 'kavya@nexera.dev',
        color: AVATAR_COLORS[2],
        initials: 'KR',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&q=80'
      },
    ];

    const instructorMap = new Map();

    for (const inst of instructors) {
      const existing = await client.query(`SELECT id FROM "Users" WHERE email = $1`, [inst.email]);
      let userId;

      if (existing.rows.length > 0) {
        userId = existing.rows[0].id;
        await client.query(
          `UPDATE "Users" 
           SET role = 'instructor', full_name = $1, username = $2, avatar_url = $3, password = $4 
           WHERE id = $5`,
          [inst.fullName, inst.username, inst.avatar, hashedPassword, userId]
        );
      } else {
        const uuidRes = await client.query(`SELECT gen_random_uuid() as id`);
        userId = uuidRes.rows[0].id;
        await client.query(
          `INSERT INTO "Users" (id, full_name, username, email, password, role, avatar_url, is_online, email_verified, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'instructor', $6, false, true, NOW(), NOW())
           ON CONFLICT (id) DO NOTHING`,
          [userId, inst.fullName, inst.username, inst.email, hashedPassword, inst.avatar]
        );
      }

      // Sync auth.users
      await client.query(
        `INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
         VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, $3, NOW(), '{}', $4, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password`,
        [userId, inst.email, hashedPassword, JSON.stringify({ full_name: inst.fullName })]
      );

      // Sync public.profiles
      await client.query(
        `INSERT INTO public.profiles (id, full_name, avatar_url, status, initials, avatar_color_bg, avatar_color_text, created_at, updated_at)
         VALUES ($1, $2, $3, 'online', $4, $5, $6, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE 
         SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url, 
             initials = EXCLUDED.initials, avatar_color_bg = EXCLUDED.avatar_color_bg, 
             avatar_color_text = EXCLUDED.avatar_color_text, updated_at = NOW()`,
        [userId, inst.fullName, inst.avatar, inst.initials, inst.color.bg, inst.color.text]
      );

      instructorMap.set(inst.email, { ...inst, id: userId });
    }

    // Courses to ensure are seeded
    const coursesToSeed = [
      {
        title: 'Fullstack React & Node Masterclass',
        description: 'Build production-grade SaaS applications from scratch using React, Node.js, PostgreSQL, and WebSockets. Master authentication, real-time features, deployment, and performance optimization.',
        price: 4999,
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
        rating: 4.8,
        students: 1250,
        category: 'Development',
        duration: '40 Hours',
        instructorEmail: 'ananya@nexera.dev',
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
        instructorEmail: 'ananya@nexera.dev',
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
        instructorEmail: 'james@nexera.dev',
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
        instructorEmail: 'james@nexera.dev',
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
        instructorEmail: 'kavya@nexera.dev',
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
        instructorEmail: 'kavya@nexera.dev',
      },
    ];

    for (const c of coursesToSeed) {
      const instructor = instructorMap.get(c.instructorEmail);
      if (!instructor) continue;

      const existingCourse = await client.query(`SELECT id, conversation_id FROM "Courses" WHERE title = $1`, [c.title]);
      
      let conversationId;
      if (existingCourse.rows.length > 0) {
        conversationId = existingCourse.rows[0].conversation_id;
        
        // If conversation_id is missing, create the community group
        if (!conversationId) {
          const convoUUID = (await client.query(`SELECT gen_random_uuid() as id`)).rows[0].id;
          await client.query(
            `INSERT INTO public.conversations (id, type, name, description, created_by, last_activity_at)
             VALUES ($1, 'group', $2, $3, $4, NOW())`,
            [convoUUID, `${c.title} Community`, `Official community group for "${c.title}". Chat, share files, and join live sessions.`, instructor.id]
          );
          await client.query(
            `INSERT INTO public.conversation_members (conversation_id, user_id, role)
             VALUES ($1, $2, 'admin')
             ON CONFLICT DO NOTHING`,
            [convoUUID, instructor.id]
          );
          await client.query(
            `UPDATE "Courses" SET conversation_id = $1 WHERE id = $2`,
            [convoUUID, existingCourse.rows[0].id]
          );
          conversationId = convoUUID;
        }

        // Ensure instructor is admin of the group
        await client.query(
          `INSERT INTO public.conversation_members (conversation_id, user_id, role)
           VALUES ($1, $2, 'admin')
           ON CONFLICT DO NOTHING`,
          [conversationId, instructor.id]
        );

        // Update course details
        await client.query(
          `UPDATE "Courses" 
           SET description = $1, price = $2, thumbnail_url = $3, rating = $4, students_enrolled = $5, category = $6, duration = $7, instructor_id = $8, updated_at = NOW()
           WHERE id = $9`,
          [c.description, c.price, c.thumbnail, c.rating, c.students, c.category, c.duration, instructor.id, existingCourse.rows[0].id]
        );
      } else {
        // Create new course & group
        const courseUUID = (await client.query(`SELECT gen_random_uuid() as id`)).rows[0].id;
        const convoUUID = (await client.query(`SELECT gen_random_uuid() as id`)).rows[0].id;

        await client.query(
          `INSERT INTO public.conversations (id, type, name, description, created_by, last_activity_at)
           VALUES ($1, 'group', $2, $3, $4, NOW())`,
          [convoUUID, `${c.title} Community`, `Official community group for "${c.title}". Chat, share files, and join live sessions.`, instructor.id]
        );

        await client.query(
          `INSERT INTO public.conversation_members (conversation_id, user_id, role)
           VALUES ($1, $2, 'admin')
           ON CONFLICT DO NOTHING`,
          [convoUUID, instructor.id]
        );

        await client.query(
          `INSERT INTO "Courses" (id, title, description, price, thumbnail_url, rating, students_enrolled, category, duration, instructor_id, conversation_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          [courseUUID, c.title, c.description, c.price, c.thumbnail, c.rating, c.students, c.category, c.duration, instructor.id, convoUUID]
        );

        const msgUUID = (await client.query(`SELECT gen_random_uuid() as id`)).rows[0].id;
        await client.query(
          `INSERT INTO public.messages (id, conversation_id, content, type, created_at)
           VALUES ($1, $2, $3, 'system', NOW())`,
          [msgUUID, convoUUID, `📚 Welcome to "${c.title}" Community! Created by ${instructor.fullName}. Enrolled students will be added here automatically.`]
        );

        await client.query(
          `UPDATE public.conversations SET last_message_id = $1, last_activity_at = NOW() WHERE id = $2`,
          [msgUUID, convoUUID]
        );
      }
    }

    logger.info('✅ Auto-seed: 3 Instructors and 6 Published Courses ready with WhatsApp Community Groups');
  } catch (error) {
    logger.error(`❌ Auto-seed warning: ${error.message}`);
  } finally {
    try { await client.end(); } catch (_) {}
  }
};
