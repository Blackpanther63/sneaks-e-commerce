import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkAndCreate() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sneakers_db'
    });

    // Check users
    const [usersRows] = await pool.query("SHOW TABLES LIKE 'users'");
    if (usersRows.length === 0) {
      console.log('users table missing');
    }

    // Check addresses
    const [addrRows] = await pool.query("SHOW TABLES LIKE 'addresses'");
    if (addrRows.length === 0) {
      console.log('addresses table missing, creating...');
      await pool.query(`
        CREATE TABLE addresses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          address_line TEXT NOT NULL,
          city VARCHAR(100) NOT NULL,
          state VARCHAR(100) NOT NULL,
          pincode VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('addresses table created');
    } else {
        console.log('addresses table exists');
        const [schema] = await pool.query('DESCRIBE addresses');
        console.table(schema);
    }

    // Check callback_requests
    const [cbRows] = await pool.query("SHOW TABLES LIKE 'callback_requests'");
    if (cbRows.length === 0) {
      console.log('callback_requests table missing, creating...');
      await pool.query(`
        CREATE TABLE callback_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          phone_number VARCHAR(20) NOT NULL,
          status VARCHAR(50) DEFAULT 'Pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('callback_requests table created');
    } else {
        console.log('callback_requests table exists');
        const [schema] = await pool.query('DESCRIBE callback_requests');
        console.table(schema);
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
checkAndCreate();
