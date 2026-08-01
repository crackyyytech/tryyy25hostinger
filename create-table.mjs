import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

console.log('Connecting to:', process.env.SUPABASE_URL);

// Use Supabase's rpc to run raw SQL — requires exec_sql function
// First try inserting to see if table exists
const { error: checkError } = await supabase.from('entries').select('id').limit(1);

if (!checkError) {
  console.log('Table already exists and is accessible!');
  process.exit(0);
}

console.log('Table check error:', checkError.message);
console.log('Attempting to create table via Supabase Management API...');

// Extract project ref from URL
const projectRef = process.env.SUPABASE_URL.replace('https://', '').split('.')[0];
console.log('Project ref:', projectRef);

const sql = `
CREATE TABLE IF NOT EXISTS entries (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='entries' AND policyname='Allow public insert') THEN
    CREATE POLICY "Allow public insert" ON entries FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='entries' AND policyname='Allow public select') THEN
    CREATE POLICY "Allow public select" ON entries FOR SELECT USING (true);
  END IF;
END $$;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUPABASE_API_KEY}`
  },
  body: JSON.stringify({ query: sql })
});

const body = await res.text();
console.log('Status:', res.status);
console.log('Response:', body);

if (res.ok) {
  console.log('Table created successfully!');
} else {
  console.log('Management API failed. You need a personal access token.');
  console.log('Please run setup-database.sql manually in Supabase SQL Editor.');
}
