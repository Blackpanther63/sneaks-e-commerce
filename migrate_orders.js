import pool from './backend/config/db.js';

async function migrate() {
    try {
        await pool.query('ALTER TABLE orders ADD COLUMN address_id INT');
        console.log("Added address_id");
    } catch(e) { console.log(e.message); }
    try {
        await pool.query('ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT "Cash on Delivery"');
        console.log("Added payment_method");
    } catch(e) { console.log(e.message); }
    try {
        await pool.query('ALTER TABLE orders CHANGE price total_price DECIMAL(10,2)');
        console.log("Changed price to total_price");
    } catch(e) { console.log(e.message); }
    try {
        await pool.query('ALTER TABLE orders CHANGE status order_status VARCHAR(50) DEFAULT "Pending"');
        console.log("Changed status to order_status");
    } catch(e) { console.log(e.message); }
    try {
        await pool.query('ALTER TABLE orders CHANGE order_date created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        console.log("Changed order_date to created_at");
    } catch(e) { console.log(e.message); }
    try {
        await pool.query('ALTER TABLE orders ADD COLUMN quantity INT DEFAULT 1;');
        console.log("Added quantity");
    } catch (e) {
        console.log(e.message);
    }
    console.log("Migration complete");
    process.exit(0);
}

migrate();
