require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testInsert() {
    const productData = {
        id: crypto.randomUUID(),
        name: 'Test Lightning Cable',
        category: 'accessory',
        price: 20,
        stock: 30,
        supplier: null,
        imageUrl: null,
        warranty_expiry: '2026-05-24',
        barcode: '123433553'
    };
    
    const { data: product, error } = await supabase.from('products').insert([productData]).select();

    if (error) {
        fs.writeFileSync('error_log.json', JSON.stringify(error, null, 2));
    } else {
        fs.writeFileSync('error_log.json', JSON.stringify({ success: "true", data: product }, null, 2));
    }
}
testInsert();
