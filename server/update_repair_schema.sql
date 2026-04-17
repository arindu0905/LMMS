-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- set RLS policies if any (we will assume disabled for this standard admin portal)

-- Create devices table
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    serial_number TEXT,
    passcode TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add customer_id and device_id to repairs
ALTER TABLE public.repairs 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES public.devices(id) ON DELETE RESTRICT;

-- Keep old text columns nullable to prevent legacy data loss, but ensure new repairs rely on the foreign keys.
ALTER TABLE public.repairs 
ALTER COLUMN "customerName" DROP NOT NULL,
ALTER COLUMN "customerPhone" DROP NOT NULL,
ALTER COLUMN "deviceModel" DROP NOT NULL;
