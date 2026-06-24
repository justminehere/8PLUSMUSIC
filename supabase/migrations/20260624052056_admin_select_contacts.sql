
-- Allow anon to read contacts (admin dashboard uses a password gate in the UI)
CREATE POLICY "select_contacts_anon" ON contacts FOR SELECT
  TO anon USING (true);
