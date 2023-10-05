const express = require('express');
const router = express.Router();
const mysqlConnection = require('../db/db');

const bcrypt = require('bcrypt');

router.post('/register',async (req, res) => {
  const { user_name, name, password, email } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const query = 'INSERT INTO users (user_name, name, password, email) VALUES (?, ?, ?, ?)';
  const values = [user_name, name, hashedPassword, email];

  mysqlConnection.query(query, values, (error, results, fields) => {
    if (error) {
      console.error('Error saving user to database: ' + error.stack);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    console.log('User saved successfully with ID: ', results.insertId);
    res.status(201).json({ message: 'User created successfully', userId: results.insertId });
  });
});

router.post('/login', async (req, res) => {
  const { user_name, password } = req.body;
  
  const query = 'SELECT * FROM users WHERE user_name = ?';
  mysqlConnection.query(query, [user_name], async (error, results, fields) => {
    if (error) {
      console.error('Error retrieving user from database: ' + error.stack);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    // If the user is not found
    if (results.length === 0) {
      res.status(401).json({ error: 'Username Not Found' });
      return;
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      res.status(200).json({ message: 'Login successful', userId: user.user_id });
    } else {
      res.status(401).json({ error: 'Password Incorrect' });
    }
  });
});

module.exports = router;