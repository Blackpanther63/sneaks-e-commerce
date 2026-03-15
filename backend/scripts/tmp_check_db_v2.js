import pool from './backend/config/db.js';

async function checkUsersSchema() {
  try {
    const [usersSchema] = await pool.query('DESCRIBE users');
    console.log('Users Table Schema:');
    console.table(usersSchema);

    const [addressesSchema] = await pool.query('DESCRIBE addresses');
    console.log('\nAddresses Table Schema:');
    console.table(addressesSchema);

    process.exit(0);
  } catch (err) {
    console.error('Error checking schema:', err);
    process.exit(1);
  }
}

checkUsersSchema();
