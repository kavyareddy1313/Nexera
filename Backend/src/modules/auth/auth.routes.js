import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { authRateLimit } from '../../middleware/rateLimit.js';
import User from '../../models/User.js';
import RefreshToken from '../../models/RefreshToken.js';
import PasswordResetToken from '../../models/PasswordResetToken.js';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { Op } from 'sequelize';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import crypto from 'crypto';
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from './auth.validators.js';
import { Client } from 'pg';

const router = Router();

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role }, 
    env.JWT_SECRET, 
    { expiresIn: '15m' }
  );
  
  const refreshString = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(refreshString).digest('hex');

  return { accessToken, refreshString, tokenHash };
};

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

router.post('/register', authRateLimit, asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest('Validation failed', parsed.error.issues);
  }

  const { email, password, fullName, username, role } = parsed.data;

  const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
  if (existingUser) {
    if (existingUser.email === email) throw ApiError.conflict('Email already registered');
    throw ApiError.conflict('Username already taken');
  }

  const user = await User.create({ email, password, fullName, username, role });

  // Sync with auth.users and public.profiles for Supabase chat compatibility
  const AVATAR_COLORS = [
    { bg: '#EEF2FF', text: '#3730A3' },
    { bg: '#F0FDF4', text: '#166534' },
    { bg: '#FDF4FF', text: '#7E22CE' },
    { bg: '#FFF7ED', text: '#9A3412' },
  ];
  const colorIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
  const avatarColor = AVATAR_COLORS[colorIndex];
  
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query(
      `INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
       VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, 'dummy', NOW(), '{}', '{}', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [user.id, email]
    );

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
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest('Validation failed', parsed.error.issues);

  const { email, password } = parsed.data;
  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const { accessToken, refreshString, tokenHash } = generateTokens(user);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  res.cookie('refreshToken', refreshString, COOKIE_OPTIONS);

  res.json(ApiResponse.ok({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
  }, 'Logged in successfully'));
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshString = req.cookies.refreshToken;
  if (!refreshString) throw ApiError.unauthorized('Refresh token required');

  const tokenHash = crypto.createHash('sha256').update(refreshString).digest('hex');

  const tokenRecord = await RefreshToken.findOne({
    where: { tokenHash, revoked: false, expiresAt: { [Op.gt]: new Date() } }
  });

  if (!tokenRecord) {
    res.clearCookie('refreshToken');
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findByPk(tokenRecord.userId);
  if (!user) throw ApiError.unauthorized('User not found');

  // Revoke old token
  tokenRecord.revoked = true;
  await tokenRecord.save();

  // Issue new tokens
  const newTokens = generateTokens(user);
  
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user.id,
    tokenHash: newTokens.tokenHash,
    expiresAt,
  });

  res.cookie('refreshToken', newTokens.refreshString, COOKIE_OPTIONS);
  res.json(ApiResponse.ok({ accessToken: newTokens.accessToken }));
}));

router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  const refreshString = req.cookies.refreshToken;
  if (refreshString) {
    const tokenHash = crypto.createHash('sha256').update(refreshString).digest('hex');
    await RefreshToken.update({ revoked: true }, { where: { tokenHash } });
  }

  res.clearCookie('refreshToken');
  await User.update({ isOnline: false }, { where: { id: req.user.id } });
  res.json(ApiResponse.ok(null, 'Logged out successfully'));
}));

router.post('/forgot-password', authRateLimit, asyncHandler(async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest('Validation failed', parsed.error.issues);

  const { email } = parsed.data;
  const user = await User.findOne({ where: { email } });

  if (user) {
    const resetString = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetString).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${resetString}`;
    console.log(`\n\n[DEV MODE] Password Reset Link for ${email}: \n${resetLink}\n\n`);
  }

  res.json(ApiResponse.ok(null, 'If that email is registered, a password reset link has been sent.'));
}));

router.post('/reset-password', authRateLimit, asyncHandler(async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest('Validation failed', parsed.error.issues);

  const { token, newPassword } = parsed.data;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const resetToken = await PasswordResetToken.findOne({
    where: { tokenHash, used: false, expiresAt: { [Op.gt]: new Date() } }
  });

  if (!resetToken) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const user = await User.findByPk(resetToken.userId);
  if (!user) throw ApiError.notFound('User not found');

  user.password = newPassword; // Will be hashed by Sequelize hook
  await user.save();

  resetToken.used = true;
  await resetToken.save();

  // Invalidate all active refresh tokens for the user
  await RefreshToken.update(
    { revoked: true }, 
    { where: { userId: user.id, revoked: false } }
  );

  res.json(ApiResponse.ok(null, 'Password has been successfully reset.'));
}));

router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  res.json(ApiResponse.ok({
    id: req.user.id,
    email: req.user.email,
    fullName: req.user.fullName,
    role: req.user.role,
  }));
}));

export default router;
