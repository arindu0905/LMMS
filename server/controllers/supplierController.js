const supabase = require('../config/supabaseClient');

// @desc    Get all suppliers
// @route   GET api/suppliers
// @access  Private
exports.getSuppliers = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('suppliers')
            .select(`*, profiles:user_id(fullName, email)`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Add supplier
// @route   POST api/suppliers
// @access  Private
exports.addSupplier = async (req, res) => {
    const { name, contactPerson, phone, email, address, productsSupplied } = req.body;

    // Default productsSupplied to empty array if not array
    let products = Array.isArray(productsSupplied) ? productsSupplied : [];
    if (typeof productsSupplied === 'string') {
        products = productsSupplied.split(',').map(p => p.trim());
    }

    try {
        // Try to find a matching user profile by email to link automatically
        let userId = null;
        if (email) {
            const { data: userMatch } = await supabase.from('profiles').select('id').eq('email', email).single();
            if (userMatch) userId = userMatch.id;
        }

        const { data, error } = await supabase
            .from('suppliers')
            .insert([{
                name,
                contact: contactPerson,
                phone,
                email,
                address,
                products_supplied: products,
                contract_status: 'Pending',
                user_id: userId
            }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Update supplier
// @route   PUT api/suppliers/:id
// @access  Private
exports.updateSupplier = async (req, res) => {
    const { name, contactPerson, phone, email, address, productsSupplied, contract_status } = req.body;
    const { id } = req.params;

    let products = Array.isArray(productsSupplied) ? productsSupplied : [];
    if (typeof productsSupplied === 'string') {
        products = productsSupplied.split(',').map(p => p.trim());
    }

    try {
        const updatePayload = {
            name,
            contact: contactPerson,
            phone,
            email,
            address,
            products_supplied: products
        };
        
        if (contract_status) {
            updatePayload.contract_status = contract_status;
        }

        // Try to find a matching user profile by email if none linked yet
        if (email) {
            const { data: currentSupplier } = await supabase.from('suppliers').select('user_id').eq('id', id).single();
            if (currentSupplier && !currentSupplier.user_id) {
                const { data: userMatch } = await supabase.from('profiles').select('id').eq('email', email).single();
                if (userMatch) updatePayload.user_id = userMatch.id;
            }
        }

        const { data, error } = await supabase
            .from('suppliers')
            .update(updatePayload)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Delete supplier
// @route   DELETE api/suppliers/:id
// @access  Private
exports.deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', id);

        if (error) {
            if (error.code === '23503') {
                return res.status(400).json({ msg: 'Cannot delete supplier because there are linked purchase orders or products. Please remove those relations first.' });
            }
            throw error;
        }

        res.json({ msg: 'Supplier deleted successfully' });
    } catch (err) {
        console.error('Error deleting supplier:', err.message);
        res.status(500).json({ msg: 'Server error', details: err.message });
    }
};
