import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { Course, User, CourseEnrollment, Conversation, ConversationMember } from '../../models/index.js';
import { authMiddleware as requireAuth } from '../../middleware/auth.middleware.js';
import { razorpay } from '../../config/razorpay.js';
import crypto from 'crypto';
import { env } from '../../config/env.js';

const router = Router();

// GET /api/courses/my-enrollments
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

// GET /api/courses
router.get('/', asyncHandler(async (req, res) => {
  // In a real app we'd paginate and filter
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

// GET /api/courses/:id
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

  res.json(ApiResponse.ok(course));
}));

// POST /api/courses/:id/create-order
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

  // Amount is in the smallest currency unit (paise for INR, cents for USD)
  // Let's assume price is in USD and we convert to cents (x100)
  // Actually Razorpay usually uses INR by default, let's use INR.
  const amount = Math.round(Number(course.price) * 100);

  const options = {
    amount, 
    currency: "USD", // You can change to INR if needed
    receipt: `receipt_order_${Math.floor(Math.random() * 10000)}`,
  };

  const order = await razorpay.orders.create(options);
  
  if (!order) {
    throw ApiError.internal('Failed to create Razorpay order');
  }

  res.json(ApiResponse.ok({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency
  }));
}));

// POST /api/courses/verify-payment
router.post('/verify-payment', requireAuth, asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, course_id } = req.body;

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

  // Payment is successful, create enrollment
  const enrollment = await CourseEnrollment.create({
    user_id: req.user.id,
    course_id: course_id,
    payment_id: razorpay_payment_id,
    payment_status: 'completed'
  });

  const course = await Course.findByPk(course_id);

  // Auto-Enroll in Group Chat (Feature 4)
  // Find or create group chat for this course
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
      is_channel: false,
      created_by: course.instructor_id || req.user.id
    });
    
    // Add instructor if they exist
    if (course.instructor_id) {
      await ConversationMember.create({
        conversation_id: conversation.id,
        user_id: course.instructor_id,
        role: 'admin'
      });
    }
  }

  // Add the student
  await ConversationMember.findOrCreate({
    where: {
      conversation_id: conversation.id,
      user_id: req.user.id
    },
    defaults: {
      role: 'member'
    }
  });

  // Increment course students
  await course.increment('students_enrolled', { by: 1 });

  res.json(ApiResponse.ok({
    message: 'Payment verified and enrolled successfully!',
    conversationId: conversation.id
  }));
}));
router.post('/seed', asyncHandler(async (req, res) => {
  // Get first user to act as instructor
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

  await Course.bulkCreate(mockCourses);
  res.json(ApiResponse.ok({ message: 'Seeded successfully' }));
}));

export default router;
