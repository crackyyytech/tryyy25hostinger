-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS entries (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public read/write access (Row Level Security)
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select" ON entries
  FOR SELECT USING (true);
