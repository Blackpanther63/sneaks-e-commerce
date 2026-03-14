import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function alterTable() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sneakers_db'
    });

    console.log('Adding issue column...');
    await pool.query('ALTER TABLE callback_requests ADD COLUMN issue TEXT');
    console.log('Column added successfully.');
    process.exit(0);
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
       console.log('Column already exists.');
       process.exit(0);
    }
    console.error('Error:', e);
    process.exit(1);
  }
}
alterTable();
