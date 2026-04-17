const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const bcrypt = require('bcryptjs');

module.exports = async () => {
    try {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('Seeding initial data...');

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            const adminUser = new User({
                name: 'Admin User',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin'
            });

            await adminUser.save();
            console.log('Admin user created: admin@example.com / admin123');

            const crypto = require('crypto');
            const supabase = require('./config/supabaseClient');

            const supabaseProducts = products.map(p => ({
                id: crypto.randomUUID(),
                ...p
            }));

            const { error: seedError } = await supabase.from('products').insert(supabaseProducts);
            if (seedError) {
                console.error("Failed to seed Supabase:", seedError);
            } else {
                console.log('Sample products seeded into Supabase');
            }
        }
    } catch (err) {
        console.error('Seeding error:', err);
    }
};
