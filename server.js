import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myapp_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.json({ message: 'Database connected successfully', rows });
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

app.post('/api/entries', async (req, res) => {
  const { name, email, message } = req.body;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO entries (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
    );
    res.status(201).json({ id: result.insertId, name, email, message });
  } catch (error) {
    res.status(500).json({ message: 'Error creating entry', error: error.message });
  }
});

app.get('/api/entries', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM entries ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching entries', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
