-- 1. Create inventory_logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL, -- e.g. ADDED, UPDATED, SOLD, DELETED
    quantity_change INT NOT NULL DEFAULT 0,
    previous_stock INT NOT NULL DEFAULT 0,
    new_stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add warranty_expiry and barcode to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS barcode VARCHAR(255);
