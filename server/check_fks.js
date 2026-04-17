const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    // We can query information_schema if we have access, but via postgrest maybe not.
    // Instead we'll just query Supabase RPC if one exists, or we can use raw HTTP if needed.
    // Wait, the anon key does not allow querying information_schema. 
    // Is there a service role key? Let's check test-db.js to see how it works.
    console.log("Supabase connected:", !!supabase);
    // Let's just try to fetch a row from tables we suspect to see their columns.
    const tables = ['suppliers', 'purchase_orders', 'inventory_logs', 'sales', 'repairs', 'payments'];
    for (let table of tables) {
        let { error } = await supabase.from(table).select('id').limit(1);
        console.log("Table", table, "error:", error ? error.message : "OK");
    }
}
check();
