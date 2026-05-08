const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();


const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'rk',
    port: 3306,
    dialect: 'mysql',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("MYSQL Connected");
        connection.release();
    } catch (err) {
        console.error("Database connection failed:", err);
    }
})();

module.exports = pool;
