-- Add createdById as nullable first so we can backfill existing rows.
ALTER TABLE "Expense" ADD COLUMN "createdById" TEXT;

-- Backfill: for expenses added before this change, treat the payer as the creator.
UPDATE "Expense" SET "createdById" = "paidById" WHERE "createdById" IS NULL;

-- Now that every row has a value, enforce NOT NULL.
ALTER TABLE "Expense" ALTER COLUMN "createdById" SET NOT NULL;

-- FK + index, matching paidById's shape.
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Expense_createdById_idx" ON "Expense"("createdById");
