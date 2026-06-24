CREATE TABLE track_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ep text NOT NULL,
  track_title text NOT NULL,
  itunes_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (ep, track_title)
);

ALTER TABLE track_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_track_links" ON track_links FOR SELECT TO anon USING (true);
CREATE POLICY "insert_track_links" ON track_links FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "update_track_links" ON track_links FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "delete_track_links" ON track_links FOR DELETE TO anon USING (true);
