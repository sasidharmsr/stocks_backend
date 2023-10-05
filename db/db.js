const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password:  process.env.DATABASE_PASSWORD,
  database:  process.env.DATABASE_NAME,
  port:  process.env.DATABASE_PORT
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  
  console.log('connected as id ' + connection.threadId);
});

module.exports = connection;
