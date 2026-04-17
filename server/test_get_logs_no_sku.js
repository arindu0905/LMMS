const supabase = require('./config/supabaseClient');

async function testQueryNoSku() {
    const { data: logs, error } = await supabase
        .from('inventory_logs')
        .select('*, products(name, id)')
        .order('created_at', { ascending: false });

    console.log("Logs:", logs);
    console.log("Error:", error);
}
testQueryNoSku();
