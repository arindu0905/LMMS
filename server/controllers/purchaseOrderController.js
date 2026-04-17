const supabase = require('../config/supabaseClient');

// @desc    Get all purchase orders
// @route   GET api/purchase-orders
// @access  Private
exports.getOrders = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`*, suppliers(name, contact, email), products(name, barcode, category)`)
            .order('order_date', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Create a new purchase order
// @route   POST api/purchase-orders
// @access  Private
exports.createOrder = async (req, res) => {
    const { supplier_id, product_id, quantity, expected_delivery_date, total_cost } = req.body;
    try {
        const { data, error } = await supabase
            .from('purchase_orders')
            .insert([{
                supplier_id,
                product_id,
                quantity: parseInt(quantity),
                expected_delivery_date,
                total_cost: parseFloat(total_cost) || 0,
                status: 'Pending',
                created_by: req.user ? req.user.id : null
            }])
            .select();

        if (error) throw error;

        // Fire off email notification asynchronously
        try {
            const { data: supplierData } = await supabase.from('suppliers').select('email, name').eq('id', supplier_id).single();
            const { data: productData } = await supabase.from('products').select('name').eq('id', product_id).single();
            
            if (supplierData && supplierData.email) {
                const { sendPurchaseOrderEmail } = require('../utils/emailService');
                sendPurchaseOrderEmail(supplierData.email, {
                    productName: productData ? productData.name : 'Unknown Product',
                    quantity,
                    expectedDelivery: expected_delivery_date,
                    totalCost: total_cost
                });
            }
        } catch (emailErr) {
            console.error('Failed to trigger email notification:', emailErr);
        }

        res.status(201).json(data[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Update order status
// @route   PUT api/purchase-orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    try {
        // First get the order
        const { data: order } = await supabase.from('purchase_orders').select('*').eq('id', id).single();
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        const { data, error } = await supabase
            .from('purchase_orders')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) throw error;

        // If status changed to Received, increment inventory
        if (status === 'Received' && order.status !== 'Received') {
            const { data: product } = await supabase.from('products').select('*').eq('id', order.product_id).single();
            if (product) {
                const newStock = product.stock + order.quantity;
                await supabase.from('products').update({ stock: newStock }).eq('id', product.id);
                // Insert log
                await supabase.from('inventory_logs').insert([{
                    product_id: product.id,
                    user_id: req.user ? req.user.id : null,
                    action: 'ADDED',
                    quantity_change: order.quantity,
                    previous_stock: product.stock,
                    new_stock: newStock
                }]);
            }
        }

        res.json(data[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
