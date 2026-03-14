import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './backend/routes/auth.js';
import profileRoutes, { changePassword } from './backend/routes/profile.js';
import { protect } from './backend/middleware/authMiddleware.js';
import ordersRoutes from './backend/routes/orders.js';
import complaintsRoutes from './backend/routes/complaints.js';
import careRoutes from './backend/routes/care.js';
import aiRoutes from './backend/routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... existing routes ...
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
// The user requested /api/change-password specifically
app.post('/api/change-password', protect, changePassword);
app.use('/api/orders', ordersRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api', careRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sneakers API is running' });
});

// Serve frontend static files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

const listener = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
