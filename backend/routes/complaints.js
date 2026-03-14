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

// @route POST /api/complaints/register
// @desc Register a new complaint
router.post('/register', protect, async (req, res) => {
  try {
    const { order_id, problem_type, description } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (!problem_type || !description) {
      return res.status(400).json({ message: 'Problem type and description are required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO complaints (user_id, order_id, problem_type, description) VALUES (?, ?, ?, ?)',
      [userId, order_id || null, problem_type, description]
    );

    const ticketId = result.insertId;

    // Send confirmation email
    const mailOptions = {
      from: `"Sneaks Support" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Sneaks Support Ticket Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e1e1e1; padding: 20px; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Sneaks Support Ticket Created</h2>
          <p>Hello,</p>
          <p>Your support request has been successfully registered.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #${ticketId}</p>
            <p style="margin: 5px 0;"><strong>Issue:</strong> ${problem_type}</p>
          </div>
          <p>Our support team will contact you within 24 hours.</p>
          <p>Thank you,<br/>Sneaks Support Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ 
      message: 'Your issue has been registered successfully. A confirmation email has been sent to your email address.',
      ticketId 
    });
  } catch (error) {
    console.error('[COMPLAINTS] registration error:', error);
    res.status(500).json({ message: 'Server error while registering complaint.' });
  }
});

// @route GET /api/complaints/status/:id
// @desc Check status of a complaint
router.get('/status/:id', protect, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const [rows] = await pool.query('SELECT * FROM complaints WHERE id = ? AND user_id = ?', [ticketId, req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('[COMPLAINTS] status error:', error);
    res.status(500).json({ message: 'Server error while fetching complaint status.' });
  }
});

export default router;
