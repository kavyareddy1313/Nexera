import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { Course, User, CourseEnrollment, Conversation, ConversationMember } from '../../models/index.js';
import { authMiddleware as requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { razorpay } from '../../config/razorpay.js';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { Client } from 'pg';
import { deleteCache } from '../../config/redis.js';

const router = Router();

// ─────────────────────────────────────────────────────────
// HELPER: Find or create the course community group
// ─────────────────────────────────────────────────────────
async function findOrCreateCourseGroup(course) {
  // If course already has a linked conversation_id, use it
  if (course.conversationId) {
    const existing = await Conversation.findByPk(course.conversationId);
    if (existing) return existing;
  }

  // Fallback: look up by name
  let conversation = await Conversation.findOne({
    where: {
      type: 'group',
      name: `${course.title} Community`
    }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      type: 'group',
      name: `${course.title} Community`,
      description: `Official community group for "${course.title}". Chat, share files, and join live sessions.`,
      is_channel: false,
      created_by: course.instructor_id
    });

    // Add instructor as admin
    if (course.instructor_id) {
      await ConversationMember.findOrCreate({
        where: {
          conversation_id: conversation.id,
          user_id: course.instructor_id
        },
        defaults: { role: 'admin' }
      });
    }
  }

  // Link the conversation back to the course
  if (!course.conversationId || course.conversationId !== conversation.id) {
    await course.update({ conversationId: conversation.id });
  }

  return conversation;
}

// ─────────────────────────────────────────────────────────
// HELPER: Send a system welcome message into the group
// ─────────────────────────────────────────────────────────
async function sendSystemMessage(conversationId, content) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    await client.query(
      `INSERT INTO public.messages (conversation_id, content, type, created_at)
       VALUES ($1, $2, 'system', NOW())`,
      [conversationId, content]
    );
    // Update last_activity_at on the conversation
    await client.query(
      `UPDATE public.conversations SET last_activity_at = NOW() WHERE id = $1`,
      [conversationId]
    );
  } catch (err) {
    console.error('Failed to send system message:', err.message);
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

// ═══════════════════════════════════════════════════════════
// GET /api/courses/my-enrollments
// ═══════════════════════════════════════════════════════════
router.get('/my-enrollments', requireAuth, asyncHandler(async (req, res) => {
  const enrollments = await CourseEnrollment.findAll({
    where: {
      user_id: req.user.id,
      payment_status: 'completed'
    },
    include: [{
      model: Course,
      as: 'course',
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'fullName', 'avatarUrl']
      }]
    }],
    order: [['createdAt', 'DESC']]
  });
  
  res.json(ApiResponse.ok(enrollments.map(e => e.course)));
}));

// ═══════════════════════════════════════════════════════════
// GET /api/courses
// ═══════════════════════════════════════════════════════════
router.get('/', asyncHandler(async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'fullName', 'avatarUrl', 'username']
      }],
      order: [['createdAt', 'DESC']]
    });
    return res.json(ApiResponse.ok(courses));
  } catch (err) {
    console.error('Error fetching courses with instructor include:', err);
    const fallbackCourses = await Course.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.json(ApiResponse.ok(fallbackCourses));
  }
}));

// ═══════════════════════════════════════════════════════════
// GET /api/courses/instructor/my-courses
// Returns all courses created/published by the authenticated instructor
// ═══════════════════════════════════════════════════════════
router.get('/instructor/my-courses', requireAuth, asyncHandler(async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { instructorId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    return res.json(ApiResponse.ok(courses));
  } catch (err) {
    console.error('Error fetching instructor courses:', err);
    // Try with underscore field if necessary
    const courses = await Course.findAll({
      where: { instructor_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    return res.json(ApiResponse.ok(courses));
  }
}));

// ═══════════════════════════════════════════════════════════
// GET /api/courses/:id
// Returns course details + isEnrolled flag for current user
// ═══════════════════════════════════════════════════════════
router.get('/:id', asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id, {
    include: [{
      model: User,
      as: 'instructor',
      attributes: ['id', 'fullName', 'avatarUrl', 'username']
    }]
  });

  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  // Check enrollment status if auth header present
  let isEnrolled = false;
  let enrollmentConversationId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = await import('jsonwebtoken');
      const token = authHeader.split(' ')[1];
      const decoded = jwt.default.verify(token, env.JWT_SECRET);
      const enrollment = await CourseEnrollment.findOne({
        where: {
          user_id: decoded.id,
          course_id: course.id,
          payment_status: 'completed'
        }
      });
      if (enrollment) {
        isEnrolled = true;
        enrollmentConversationId = course.conversationId || null;
      }
    } catch (_) {
      // Token invalid or expired, just return isEnrolled=false
    }
  }

  const courseData = course.toJSON();
  courseData.isEnrolled = isEnrolled;
  courseData.enrollmentConversationId = enrollmentConversationId;

  res.json(ApiResponse.ok(courseData));
}));

// ═══════════════════════════════════════════════════════════
// POST /api/courses/:id/create-order
// Creates a Razorpay order for the student to pay
// ═══════════════════════════════════════════════════════════
router.post('/:id/create-order', requireAuth, asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  // Check if already enrolled
  const existingEnrollment = await CourseEnrollment.findOne({
    where: {
      user_id: req.user.id,
      course_id: course.id,
      payment_status: 'completed'
    }
  });

  if (existingEnrollment) {
    throw ApiError.badRequest('You are already enrolled in this course.');
  }

  const amount = Math.round(Number(course.price) * 100); // Convert to smallest unit (paise/cents)
  const currency = "INR";

  try {
    // Attempt real Razorpay order creation
    const options = {
      amount,
      currency,
      receipt: `receipt_${course.id}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order || !order.id) {
      throw new Error('No order returned');
    }

    res.json(ApiResponse.ok({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID
    }));
  } catch (err) {
    // If Razorpay fails (e.g. test keys), create a mock order for development
    console.warn('Razorpay order creation failed, using mock order:', err.message);

    const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    res.json(ApiResponse.ok({
      orderId: mockOrderId,
      amount: amount,
      currency: currency,
      keyId: env.RAZORPAY_KEY_ID || 'rzp_test_SJb1Khp4Xsxh2j',
      isMock: true
    }));
  }
}));

// ═══════════════════════════════════════════════════════════
// POST /api/courses/verify-payment
// Verifies Razorpay payment, creates enrollment,
// adds student to course community group, sends welcome msg
// ═══════════════════════════════════════════════════════════
router.post('/verify-payment', requireAuth, asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, course_id } = req.body;

  if (!course_id) {
    throw ApiError.badRequest('Missing course_id');
  }

  const course = await Course.findByPk(course_id, {
    include: [{ model: User, as: 'instructor', attributes: ['id', 'fullName'] }]
  });

  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  // Check if already enrolled
  const existingEnrollment = await CourseEnrollment.findOne({
    where: { user_id: req.user.id, course_id: course.id, payment_status: 'completed' }
  });
  if (existingEnrollment) {
    throw ApiError.badRequest('You are already enrolled in this course.');
  }

  // Verify payment signature (skip for mock orders)
  const isMock = razorpay_order_id?.startsWith('order_mock_');
  
  if (!isMock) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw ApiError.badRequest('Missing Razorpay payment details');
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      throw ApiError.badRequest('Invalid payment signature');
    }
  }

  // ── 1. Create enrollment record ──
  const enrollment = await CourseEnrollment.create({
    user_id: req.user.id,
    course_id: course.id,
    payment_id: isMock ? `mock_pay_${Date.now()}` : razorpay_payment_id,
    payment_status: 'completed'
  });

  // ── 2. Find or create community group ──
  const conversation = await findOrCreateCourseGroup(course);

  // ── 3. Add student to the group ──
  await ConversationMember.findOrCreate({
    where: {
      conversation_id: conversation.id,
      user_id: req.user.id
    },
    defaults: { role: 'member' }
  });

  // ── 4. Send welcome system message ──
  const studentUser = await User.findByPk(req.user.id);
  const studentName = studentUser?.fullName || studentUser?.username || 'A new student';
  await sendSystemMessage(
    conversation.id,
    `🎉 ${studentName} has joined the ${course.title} Community! Welcome aboard!`
  );

  // ── 5. Increment enrolled student count ──
  await course.increment('students_enrolled', { by: 1 });

  // ── 6. Invalidate Redis conversation caches ──
  try {
    await deleteCache(`conversations:${req.user.id}`);
    if (course.instructor_id) {
      await deleteCache(`conversations:${course.instructor_id}`);
    }
  } catch (_) {}

  res.json(ApiResponse.ok({
    message: 'Payment verified and enrolled successfully!',
    conversationId: conversation.id,
    enrollment: {
      id: enrollment.id,
      courseId: course.id,
      courseTitle: course.title
    }
  }));
}));

// ═══════════════════════════════════════════════════════════
// POST /api/courses/seed-instructors — Create instructor accounts,
// published courses, and community groups for development
// ═══════════════════════════════════════════════════════════
router.post('/seed-instructors', asyncHandler(async (req, res) => {
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pgClient.connect();
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash('Nexera@123', 12);

    const COLORS = [
      { bg: '#6366f1', text: '#ffffff' },
      { bg: '#ec4899', text: '#ffffff' },
      { bg: '#10b981', text: '#ffffff' },
    ];

    // ── 1. Instructor Accounts ──
    const instructors = [
      {
        fullName: 'Dr. Ananya Sharma', username: 'ananya.sharma', email: 'ananya@nexera.dev',
        color: COLORS[0], initials: 'AS',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80'
      },
      {
        fullName: 'Prof. James Mitchell', username: 'james.mitchell', email: 'james@nexera.dev',
        color: COLORS[1], initials: 'JM',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80'
      },
      {
        fullName: 'Kavya Reddy', username: 'kavya.reddy', email: 'kavya@nexera.dev',
        color: COLORS[2], initials: 'KR',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&q=80'
      },
    ];

    const createdInstructors = [];

    for (const inst of instructors) {
      // Check existing
      const existRes = await pgClient.query(`SELECT id FROM "Users" WHERE email = $1`, [inst.email]);
      let userId;

      if (existRes.rows.length > 0) {
        userId = existRes.rows[0].id;
        await pgClient.query(
          `UPDATE "Users" SET role = 'instructor', full_name = $1, username = $2, avatar_url = $3 WHERE id = $4`,
          [inst.fullName, inst.username, inst.avatar, userId]
        );
      } else {
        const uuidRes = await pgClient.query(`SELECT gen_random_uuid() as id`);
        userId = uuidRes.rows[0].id;
        await pgClient.query(
          `INSERT INTO "Users" (id, full_name, username, email, password, role, avatar_url, is_online, email_verified, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'instructor', $6, false, true, NOW(), NOW())`,
          [userId, inst.fullName, inst.username, inst.email, hashedPassword, inst.avatar]
        );
      }

      // Sync auth.users
      await pgClient.query(
        `INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
         VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, $3, NOW(), '{}', $4, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
        [userId, inst.email, hashedPassword, JSON.stringify({ full_name: inst.fullName })]
      );

      // Sync profiles
      await pgClient.query(
        `INSERT INTO public.profiles (id, full_name, avatar_url, status, initials, avatar_color_bg, avatar_color_text, created_at, updated_at)
         VALUES ($1, $2, $3, 'online', $4, $5, $6, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE
         SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url,
             initials = EXCLUDED.initials, avatar_color_bg = EXCLUDED.avatar_color_bg,
             avatar_color_text = EXCLUDED.avatar_color_text, updated_at = NOW()`,
        [userId, inst.fullName, inst.avatar, inst.initials, inst.color.bg, inst.color.text]
      );

      createdInstructors.push({ ...inst, id: userId });
    }

    // ── 2. Courses ──
    const coursesData = [
      {
        title: 'Fullstack React & Node Masterclass',
        description: 'Build production-grade SaaS applications from scratch using React, Node.js, PostgreSQL, and WebSockets. Master authentication, real-time features, deployment, and performance optimization.',
        price: 4999, thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
        rating: 4.8, students: 1250, category: 'Development', duration: '40 Hours', idx: 0
      },
      {
        title: 'UI/UX Design for Developers',
        description: 'Master Tailwind CSS, Figma, and modern design systems to create stunning user interfaces. Learn color theory, typography, layout principles, and responsive design patterns.',
        price: 2999, thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
        rating: 4.9, students: 890, category: 'Design', duration: '15 Hours', idx: 0
      },
      {
        title: 'Advanced System Architecture',
        description: 'Scale your applications to handle millions of users. Learn microservices, event-driven architecture, caching strategies, load balancing, and distributed systems design.',
        price: 7999, thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
        rating: 4.7, students: 430, category: 'Architecture', duration: '25 Hours', idx: 1
      },
      {
        title: 'Machine Learning with Python',
        description: 'From linear regression to deep neural networks. Master scikit-learn, TensorFlow, and PyTorch with hands-on projects in computer vision, NLP, and recommendation systems.',
        price: 5999, thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80',
        rating: 4.6, students: 2100, category: 'Data Science', duration: '35 Hours', idx: 1
      },
      {
        title: 'DevOps & Cloud Engineering',
        description: 'Master Docker, Kubernetes, CI/CD pipelines, AWS, and infrastructure-as-code. Deploy applications with zero downtime and monitor production systems at scale.',
        price: 6499, thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&q=80',
        rating: 4.8, students: 780, category: 'Development', duration: '30 Hours', idx: 2
      },
      {
        title: 'Mobile App Development with Flutter',
        description: 'Build beautiful, natively compiled applications for iOS and Android from a single codebase. Master Dart, state management, Firebase integration, and app store deployment.',
        price: 3999, thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
        rating: 4.9, students: 1560, category: 'Development', duration: '28 Hours', idx: 2
      },
    ];

    // Clean up duplicates
    for (const c of coursesData) {
      await pgClient.query(`DELETE FROM "Courses" WHERE title = $1`, [c.title]);
    }

    const createdCourses = [];

    for (const c of coursesData) {
      const inst = createdInstructors[c.idx];
      const courseUUID = (await pgClient.query(`SELECT gen_random_uuid() as id`)).rows[0].id;
      const convoUUID = (await pgClient.query(`SELECT gen_random_uuid() as id`)).rows[0].id;

      // Create community group
      await pgClient.query(
        `INSERT INTO public.conversations (id, type, name, description, created_by, last_activity_at)
         VALUES ($1, 'group', $2, $3, $4, NOW())`,
        [convoUUID, `${c.title} Community`, `Official community group for "${c.title}". Chat, share files, and join live sessions.`, inst.id]
      );

      // Add instructor as admin
      await pgClient.query(
        `INSERT INTO public.conversation_members (conversation_id, user_id, role)
         VALUES ($1, $2, 'admin')`,
        [convoUUID, inst.id]
      );

      // Create course
      await pgClient.query(
        `INSERT INTO "Courses" (id, title, description, price, thumbnail_url, rating, students_enrolled, category, duration, instructor_id, conversation_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
        [courseUUID, c.title, c.description, c.price, c.thumbnail, c.rating, c.students, c.category, c.duration, inst.id, convoUUID]
      );

      // Welcome message
      const msgUUID = (await pgClient.query(`SELECT gen_random_uuid() as id`)).rows[0].id;
      await pgClient.query(
        `INSERT INTO public.messages (id, conversation_id, content, type, created_at)
         VALUES ($1, $2, $3, 'system', NOW())`,
        [msgUUID, convoUUID, `📚 Welcome to "${c.title}" Community! Created by ${inst.fullName}. Enrolled students will be added here automatically.`]
      );
      await pgClient.query(
        `UPDATE public.conversations SET last_message_id = $1, last_activity_at = NOW() WHERE id = $2`,
        [msgUUID, convoUUID]
      );

      createdCourses.push({ title: c.title, price: c.price, instructor: inst.fullName });
    }

    res.json(ApiResponse.ok({
      message: '🚀 Instructors & courses seeded successfully!',
      instructors: createdInstructors.map(i => ({
        email: i.email,
        fullName: i.fullName,
        password: 'Nexera@123',
        role: 'instructor'
      })),
      courses: createdCourses,
      note: 'Each course has an auto-created community group in /chat. Students who enroll via payment will join the group automatically.'
    }));
  } finally {
    try { await pgClient.end(); } catch (_) {}
  }
}));

// ═══════════════════════════════════════════════════════════
// POST /api/courses
// Instructor creates a course & auto-creates community group
// ═══════════════════════════════════════════════════════════
router.post('/', requireAuth, requireRole(['instructor']), asyncHandler(async (req, res) => {
  const { title, description, price, thumbnailUrl, category, duration } = req.body;

  if (!title || !description) {
    throw ApiError.badRequest('Title and description are required');
  }

  // Create course record
  const course = await Course.create({
    title,
    description,
    price: price || 0.00,
    thumbnailUrl,
    category,
    duration,
    instructor_id: req.user.id
  });

  // Automatically create community group for this course
  const conversation = await findOrCreateCourseGroup(course);

  // Send initial system message
  const instructorUser = await User.findByPk(req.user.id);
  await sendSystemMessage(
    conversation.id,
    `📚 Welcome to "${course.title}" Community! This group was created by ${instructorUser?.fullName || 'the instructor'}. Students who enroll will be added here automatically.`
  );

  // Invalidate instructor's conversation cache
  try {
    await deleteCache(`conversations:${req.user.id}`);
  } catch (_) {}

  res.status(201).json(ApiResponse.created({
    course,
    conversationId: conversation.id
  }, 'Course created and community group conversation initialized successfully'));
}));

export default router;
