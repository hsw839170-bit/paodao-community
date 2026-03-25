-- Migration: Add public order mode support
-- Created: 2026-03-25
-- Status: DRAFT - DO NOT RUN IN PRODUCTION WITHOUT REVIEW

/*
PREREQUISITES:
- Backup database before running this migration
- Ensure no ongoing orders during migration window
- Notify users of maintenance window

CHANGES:
1. Add OrderMode enum (PRIVATE, PUBLIC)
2. Modify Order table:
   - Add mode field (default PRIVATE)
   - Make runnerId nullable (for PUBLIC orders before claiming)
   - Add claimDeadline (for PUBLIC orders timeout)
   - Add claimedAt (timestamp when order is claimed)
3. Add indexes for new fields

MANUAL STEPS REQUIRED BEFORE MIGRATION:
1. Set REDIS_URL environment variable for claim locking
2. Configure claim timeout duration (default: 5 minutes)
3. Update application code to handle nullable runnerId
4. Test in staging environment

POST-MIGRATION:
1. Deploy application code that supports new schema
2. Monitor for errors in claim flow
3. Enable public order feature gradually
*/

-- Create OrderMode enum
CREATE TYPE "OrderMode" AS ENUM ('PRIVATE', 'PUBLIC');

-- Add new columns to Order table
ALTER TABLE "Order" 
  ADD COLUMN "mode" "OrderMode" NOT NULL DEFAULT 'PRIVATE',
  ADD COLUMN "claimDeadline" TIMESTAMP(3),
  ADD COLUMN "claimedAt" TIMESTAMP(3);

-- Make runnerId nullable for PUBLIC orders
ALTER TABLE "Order" 
  ALTER COLUMN "runnerId" DROP NOT NULL;

-- Add indexes
CREATE INDEX "Order_mode_idx" ON "Order"("mode");
CREATE INDEX "Order_claimDeadline_idx" ON "Order"("claimDeadline");

-- Migration complete - verify with:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'Order';
