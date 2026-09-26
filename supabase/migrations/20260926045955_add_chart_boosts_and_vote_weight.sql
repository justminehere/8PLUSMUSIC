/*
# Add chart boosts table and weight column for period-based charts

1. New Tables
- `chart_boosts` — stores paid boost "likes" that add weight to a song's chart score
  - `id` (uuid, primary key)
  - `upload_id` (uuid, foreign key to music_uploads, ON DELETE CASCADE)
  - `voter_id` (text, per-session ID from localStorage)
  - `tier` (text, 'boost_2' or 'boost_5')
  - `weight` (integer, 50 for boost_2, 100 for boost_5)
  - `amount_cents` (integer, 200 for boost_2, 500 for boost_5)
  - `created_at` (timestamptz)

2. Modified Tables
- `song_votes` — add `weight` column (integer, default 1) so each vote can carry
  a configurable weight for chart scoring. Existing like/dislike votes get weight 1.

3. Security
- Enable RLS on `chart_boosts`.
- Allow anon + authenticated to insert and read (no-sign-in app).
- Allow anon + authenticated to delete their own boosts by voter_id.

4. Indexes
- On `chart_boosts (upload_id)` for counting boosts per song
- On `chart_boosts (created_at)` for period filtering (week/month/year)
- On `song_votes (created_at)` for period filtering
*/

ALTER TABLE song_votes ADD COLUMN IF NOT EXISTS weight integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS chart_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES music_uploads(id) ON DELETE CASCADE,
  voter_id text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('boost_2', 'boost_5')),
  weight integer NOT NULL,
  amount_cents integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chart_boosts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_boosts" ON chart_boosts;
CREATE POLICY "anon_select_boosts" ON chart_boosts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_boosts" ON chart_boosts;
CREATE POLICY "anon_insert_boosts" ON chart_boosts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_boosts" ON chart_boosts;
CREATE POLICY "anon_delete_boosts" ON chart_boosts FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_chart_boosts_upload_id ON chart_boosts (upload_id);
CREATE INDEX IF NOT EXISTS idx_chart_boosts_created_at ON chart_boosts (created_at);
CREATE INDEX IF NOT EXISTS idx_song_votes_created_at ON song_votes (created_at);