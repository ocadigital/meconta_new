import mysql from 'mysql2/promise';

// Connection pool for serverless environment
// We prioritize process.env.DATABASE_URL for security in Vercel
const pool = mysql.createPool(process.env.DATABASE_URL || {
  host: 'easypanel.chatoca.digital',
  port: 33060,
  user: 'contasuser',
  password: 'Guga55727397*',
  database: 'meconta',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;