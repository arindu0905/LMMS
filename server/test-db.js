require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

async function test() {
    const { data, error } = await supabase.from('profiles').select('*');
    console.log('Profiles:', data, error);
}
test();
