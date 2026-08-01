import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Supabase client for CRUD
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

// Direct Postgres connection for table setup
const projectRef = process.env.SUPABASE_URL
  ? process.env.SUPABASE_URL.replace('https://', '').split('.')[0]
  : '';

const pgPool = process.env.SUPABASE_DB_PASSWORD ? new Pool({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
}) : null;

async function initDatabase() {
  if (!pgPool) {
    console.log('No SUPABASE_DB_PASSWORD set — skipping auto table creation');
    return;
  }
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS entries (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pgPool.query(`ALTER TABLE entries ENABLE ROW LEVEL SECURITY;`);
    await pgPool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='entries' AND policyname='Allow public insert') THEN
          CREATE POLICY "Allow public insert" ON entries FOR INSERT WITH CHECK (true);
        END IF;
      END $$;
    `);
    await pgPool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='entries' AND policyname='Allow public select') THEN
          CREATE POLICY "Allow public select" ON entries FOR SELECT USING (true);
        END IF;
      END $$;
    `);
    console.log('Database table initialized successfully');
  } catch (err) {
    console.error('Auto table creation failed:', err.message);
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/entries', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const { data, error } = await supabase
      .from('entries')
      .insert([{ name, email, message }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error creating entry', error: error.message });
  }
});

app.get('/api/entries', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching entries', error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  initDatabase();
});
