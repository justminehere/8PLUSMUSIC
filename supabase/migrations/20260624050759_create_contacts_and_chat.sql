
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_contacts" ON contacts FOR INSERT
  TO anon WITH CHECK (true);

CREATE POLICY "select_contacts_admin" ON contacts FOR SELECT
  TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_chat" ON chat_messages FOR INSERT
  TO anon WITH CHECK (true);

CREATE POLICY "select_chat" ON chat_messages FOR SELECT
  TO anon USING (true);
