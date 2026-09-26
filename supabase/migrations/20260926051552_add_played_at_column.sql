/*
# Add played_at column to mark songs that have been played on the live stream

1. Modified Tables
- `music_uploads` — add `played_at` (timestamptz, nullable)
  - When NULL: song is still in the queue, waiting to be played
  - When set: song has been played on the live stream and should leave the queue
  - Chart queries ignore this column — played songs stay on the chart permanently

2. Index
- `idx_music_uploads_played_at` on `played_at` for filtering queue vs played

3. Security
- No policy changes needed; existing RLS policies already allow full CRUD.
*/

ALTER TABLE music_uploads ADD COLUMN IF NOT EXISTS played_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_music_uploads_played_at ON music_uploads (played_at);