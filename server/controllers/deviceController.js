const supabase = require('../config/supabaseClient');
const crypto = require('crypto');

exports.getDevicesByCustomer = async (req, res) => {
    try {
        const { data, error } = await supabase.from('devices').select('*').eq('customer_id', req.params.customerId);
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createDevice = async (req, res) => {
    try {
        const { customer_id, model, serial_number, passcode } = req.body;
        const { data, error } = await supabase.from('devices').insert([{ id: crypto.randomUUID(), customer_id, model, serial_number, passcode }]).select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
