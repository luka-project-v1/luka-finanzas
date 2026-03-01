-- Add DEFAULT gen_random_uuid() to transfers.id so inserts without explicit id succeed
ALTER TABLE "transfers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
