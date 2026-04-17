const supabase = require('./config/supabaseClient');

async function testQueryNoUsers() {
    const { data: logs, error } = await supabase
        .from('inventory_logs')
        .select('*, products(name, sku, id)')
        .order('created_at', { ascending: false });

    console.log("Logs:", logs);
    console.log("Error:", error);
}
testQueryNoUsers();
