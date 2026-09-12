/*
# Create music_uploads table

1. New Tables
- `music_uploads` — stores songs submitted via the music upload page
  - `id` (uuid, primary key)
  - `song_name` (text, not null) — title of the song
  - `song_url` (text, not null) — link to the song (SoundCloud, YouTube, etc.)
  - `artist_name` (text, not null) — name of the artist
  - `instagram_handle` (text, nullable) — optional Instagram handle
  - `owns_song` (boolean, default false) — confirmation that submitter owns rights
  - `is_ai_music` (boolean, default false) — whether the song is AI-generated
  - `ai_type` (text, nullable, check: 'complete' or 'hybrid') — type of AI music
  - `tier` (text, not null, default 'free', check: free/skip_7/skip_15/spot_1) — upload tier
  - `queue_position` (integer, not null) — position in the playback queue
  - `is_paid` (boolean, default false) — whether a paid tier was selected
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `music_uploads`.
- Allow anon + authenticated CRUD because the data is intentionally shared/public (no sign-in app).

3. Indexes
- `idx_music_uploads_queue_position` on `queue_position` for queue ordering
- `idx_music_uploads_created_at` on `created_at DESC` for chronological sorting
*/

CREATE TABLE IF NOT EXISTS music_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_name text NOT NULL,
  song_url text NOT NULL,
  artist_name text NOT NULL,
  instagram_handle text,
  owns_song boolean NOT NULL DEFAULT false,
  is_ai_music boolean NOT NULL DEFAULT false,
  ai_type text CHECK (ai_type IS NULL OR ai_type IN ('complete', 'hybrid')),
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'skip_7', 'skip_15', 'spot_1')),
  queue_position integer NOT NULL,
  is_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE music_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_uploads" ON music_uploads;
CREATE POLICY "anon_select_uploads" ON music_uploads FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_uploads" ON music_uploads;
CREATE POLICY "anon_insert_uploads" ON music_uploads FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_uploads" ON music_uploads;
CREATE POLICY "anon_update_uploads" ON music_uploads FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_uploads" ON music_uploads;
CREATE POLICY "anon_delete_uploads" ON music_uploads FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_music_uploads_queue_position ON music_uploads (queue_position);
CREATE INDEX IF NOT EXISTS idx_music_uploads_created_at ON music_uploads (created_at DESC);
