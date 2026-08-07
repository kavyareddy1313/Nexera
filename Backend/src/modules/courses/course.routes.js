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
  const courses = await Course.findAll({
    include: [{
      model: User,
      as: 'instructor',
      attributes: ['id', 'fullName', 'avatarUrl']
    }],
    order: [['createdAt', 'DESC']]
  });
  
  res.json(ApiResponse.ok(courses));
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
// POST /api/courses/seed — Seed mock courses for development
// ═══════════════════════════════════════════════════════════
router.post('/seed', asyncHandler(async (req, res) => {
  const instructor = await User.findOne();
  if (!instructor) {
    throw ApiError.badRequest('No users found. Please create a user first.');
  }

  const mockCourses = [
    {
      title: "Fullstack React & Node Masterclass",
      description: "Learn to build scalable, premium SaaS products from scratch.",
      price: 99.99,
      thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
      rating: 4.8,
      studentsEnrolled: 1250,
      category: "Development",
      duration: "40 Hours",
      instructor_id: instructor.id
    },
    {
      title: "UI/UX Design for Developers",
      description: "Master Tailwind CSS and Figma to create stunning user interfaces.",
      price: 49.99,
      thumbnailUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
      rating: 4.9,
      studentsEnrolled: 890,
      category: "Design",
      duration: "15 Hours",
      instructor_id: instructor.id
    },
    {
      title: "Advanced System Architecture",
      description: "Scale your applications to handle millions of users with ease.",
      price: 149.99,
      thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
      rating: 4.7,
      studentsEnrolled: 430,
      category: "Architecture",
      duration: "25 Hours",
      instructor_id: instructor.id
    }
  ];

  const createdCourses = await Course.bulkCreate(mockCourses);

  // Create community groups for each seeded course
  for (const course of createdCourses) {
    await findOrCreateCourseGroup(course);
  }

  res.json(ApiResponse.ok({ message: 'Seeded successfully with community groups' }));
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
