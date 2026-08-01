import pkg from 'pg';
const { Client } = pkg;

// Supabase direct postgres connection
const client = new Client({
  host: 'db.lyarwlbuijnkjhkldnte.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Skatpv@2714',
  ssl: { rejectUnauthorized: false }
});

console.log('Connecting to Supabase Postgres...');

await client.connect();
console.log('Connected!');

await client.query(`
  CREATE TABLE IF NOT EXISTS entries (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`);
console.log('Table created!');

await client.query(`ALTER TABLE entries ENABLE ROW LEVEL SECURITY;`);

await client.query(`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='entries' AND policyname='Allow public insert') THEN
      CREATE POLICY "Allow public insert" ON entries FOR INSERT WITH CHECK (true);
    END IF;
  END $$;
`);

await client.query(`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='entries' AND policyname='Allow public select') THEN
      CREATE POLICY "Allow public select" ON entries FOR SELECT USING (true);
    END IF;
  END $$;
`);

console.log('Policies set!');
await client.end();
console.log('Done! Table is ready.');
