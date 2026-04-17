const supabase = require('./config/supabaseClient');

async function testSuppliers() {
    console.log('Testing getSuppliers query...');
    const { data, error } = await supabase
        .from('suppliers')
        .select(`*, profiles:user_id(full_name, email)`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase Error:', error);
    } else {
        console.log('Success. Data length:', data ? data.length : 0);
        console.log('First record:', data && data.length > 0 ? data[0] : null);
    }
}

testSuppliers();
