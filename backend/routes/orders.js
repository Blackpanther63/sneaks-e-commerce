import express from 'express';
import pool from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = express.Router();

// ─── Setup Razorpay ────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Setup Nodemailer ────────────────────────────────────────────────────────
let transporter;
const setupTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('[ORDERS] No SMTP config — using Ethereal (dev mode).');
  }
};
setupTransporter();

// HTML email builder for order confirmation
const buildOrderConfirmEmail = ({ orderId, trackingNumber, items, totalPrice, address, paymentMethod, userName }) => {
  const itemRows = items.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
        <strong style="color:#111827;">${item.name || item.product_name}</strong><br/>
        <span style="color:#6b7280;font-size:13px;">Qty: ${item.quantity} · ₹${item.price}</span>
      </td>
      <td style="padding:8px 0;text-align:right;border-bottom:1px solid #f3f4f6;font-weight:600;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><title>Order Confirmation – Sneaks</title></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#4f46e5;padding:32px;text-align:center;">
            <div style="display:inline-block;background:#fff;padding:10px 18px;border-radius:8px;">
              <span style="font-size:24px;font-weight:900;color:#4f46e5;letter-spacing:-1px;">SNEAKS</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 48px;">
            <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Order Confirmed! 🎉</h2>
            <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">Hi ${userName || 'there'}, your order has been placed successfully.</p>

            <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:0 0 24px;">
              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Order ID</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#4f46e5;">#${orderId}</p>
              <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">Tracking: <strong style="color:#111827;">${trackingNumber}</strong></p>
            </div>

            <h3 style="margin:0 0 12px;color:#111827;font-size:16px;">Order Summary</h3>
            <table width="100%" style="border-collapse:collapse;">
              ${itemRows}
              <tr>
                <td style="padding:16px 0 0;font-weight:700;color:#111827;">Total</td>
                <td style="padding:16px 0 0;text-align:right;font-weight:700;color:#4f46e5;font-size:18px;">₹${totalPrice}</td>
              </tr>
            </table>

            <div style="margin:24px 0;border-top:2px solid #f3f4f6;padding-top:20px;">
              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Shipping Address</p>
              <p style="margin:0;color:#374151;">${address}</p>
            </div>

            <div style="margin:0 0 24px;">
              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Payment Method</p>
              <p style="margin:0;color:#374151;font-weight:600;">${paymentMethod}</p>
            </div>

            <div style="background:#ecfdf5;border-radius:12px;padding:16px;text-align:center;">
              <p style="margin:0;color:#047857;font-weight:600;">📦 Estimated delivery: 3–7 business days</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:24px;text-align:center;color:#6b7280;font-size:13px;">
            © ${new Date().getFullYear()} Sneaks. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// ─── POST /api/orders — Place a new order ───────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { cartItems, totalPrice, address_id, payment_method } = req.body;
    const userId = req.user.id;

    console.log('[ORDERS] Place order request from user:', userId);
    console.log('[ORDERS] Cart items:', JSON.stringify(cartItems));

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // ─── Verify Payment if not COD ───────────────────────────────────────────
    if (payment_method !== 'Cash on Delivery') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed: Missing details' });
      }

      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
      }
      console.log('[ORDERS] Razorpay payment verified for signature:', razorpay_signature);
    }

    const tracking_number = 'TRK' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
    const firstItem = cartItems[0];

    // Get address text for email
    let addressText = 'Address not provided';
    if (address_id) {
      const [addrRows] = await pool.query(
        'SELECT name, phone, address_line, city, state, pincode FROM addresses WHERE id = ?',
        [address_id]
      );
      if (addrRows.length > 0) {
        const a = addrRows[0];
        addressText = `${a.name}, ${a.address_line}, ${a.city}, ${a.state} - ${a.pincode} | ${a.phone}`;
      }
    }

    const [result] = await pool.query(
      'INSERT INTO orders (user_id, product_id, product_name, product_image, order_status, tracking_number, total_price, address_id, payment_method, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        firstItem.id,
        firstItem.name,
        firstItem.image || '',
        'Ordered',
        tracking_number,
        totalPrice,
        address_id || null,
        payment_method || 'Cash on Delivery',
        firstItem.quantity || 1
      ]
    );

    const orderId = result.insertId;
    console.log('[ORDERS] Order created with ID:', orderId);

    // Insert all items into order_items
    for (const item of cartItems) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.id, item.quantity, item.price]
      );
    }

    // ─── Send confirmation email ──────────────────────────────────────────
    try {
      const [userRows] = await pool.query('SELECT first_name, email FROM users WHERE id = ?', [userId]);
      if (userRows.length > 0 && transporter) {
        const { email, first_name } = userRows[0];
        const html = buildOrderConfirmEmail({
          orderId,
          trackingNumber: tracking_number,
          items: cartItems,
          totalPrice,
          address: addressText,
          paymentMethod: payment_method || 'Cash on Delivery',
          userName: first_name,
        });
        const info = await transporter.sendMail({
          from: `"Sneaks" <${process.env.SMTP_USER || 'noreply@sneaks.in'}>`,
          to: email,
          subject: `Order Confirmed #${orderId} – Sneaks`,
          html,
        });
        console.log('[ORDERS] Confirmation email sent to:', email, '| MessageId:', info.messageId);
      }
    } catch (emailErr) {
      console.error('[ORDERS] Email send failed (non-critical):', emailErr.message);
    }

    res.status(201).json({ message: 'Order placed successfully', orderId, tracking_number });
  } catch (error) {
    console.error('[ORDERS] Place order error:', error);
    res.status(500).json({ message: 'Server error while placing order.' });
  }
});

// ─── POST /api/orders/create-razorpay-order ─────────────────────────────────
router.post('/create-razorpay-order', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ message: 'Amount is required' });

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: 'INR',
      receipt: 'receipt_' + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error('[ORDERS] Razorpay Order Error:', error);
    res.status(500).json({ message: 'Could not create Razorpay order' });
  }
});

// ─── GET /api/orders — Fetch all orders for logged-in user ──────────────────
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[ORDERS] Fetching orders for user:', userId);

    // Use created_at (correct column name after migration)
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    console.log('[ORDERS] Found', orders.length, 'orders');
    res.json(orders);
  } catch (error) {
    console.error('[ORDERS] Fetch orders error:', error);
    res.status(500).json({ message: 'Server error while fetching orders.' });
  }
});

// ─── GET /api/orders/track — Fetch single order by tracking_id or order_id ───
// Notice: no `protect` middleware here so anyone with the ID can track it.
router.get('/track', async (req, res) => {
  try {
    const { order_id, tracking_id } = req.query;

    if (!order_id && !tracking_id) {
      return res.status(400).json({ success: false, message: 'Must provide order_id or tracking_id' });
    }

    let query = '';
    let queryParams = [];

    if (tracking_id) {
      query = 'SELECT * FROM orders WHERE tracking_number = ? LIMIT 1';
      queryParams = [tracking_id];
    } else if (order_id) {
      query = 'SELECT * FROM orders WHERE id = ? LIMIT 1';
      queryParams = [order_id];
    }

    const [orders] = await pool.query(query, queryParams);

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orders[0];
    
    // Convert order_status to frontend expected 'status' format
    const formattedOrder = {
      ...order,
      status: order.order_status,
      // Add a mock expected delivery date (5 days from creation) for the UI
      expected_delivery: new Date(new Date(order.created_at).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    };

    res.json({ success: true, order: formattedOrder });
  } catch (error) {
    console.error('[ORDERS] Track order error:', error);
    res.status(500).json({ success: false, message: 'Server error while tracking order.' });
  }
});

export default router;
