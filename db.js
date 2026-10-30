// db.js -- one shared connection pool to MySQL
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Create connection pool with environment variables and sensible defaults
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'gqldemo',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

module.exports = pool;
