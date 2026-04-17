const supabase = require('./config/supabaseClient');

async function testInsert() {
    // get a product id first
    const { data: prod } = await supabase.from('products').select('id').limit(1);
    if (!prod || prod.length === 0) {
        console.log("No products found.");
        return;
    }
    const productId = prod[0].id;
    console.log("Product ID:", productId);

    const { data, error } = await supabase.from('inventory_logs').insert([{
        product_id: productId,
        user_id: null,
        action: 'ADDED',
        quantity_change: 10,
        previous_stock: 0,
        new_stock: 10
    }]);
    console.log("Insert Data:", data);
    console.log("Insert Error:", error);
}

testInsert();
