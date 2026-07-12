-- Remove single photo_url column from complaints
ALTER TABLE "complaints" DROP COLUMN IF EXISTS "photo_url";

-- Normalized complaint photos table
CREATE TABLE "complaint_photos" (
  "id"            TEXT        NOT NULL,
  "complaint_id"  TEXT        NOT NULL,
  "url"           TEXT        NOT NULL,
  "thumbnail_url" TEXT        NOT NULL,
  "position"      INTEGER     NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "complaint_photos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "complaint_photos_complaint_id_fkey"
    FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE
);

-- Notice expiry scheduling
ALTER TABLE "notices" ADD COLUMN "valid_until" TIMESTAMPTZ;
