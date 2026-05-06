const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPromotionColumn() {
  console.log('Attempting to add promotion column to products table...');
  
  // Note: Supabase JS client doesn't support ALTER TABLE directly. 
  // We usually do this via the SQL Editor in Supabase dashboard.
  // However, I can try to perform a dummy RPC or just inform the user.
  
  console.log('IMPORTANT: Please run the following SQL in your Supabase SQL Editor:');
  console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS promotion JSONB DEFAULT NULL;');
}

addPromotionColumn();
