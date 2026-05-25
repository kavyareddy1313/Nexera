import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { authRateLimit } from '../../middleware/rateLimit.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { z } from 'zod';
import { Op } from 'sequelize';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { Client } from 'pg';

const router = Router();

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  fullName: z.string().min(2),
  username: z.string().min(3).regex(/^[a-z0-9_]+$/, 'Username must be lowercase letters, numbers, or underscores'),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

router.post('/register', authRateLimit, asyncHandler(async (req, res) => {
  const parsed = signUpSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest('Validation failed', parsed.error.issues);
  }

  const { email, password, fullName, username } = parsed.data;

  const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
  if (existingUser) {
    if (existingUser.email === email) throw ApiError.conflict('Email already registered');
    throw ApiError.conflict('Username already taken');
  }

  const user = await User.create({ email, password, fullName, username });

  // Sync with auth.users and public.profiles for Supabase chat compatibility
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
  const colorIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
  const avatarColor = AVATAR_COLORS[colorIndex];
  
  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Insert into auth.users to satisfy foreign key constraints
    await client.query(
      `INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
       VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, 'dummy', NOW(), '{}', '{}', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [user.id, email]
    );

    // Upsert into public.profiles
    await client.query(
      `INSERT INTO public.profiles (id, full_name, status, initials, avatar_color_bg, avatar_color_text, created_at, updated_at)
       VALUES ($1, $2, 'online', $3, $4, $5, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE 
       SET full_name = EXCLUDED.full_name, initials = EXCLUDED.initials, 
           avatar_color_bg = EXCLUDED.avatar_color_bg, avatar_color_text = EXCLUDED.avatar_color_text,
           updated_at = NOW()`,
      [user.id, fullName, initials, avatarColor.bg, avatarColor.text]
    );
  } catch (err) {
    console.error('Failed to sync profile on register:', err.message);
  } finally {
    await client.end();
  }

  res.status(201).json(ApiResponse.created({ userId: user.id }, 'Account created'));
}));

router.post('/login', authRateLimit, asyncHandler(async (req, res) => {
  const parsed = signInSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest('Validation failed', parsed.error.issues);

  const { email, password } = parsed.data;
  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const { accessToken, refreshToken } = generateTokens(user);

  res.json(ApiResponse.ok({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      avatarUrl: user.avatarUrl,
    },
  }, 'Logged in successfully'));
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.badRequest('refreshToken is required');

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) throw new Error();

    const tokens = generateTokens(user);
    res.json(ApiResponse.ok(tokens));
  } catch (err) {
    throw ApiError.unauthorized('Invalid refresh token');
  }
}));

// Get all users (excluding self)
router.get('/users', authMiddleware, asyncHandler(async (req, res) => {
  const users = await User.findAll({
    where: { id: { [Op.ne]: req.user.id } },
    attributes: ['id', 'fullName', 'username', 'email', 'avatarUrl', 'isOnline'],
  });
  res.json(ApiResponse.ok(users));
}));

// Search users by username or fullName
router.get('/users/search', authMiddleware, asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) {
    return res.json(ApiResponse.ok([]));
  }

  const query = q.trim();
  const users = await User.findAll({
    where: {
      id: { [Op.ne]: req.user.id },
      [Op.or]: [
        { username: { [Op.iLike]: `%${query}%` } },
        { fullName: { [Op.iLike]: `%${query}%` } },
      ],
    },
    attributes: ['id', 'fullName', 'username', 'email', 'avatarUrl', 'isOnline'],
    limit: 20,
  });

  res.json(ApiResponse.ok(users));
}));

// Logout (stateless — just acknowledge)
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  await User.update({ isOnline: false }, { where: { id: req.user.id } });
  res.json(ApiResponse.ok(null, 'Logged out successfully'));
}));

// Update user profile
router.put('/profile', authMiddleware, asyncHandler(async (req, res) => {
  const updateSchema = z.object({
    fullName: z.string().min(2).optional(),
    username: z.string().min(3).regex(/^[a-z0-9_]+$/, 'Username must be lowercase letters, numbers, or underscores').optional(),
  });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest('Validation failed', parsed.error.issues);
  }

  const { fullName, username } = parsed.data;
  const user = await User.findByPk(req.user.id);

  if (!user) throw ApiError.notFound('User not found');

  if (username && username !== user.username) {
    const existing = await User.findOne({ where: { username } });
    if (existing) throw ApiError.conflict('Username already taken');
  }

  if (fullName) user.fullName = fullName;
  if (username) user.username = username;

  await user.save();

  // Try to sync with public.profiles
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Calculate new initials if fullName changed
    let initials = user.fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    await client.query(
      `UPDATE public.profiles 
       SET full_name = $1, initials = $2, updated_at = NOW()
       WHERE id = $3`,
      [user.fullName, initials, user.id]
    );
  } catch (err) {
    console.error('Failed to sync profile update:', err.message);
  } finally {
    await client.end();
  }

  res.json(ApiResponse.ok({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    username: user.username,
    avatarUrl: user.avatarUrl,
  }, 'Profile updated successfully'));
}));

export default router;
