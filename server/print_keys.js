require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
s.from('products').select('*').limit(1).then(r => {
   console.log("KEYS:", Object.keys(r.data[0]).join(', '));
   process.exit(0);
});
