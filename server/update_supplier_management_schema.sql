-- Run this in your Supabase SQL Editor to apply the database changes for Supplier Management

-- 1. Add contract_status and user_id to suppliers table
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS contract_status TEXT DEFAULT 'Pending';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);

-- 2. Create purchase_orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    total_cost DECIMAL(10, 2),
    status TEXT DEFAULT 'Pending', -- Pending, Shipped, Received, Cancelled
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS for purchase_orders (optional but good practice)
-- ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable all for authenticated users" ON public.purchase_orders FOR ALL USING (auth.role() = 'authenticated');
