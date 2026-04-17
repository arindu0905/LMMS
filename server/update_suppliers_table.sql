-- The user's Supabase table seems to be missing the phone column, possibly because they missed copying that specific line or used an older version of the schema.
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS products_supplied TEXT[];
