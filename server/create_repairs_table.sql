-- Run this SQL in your Supabase Dashboard SQL Editor
CREATE TABLE repairs (
  id UUID PRIMARY KEY,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "deviceModel" TEXT NOT NULL,
  "issueDescription" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "estimatedCost" NUMERIC DEFAULT 0,
  "finalCost" NUMERIC DEFAULT 0,
  "receivedBy" UUID,
  "assignedTo" UUID,
  "notes" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
