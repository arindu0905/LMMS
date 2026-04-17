const supabase = require('../config/supabaseClient');

// @desc    Get all feedback (used by Admin Dashboard)
// @route   GET api/feedback
// @access  Private
exports.getFeedback = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get feedback by Product ID
// @route   GET api/feedback/product/:productId
// @access  Public
exports.getFeedbackByProduct = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('feedback')
            .select('*')
            .eq('productId', req.params.productId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Add feedback for a product
// @route   POST api/feedback
// @access  Public
exports.addFeedback = async (req, res) => {
    const { productId, customerName, rating, message } = req.body;

    try {
        const { data, error } = await supabase
            .from('feedback')
            .insert([{
                "productId": productId.toString(),
                "customerName": customerName,
                "rating": rating,
                "message": message
            }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error("Feedback Insert Error:", err);
        res.status(500).json({ msg: 'Server error', details: err.message || err });
    }
};
