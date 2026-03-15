import pool from './backend/config/db.js';

async function migrate() {
  try {
    console.log('Checking for firebase_uid column...');
    const [columns] = await pool.query('SHOW COLUMNS FROM users LIKE "firebase_uid"');
    
    if (columns.length === 0) {
      console.log('Adding firebase_uid column to users table...');
      await pool.query('ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(255) UNIQUE AFTER id');
      console.log('Column added successfully.');
    } else {
      console.log('firebase_uid column already exists.');
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    process.exit();
  }
}

migrate();
