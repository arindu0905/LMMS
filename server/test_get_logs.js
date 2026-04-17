const supabase = require('./config/supabaseClient');

async function testQuery() {
    const { data: logs, error } = await supabase
        .from('inventory_logs')
        .select('*, users(name, email), products(name, sku, id)')
        .order('created_at', { ascending: false });

    console.log("Logs fetched:", logs);
    console.log("Error:", error);
}
testQuery();
