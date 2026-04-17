const supabase = require('../config/supabaseClient');
const emailService = require('../utils/emailService');

// @desc    Create new sale
// @route   POST api/sales
// @access  Private
exports.createSale = async (req, res) => {
    const { products, customerName, customerPhone, paymentMethod, customerEmail, cardDetails } = req.body;

    try {
        let totalAmount = 0;

        for (const item of products) {
            const { data: product, error: prodError } = await supabase
                .from('products')
                .select('stock, name, price')
                .eq('id', item.product)
                .single();

            if (prodError || !product) {
                return res.status(404).json({ msg: `Product ${item.product} not found` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ msg: `Insufficient stock for ${product.name}` });
            }

            const { error: updateError } = await supabase
                .from('products')
                .update({ stock: product.stock - item.quantity })
                .eq('id', item.product);

            if (updateError) throw updateError;

            // Log sale to inventory_logs
            await supabase.from('inventory_logs').insert([{
                product_id: item.product,
                user_id: req.user ? req.user.id : null,
                action: 'SOLD',
                quantity_change: -item.quantity,
                previous_stock: product.stock,
                new_stock: product.stock - item.quantity
            }]);

            // Attach product name for billing/invoicing purposes
            item.productName = product.name;

            totalAmount += product.price * item.quantity;
        }

        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert([{
                items: products,
                "totalAmount": totalAmount,
                "customerName": customerName,
                "customerPhone": customerPhone,
                "soldBy": req.user.id || 'admin',
                "paymentMethod": paymentMethod
            }])
            .select();

        if (saleError) throw saleError;

        // Send card transaction email alert if applicable
        if (paymentMethod === 'card' && customerEmail && cardDetails) {
            try {
                await emailService.sendCardTransactionAlert(customerEmail, cardDetails, totalAmount);
            } catch (emailErr) {
                console.error("Failed to send transaction email:", emailErr);
            }
        }

        res.json(sale[0]);

    } catch (err) {
        console.error('Error creating sale:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// @desc    Get all sales
// @route   GET api/sales
// @access  Private
exports.getSales = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get sales report (simple version)
// @route   GET api/sales/report
// @access  Private (Admin/Manager)
exports.getSalesReport = async (req, res) => {
    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select('*');

        if (error) throw error;

        const totalRevenue = sales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
        const totalSales = sales.length;

        res.json({ totalRevenue, totalSales, sales });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
// @desc    Email an invoice to a customer
// @route   POST api/sales/email-invoice
// @access  Private
exports.emailInvoice = async (req, res) => {
    const { toEmail, invoiceData } = req.body;

    if (!toEmail || !invoiceData) {
        return res.status(400).json({ msg: 'toEmail and invoiceData are required' });
    }

    try {
        const result = await emailService.sendInvoiceEmail(toEmail, invoiceData);

        if (result.success) {
            return res.json({
                msg: 'Invoice sent successfully!',
                previewUrl: result.previewUrl || null
            });
        } else {
            return res.status(500).json({ msg: 'Failed to send email', error: result.error });
        }
    } catch (err) {
        console.error('Error in emailInvoice:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};
