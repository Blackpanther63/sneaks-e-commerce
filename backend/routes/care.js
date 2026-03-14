import express from 'express';
import pool from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';
import nodemailer from 'nodemailer';

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// @route POST /api/request-callback
// @desc Request a callback
router.post('/request-callback', protect, async (req, res) => {
  try {
    const { phone_number, issue } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.first_name || 'Customer';

    if (!phone_number) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    // Save to database
    await pool.query(
      'INSERT INTO callback_requests (user_id, phone_number, issue, status, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, phone_number, issue || null, 'Pending']
    );

    // Send confirmation email
    const mailOptions = {
      from: `"Sneaks Support" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Sneaks Callback Request Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e1e1e1; padding: 20px; border-radius: 10px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 24px;">S</div>
            <h1 style="color: #111827; margin: 10px 0;">SNEAKS</h1>
          </div>
          
          <h2 style="color: #4f46e5; text-align: center;">Callback Request Received</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Your callback request has been received.</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Request Details</p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Phone Number:</strong> <span style="color: #4f46e5;">${phone_number}</span></p>
            ${issue ? `<p style="margin: 15px 0 5px 0; font-size: 16px;"><strong>Described Issue:</strong></p>
            <div style="background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 14px; color: #334155; line-height: 1.5;">${issue}</div>` : ''}
          </div>
          
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">Our support team will contact you shortly.</p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          
          <p style="text-align: center; color: #94a3b8; font-size: 12px;">
            Sneaks Customer Support<br/>
            © 2026 Sneaks E-commerce. All rights reserved.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ 
      success: true,
      message: 'Callback request submitted successfully' 
    });
  } catch (error) {
    console.error('[CARE] callback request error:', error);
    res.status(500).json({ success: false, message: 'Server error while requesting callback.' });
  }
});

export default router;
