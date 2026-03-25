-- AlterTable: Add order claim fields for public order mode
-- Note: This is a draft migration. Run `prisma migrate deploy` after review.

-- Step 1: Add new enum type for OrderMode
CREATE TYPE "OrderMode" AS ENUM ('PRIVATE', 'PUBLIC');

-- Step 2: Add new columns to Order table
ALTER TABLE "Order" 
  ADD COLUMN IF NOT EXISTS "mode" "OrderMode" DEFAULT 'PRIVATE' NOT NULL,
  ADD COLUMN IF NOT EXISTS "claimDeadline" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "claimedBy" TEXT;

-- Step 3: Make runnerId nullable for PUBLIC orders
ALTER TABLE "Order" ALTER COLUMN "runnerId" DROP NOT NULL;

-- Step 4: Add index for new columns
CREATE INDEX IF NOT EXISTS "Order_mode_idx" ON "Order"("mode");
CREATE INDEX IF NOT EXISTS "Order_claimDeadline_idx" ON "Order"("claimDeadline");
