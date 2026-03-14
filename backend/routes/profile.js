import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route GET /api/profile
// @desc Get user profile
router.get('/', protect, async (req, res) => {
  try {
    const user = req.user;
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route PUT /api/profile
// @desc Update user profile
router.put('/', protect, async (req, res) => {
  try {
    const { first_name, last_name, phone, address } = req.body;
    const userId = req.user.id;

    await pool.query(
      'UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ? WHERE id = ?',
      [
        first_name || req.user.first_name,
        last_name || req.user.last_name,
        phone || req.user.phone,
        address || req.user.address,
        userId
      ]
    );

    const [updatedUsers] = await pool.query('SELECT id, first_name, last_name, email, phone, address FROM users WHERE id = ?', [userId]);
    res.json({ success: true, user: updatedUsers[0], message: 'Profile updated successfully!' });
  } catch (error) {
    console.error('[PROFILE] update error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating profile.' });
  }
});

// @route POST /api/change-password
// @desc Change user password
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.user.id;

    console.log(`[PROFILE] Change password request for user ID: ${userId}`);

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current, new, and confirm passwords are required.' 
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ 
        success: false, 
        message: 'New passwords do not match.' 
      });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(new_password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    // Get current user password hash
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    
    if (rows.length === 0) {
      console.warn(`[PROFILE] User ${userId} not found during password change.`);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = rows[0];

    if (!user.password_hash) {
      console.warn(`[PROFILE] User ${userId} has no password set.`);
      return res.status(400).json({ success: false, message: 'This account does not have a password set.' });
    }

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      console.warn(`[PROFILE] Incorrect current password for user ${userId}`);
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

    console.log(`[PROFILE] Password updated successfully for user ${userId}`);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('[PROFILE] change-password error:', error);
    res.status(500).json({ success: false, message: 'Server error while changing password. Please try again later.' });
  }
};

router.post('/change-password', protect, changePassword);

// @route DELETE /api/profile/delete-account
// @desc Delete user account
router.delete('/delete-account', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('[PROFILE] delete-account error:', error);
    res.status(500).json({ message: 'Server error while deleting account.' });
  }
});

// ─── Address CRUD ──────────────────────────────────────────────────────────

// ─── Address CRUD (Aligned with User Requirements) ──────────────────────────

// @route GET /api/get-addresses
router.get('/get-addresses', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, addresses: rows });
  } catch (error) {
    console.error('[PROFILE] get-addresses error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching addresses.' });
  }
});

// @route POST /api/add-address
router.post('/add-address', protect, async (req, res) => {
  try {
    const { name, phone, address_line, city, state, pincode } = req.body;
    const userId = req.user.id;

    if (!name || !phone || !address_line || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO addresses (user_id, name, phone, address_line, city, state, pincode) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, phone, address_line, city, state, pincode]
    );

    res.status(201).json({ success: true, id: result.insertId, message: 'Address added successfully' });
  } catch (error) {
    console.error('[PROFILE] add-address error:', error);
    res.status(500).json({ success: false, message: 'Server error while adding address.' });
  }
});

// @route PUT /api/update-address
router.put('/update-address/:id', protect, async (req, res) => {
  try {
    const { name, phone, address_line, city, state, pincode } = req.body;
    const { id } = req.params;
    const userId = req.user.id;

    const [check] = await pool.query('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
    if (check.length === 0) return res.status(404).json({ success: false, message: 'Address not found.' });

    await pool.query(
      'UPDATE addresses SET name = ?, phone = ?, address_line = ?, city = ?, state = ?, pincode = ? WHERE id = ?',
      [name, phone, address_line, city, state, pincode, id]
    );

    res.json({ success: true, message: 'Address updated successfully' });
  } catch (error) {
    console.error('[PROFILE] update-address error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating address.' });
  }
});

// @route DELETE /api/delete-address
router.delete('/delete-address/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [check] = await pool.query('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
    if (check.length === 0) return res.status(404).json({ success: false, message: 'Address not found.' });

    await pool.query('DELETE FROM addresses WHERE id = ?', [id]);
    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('[PROFILE] delete-address error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting address.' });
  }
});

export default router;
