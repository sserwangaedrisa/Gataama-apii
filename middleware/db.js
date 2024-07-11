const mysql = require('mysql');

const db = mysql.createPool({
  connectionLimit: 10,
  connectTimeout: 60 * 60 * 1000,
  acquireTimeout: 60 * 60 * 1000,
  timeout: 60 * 60 * 1000,
  multipleStatements: true,
  supportBigNumbers: true,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB,
});

module.exports = db;
