-- Make status_history.changed_by nullable so system-generated rows (auto-escalation) have no actor
ALTER TABLE "status_history" ALTER COLUMN "changed_by" DROP NOT NULL;

-- SLA policy matrix: category × priority → threshold_days
CREATE TABLE "sla_policies" (
  "id"             TEXT NOT NULL,
  "category"       "Category" NOT NULL,
  "priority"       "Priority",
  "threshold_days" INTEGER NOT NULL,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sla_policies_category_priority_key" UNIQUE ("category", "priority")
);
