import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'backend-error.log');
const logError = (err) => {
  const msg = `[${new Date().toISOString()}] ${err}\n`;
  fs.appendFileSync(logFile, msg);
};

// Original consoles
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.log = (...args) => {
  logError(`[LOG] ${args.join(' ')}`);
  originalConsoleLog(...args);
};
console.warn = (...args) => {
  logError(`[WARN] ${args.join(' ')}`);
  originalConsoleWarn(...args);
};
console.error = (...args) => {
  logError(`[ERROR] ${args.join(' ')}`);
  originalConsoleError(...args);
};

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ─── OTP Store ────────────────────────────────────────────────────────────────
// Each entry: { otp, expiresAt, attempts }
const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;

// ─── Nodemailer Setup ─────────────────────────────────────────────────────────
let transporter;
const setupTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('[AUTH] Using real SMTP config from .env');
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('[AUTH] No SMTP config in .env — using Ethereal (dev mode).');
  }
};
setupTransporter();

// ─── HTML Email Builder ───────────────────────────────────────────────────────
const buildOtpEmail = (otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Sneaks – Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:32px;text-align:center;">
            <div style="display:inline-block;background:#fff;padding:10px 18px;border-radius:8px;">
              <span style="font-size:24px;font-weight:900;color:#4f46e5;letter-spacing:-1px;">SNEAKS</span>
            </div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 48px;">
            <h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Verify your email address</h2>
            <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
              Use the code below to complete your signup. It will expire in <strong>5 minutes</strong>.
            </p>
            <div style="text-align:center;background:#f1f5f9;border-radius:12px;padding:28px 0;margin-bottom:28px;">
              <span style="font-size:42px;font-weight:900;letter-spacing:14px;color:#4f46e5;">${otp}</span>
            </div>
            <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
              If you didn't request this, please ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 48px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Sneaks. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── POST /api/auth/send-otp ──────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { email, phone, method, first_name, last_name, password } = req.body;
    const targetMethod = method || 'email';

    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
    if (targetMethod === 'mobile' && !phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required for mobile verification.' });
    }

    // Optional: Basic validation for signup fields
    if (!first_name || !password) {
      return res.status(400).json({ success: false, message: 'First name and password are required for signup.' });
    }

    // Prevent duplicate emails
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store with 5-min expiry + signup data
    console.log(`[AUTH] Storing signup data for ${email} in otpStore`);
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
      method: targetMethod,
      phone: phone || null,
      first_name,
      last_name,
      password // Stored temporarily until verified
    });

    if (targetMethod === 'email') {
      const info = await transporter.sendMail({
        from: `"Sneaks" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Sneaks Account Verification',
        html: buildOtpEmail(otp),
        text: `Your Sneaks verification code is: ${otp}\nThis code will expire in 5 minutes.`,
      });

      console.log(`[AUTH] OTP email sent to ${email}`);

      if (!process.env.SMTP_USER) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[AUTH] ✉  Preview email at: ${previewUrl}`);
        return res.json({ success: true, message: 'OTP sent to email.', devPreviewUrl: previewUrl, method: 'email' });
      }

      return res.json({ success: true, message: 'OTP sent to your email. Valid for 5 minutes.', method: 'email' });
    } else {
      // SIMULATED MOBILE OTP
      console.log(`[AUTH] 📱 SIMULATED SMS to ${phone}: Your Sneaks verification code is ${otp}`);
      
      return res.json({ 
        success: true,
        message: `OTP sent to ${phone} (Simulated).`, 
        method: 'mobile',
        devOtp: otp 
      });
    }
  } catch (err) {
    console.error('[AUTH] send-otp error:', err);
    res.status(500).json({ success: false, message: `Failed to send OTP: ${err.message}` });
  }
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // 1. Basic Validation
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required.' 
      });
    }

    // 2. OTP Verification & Data Retrieval
    const stored = otpStore.get(email);
    if (!stored) {
      return res.status(400).json({ success: false, message: 'No signup session found for this email. Please try again.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: 'OTP expired (5 min limit). Please request a new one.' });
    }

    stored.attempts += 1;
    if (stored.attempts > MAX_OTP_ATTEMPTS) {
      otpStore.delete(email);
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    if (stored.otp !== otp.toString().trim()) {
      const remaining = MAX_OTP_ATTEMPTS - stored.attempts;
      return res.status(400).json({ success: false, message: `Incorrect OTP. ${remaining} attempt(s) remaining.` });
    }

    // Retrieve full data from stored session
    const { first_name, last_name, phone, password } = stored;

    if (!first_name || !password) {
      return res.status(400).json({ success: false, message: 'Registration data missing from session. Please restart signup.' });
    }

    // OTP valid — clear it
    otpStore.delete(email);

    // 3. Handle Duplicate Email (Safety check)
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // 4. Password Hashing (Now happens at registration time)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Create User (Database Update)
    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, email, phone, password_hash, email_verified) VALUES (?, ?, ?, ?, ?, TRUE)',
      [first_name, last_name, email, phone || null, hashedPassword]
    );

    const userId = result.insertId;
    console.log(`[AUTH] Account created successfully: ${email} (id=${userId})`);

    // 6. Return Proper API Response
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: userId,
        first_name,
        last_name,
        email,
        token: generateToken(userId),
      }
    });
  } catch (err) {
    console.error('[AUTH] register error details:', err);
    res.status(500).json({ 
      success: false, 
      message: `Database error during registration: ${err.message}` 
    });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];

    // Block unverified accounts
    if (!user.email_verified) {
      return res.status(403).json({ success: false, message: 'Email not verified. Please complete signup.' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ success: false, message: 'This account uses a different login method.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    res.json({
      success: true,
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (err) {
    console.error('[AUTH] login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// ─── GET /api/auth/check-auth ────────────────────────────────────────────────
router.get('/check-auth', protect, async (req, res) => {
  try {
    // req.user is populated by the protect middleware
    res.json(req.user);
  } catch (err) {
    console.error('[AUTH] check-auth error:', err);
    res.status(500).json({ message: 'Server error during auth check.' });
  }
});

// ─── POST /api/auth/forgot-password-otp ───────────────────────────────────────
router.post('/forgot-password-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      // Even if it doesn't exist, we send a generic message for security
      return res.status(200).json({ success: true, message: 'If the email exists, an OTP has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const storeKey = email + '_reset';
    
    otpStore.set(storeKey, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0
    });

    const info = await transporter.sendMail({
      from: `"Sneaks" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Sneaks Password Reset',
      html: buildOtpEmail(otp).replace('Verify your email address', 'Reset your password').replace('Use the code below to complete your signup.', 'Use the code below to reset your password.'),
      text: `Your Sneaks password reset code is: ${otp}\nThis code will expire in 5 minutes.`,
    });

    if (!process.env.SMTP_USER) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[AUTH] ✉  Preview reset email at: ${previewUrl}`);
      return res.json({ success: true, message: 'OTP sent to email.', devPreviewUrl: previewUrl, method: 'email' });
    }

    return res.json({ success: true, message: 'OTP sent to your email. Valid for 5 minutes.' });
  } catch (err) {
    console.error('[AUTH] forgot-password error:', err);
    res.status(500).json({ success: false, message: 'Failed to process forgot password request.' });
  }
});

// ─── POST /api/auth/reset-password ────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
    }

    const storeKey = email + '_reset';
    const stored = otpStore.get(storeKey);
    
    if (!stored) {
      return res.status(400).json({ success: false, message: 'No reset session found. Please request a new OTP.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(storeKey);
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    stored.attempts += 1;
    if (stored.attempts > MAX_OTP_ATTEMPTS) {
      otpStore.delete(storeKey);
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    if (stored.otp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
    }

    // OTP belongs to a reset session and is valid
    otpStore.delete(storeKey);

    const hashedPassword = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [hashedPassword, email]);

    return res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });

  } catch (err) {
    console.error('[AUTH] reset-password error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

export default router;
