require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Product = require('./server/models/Product');

const CABLE_URL = "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=500";
const WATCH_URL = "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=500";
const IPHONE_URL = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=500";

const updateImages = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to DB");

        const products = await Product.find({});
        let updated = 0;

        for (const product of products) {
            let url = IPHONE_URL;
            const name = product.name.toLowerCase();

            if (name.includes('type c') || name.includes('cable')) {
                url = CABLE_URL;
            } else if (name.includes('abc') || name.includes('watch')) {
                url = WATCH_URL;
            }

            product.imageUrl = url;
            await product.save();
            updated++;
            console.log(`Updated ${product.name} -> ${url.split('photo-')[1].substring(0, 6)}`);
        }

        console.log(`Successfully updated ${updated} products.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateImages();
