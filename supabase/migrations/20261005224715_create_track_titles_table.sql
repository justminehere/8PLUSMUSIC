/*
# Create track_titles table for editable EP track names

1. New Tables
- `track_titles`
  - `id` (uuid, primary key)
  - `ep` (text, not null) — EP id from tracks.ts (e.g. 'dachshund.land')
  - `track_index` (int, not null) — position of the track in the EP (0-based)
  - `track_title` (text, not null) — the editable display name for the track
  - `created_at` (timestamptz)
  - Unique constraint on (ep, track_index) so each EP slot has one name.

2. Seed Data
- Inserts the current hardcoded track names from tracks.ts so existing
  names are preserved and editable from the dashboard immediately.

3. Security
- Enable RLS on `track_titles`.
- Allow anon + authenticated CRUD (single-tenant, no auth, public data).
*/

CREATE TABLE IF NOT EXISTS track_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ep text NOT NULL,
  track_index int NOT NULL,
  track_title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (ep, track_index)
);

ALTER TABLE track_titles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_track_titles" ON track_titles;
CREATE POLICY "anon_select_track_titles"
ON track_titles FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_track_titles" ON track_titles;
CREATE POLICY "anon_insert_track_titles"
ON track_titles FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_track_titles" ON track_titles;
CREATE POLICY "anon_update_track_titles"
ON track_titles FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_track_titles" ON track_titles;
CREATE POLICY "anon_delete_track_titles"
ON track_titles FOR DELETE
TO anon, authenticated USING (true);

-- Seed current track names (matched to tracks.ts)
INSERT INTO track_titles (ep, track_index, track_title) VALUES
  ('dachshund.land', 0, 'Little Longer One'),
  ('dachshund.land', 1, 'Lullaby'),
  ('dachshund.land', 2, 'My little longer Sister'),
  ('dachshund.land', 3, 'I FOUND THE BEAT'),
  ('dachshund.land', 4, 'Music loves me back'),
  ('dachshund.land', 5, 'Reggae in my Paws'),
  ('dachshund.land', 6, 'Jazz in my Heart'),
  ('dachshund.land-ep-2', 0, 'Date Nights'),
  ('dachshund.land-ep-2', 1, 'Littlelongerone out in the streets'),
  ('dachshund.land-ep-2', 2, 'Night out of town'),
  ('dachshund.land-ep-2', 3, 'RAP music around the fire'),
  ('dachshund.land-ep-2', 4, 'The crew'),
  ('bunny.land', 0, 'Launch Song 1'),
  ('bunny.land', 1, 'Launch Song 2'),
  ('bunny.land', 2, 'Launch Song 4'),
  ('bunny.land', 3, 'Launch Song 6'),
  ('bunny.land', 4, 'Greeting Song'),
  ('bunny.land', 5, 'Greeting Song 2'),
  ('bunny.land', 6, 'Reggae Greeting Song'),
  ('bunny.land', 7, 'Fue Noir Greeting Song'),
  ('bunny.land', 8, 'Bunny.land Voice Song')
ON CONFLICT (ep, track_index) DO NOTHING;