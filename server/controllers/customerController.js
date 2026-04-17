const supabase = require('../config/supabaseClient');
const crypto = require('crypto');

exports.getCustomers = async (req, res) => {
    try {
        const { data, error } = await supabase.from('customers').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createCustomer = async (req, res) => {
    try {
        const { name, phone, email } = req.body;
        const { data, error } = await supabase
            .from('customers')
            .insert([{ id: require('crypto').randomUUID(), name, phone, email: email || null }])
            .select();
        if (error) {
            console.error("Supabase error (createCustomer):", error);
            return res.status(500).json({ error: error.message || error.details });
        }
        res.status(201).json(data[0]);
    } catch (err) {
        console.error("Server error (createCustomer):", err);
        res.status(500).json({ error: err.message });
    }
};
