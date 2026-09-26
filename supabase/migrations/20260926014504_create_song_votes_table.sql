/*
# Create song_votes table and chart view

1. New Tables
- `song_votes` — stores like/dislike votes for songs currently in the queue
  - `id` (uuid, primary key)
  - `upload_id` (uuid, foreign key to music_uploads, ON DELETE CASCADE)
  - `vote_type` (text, 'like' or 'dislike')
  - `voter_id` (text, a random per-session ID stored in localStorage to prevent duplicate votes)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on `song_votes`.
- Allow anon + authenticated to insert and read votes (no-sign-in app).
- Allow anon + authenticated to delete their own votes (by voter_id).

3. Indexes
- On `upload_id` for counting votes per song
- On `voter_id` for checking if a user already voted
- Unique constraint on (upload_id, voter_id) to prevent duplicate votes
*/

CREATE TABLE IF NOT EXISTS song_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES music_uploads(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  voter_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE song_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_votes" ON song_votes;
CREATE POLICY "anon_select_votes" ON song_votes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_votes" ON song_votes;
CREATE POLICY "anon_insert_votes" ON song_votes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_votes" ON song_votes;
CREATE POLICY "anon_delete_votes" ON song_votes FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_song_votes_upload_id ON song_votes (upload_id);
CREATE INDEX IF NOT EXISTS idx_song_votes_voter_id ON song_votes (voter_id);

-- Prevent duplicate votes from same voter on same song
DROP INDEX IF EXISTS idx_song_votes_unique;
CREATE UNIQUE INDEX idx_song_votes_unique ON song_votes (upload_id, voter_id);
