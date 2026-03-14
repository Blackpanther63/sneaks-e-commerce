import pool from '../config/db.js';

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('Starting migration: complaints table');
    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        order_id VARCHAR(50),
        problem_type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Migration successful: complaints table created.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
