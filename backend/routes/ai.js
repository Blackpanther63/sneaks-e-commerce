import express from 'express';
import pool from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'PLACEHOLDER_KEY');

// @route POST /api/ai/chat
// @desc Handle AI chat with order context
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, selectedOrderId } = req.body;
    const userId = req.user.id;
    const userName = req.user.first_name || 'Customer';

    // 1. Fetch user orders for context
    const [orders] = await pool.query(
      'SELECT id, product_name, status, tracking_number, price, order_date, delivery_date FROM orders WHERE user_id = ? ORDER BY order_date DESC',
      [userId]
    );

    let specificOrderContext = '';
    if (selectedOrderId) {
      const order = orders.find(o => o.id === parseInt(selectedOrderId));
      if (order) {
        specificOrderContext = `The user is specifically asking about Order #${order.id}: ${order.product_name}. Status: ${order.status}. Price: ${order.price}. Order Date: ${order.order_date}. Delivery Date: ${order.delivery_date || 'N/A'}.`;
      }
    }

    const orderListContext = orders.map(o => 
      `Order #${o.id}: ${o.product_name} | Status: ${o.status}`
    ).join('\n');

    // 2. Prepare Gemini Prompt
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are SNEAKS AI, a helpful and premium customer support assistant for "Sneaks", a high-end sneaker e-commerce store.
      
      User Info: ${userName}
      User Orders Context:
      ${orderListContext || "The user has no orders yet."}
      
      ${specificOrderContext}
      
      Current User Message: "${message}"
      
      Guidelines:
      1. Be concise, polite, and use sneaker-head terminology where appropriate (e.g., "kicks", "drops").
      2. If the user asks about an order they have, provide specific details based on the context above.
      3. If they want to return something, mention our 30-day unworn return policy.
      4. If their order is "Shipped", provide the tracking number if available.
      5. Use emojis but keep it professional.
      6. If you cannot help, offer to connect them to a human agent, request a callback, or create a support ticket.
      7. Format responses with line breaks for readability.
    `;

    // 3. Generate Content (Handle missing API key gracefully for now)
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'PLACEHOLDER_KEY') {
       return res.json({ 
         text: "SNEAKS AI is currently in 'Training Mode' (API Key missing). I can see your order history though!\n\nYou have " + (orders.length || "no") + " orders in your account. How can I help with them?",
         orders: orders.map(o => ({ id: o.id, name: o.product_name, status: o.status }))
       });
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ 
      text: responseText,
      orders: orders.map(o => ({ id: o.id, name: o.product_name, status: o.status }))
    });

  } catch (error) {
    console.error('[AI] chat error:', error);
    res.status(500).json({ message: 'Server error while processing AI chat.' });
  }
});

export default router;
