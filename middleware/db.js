const mysql = require("mysql");
const fs = require("fs");
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
  ssl: {
    ca: fs.readFileSync("/home/alpha/Downloads/ca.pem"),
    rejectUnauthorized: true, // Ensure SSL certificate verification (recommended)
  },
});

// const url = new URL(
//   "mysql://avnadmin:AVNS_XOctUYeC-9u8cYGRMh1@gataama-db-naolketema55-7ac3.f.aivencloud.com:27203/defaultdb"
// );
// const dbConfig = {
//   host: url.hostname,
//   port: url.port,
//   user: url.username,
//   password: url.password,
//   database: url.pathname.substring(1), // Removes leading slash
//   ssl: {
//     ca: fs.readFileSync("/home/alpha/Downloads/ca.pem"),
//     rejectUnauthorized: true, // Ensure SSL certificate verification (recommended)
//   },
// };

// const db = mysql.createPool({
//   connectionLimit: 10,
//   connectTimeout: 60 * 60 * 1000,
//   acquireTimeout: 60 * 60 * 1000,
//   timeout: 60 * 60 * 1000,
//   multipleStatements: true,
//   supportBigNumbers: true,
//   ...dbConfig,
// });

module.exports = db;
