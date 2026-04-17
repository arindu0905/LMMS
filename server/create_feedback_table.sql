-- 1. Drop the existing table that has the wrong column names
DROP TABLE IF EXISTS public.feedback;

-- 2. Create the exact table the React App is expecting
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "productId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Turn on Row Level Security (RLS) so the API doesn't hide it
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy: Allow anyone to READ the reviews
CREATE POLICY "Enable read access for all users" ON public.feedback
    FOR SELECT USING (true);

-- 5. Create Policy: Allow anyone to INSERT a new review
CREATE POLICY "Enable insert for all users" ON public.feedback
    FOR INSERT WITH CHECK (true);

-- 6. Important: Force the Supabase API to clear its cache and see the new columns instantly!
GRANT ALL ON TABLE public.feedback TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
