import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag, ShoppingCart, Star, ShieldCheck, Truck, Headphones,
    RefreshCw, ChevronRight, ArrowRight, X, Instagram, Facebook, Send,
    Phone, Tablet, Headphones as HeadphonesIcon, Watch, Camera, Cpu,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

/* ─────────────── helpers ─────────────── */
const CATEGORY_ICONS = {
    smartphone: Phone,
    smartphones: Phone,
    phone: Phone,
    mobile: Phone,
    tablet: Tablet,
    tablets: Tablet,
    audio: HeadphonesIcon,
    headphone: HeadphonesIcon,
    headphones: HeadphonesIcon,
    wearable: Watch,
    wearables: Watch,
    watch: Watch,
    camera: Camera,
    cameras: Camera,
    accessory: Cpu,
    accessories: Cpu,
    other: Cpu,
};

const getCategoryIcon = (cat = '') => {
    const key = cat.toLowerCase().trim();
    return CATEGORY_ICONS[key] || Cpu;
};

const inView = {
    hidden: { opacity: 0, y: 36 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

/* ─────────────── Main Component ─────────────── */
const LandingPage = () => {
    const { addToCart } = useCart();
    const { formatPrice } = useCurrency();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [categories, setCategories] = useState(['All']);
    const [email, setEmail] = useState('');

    /* Review modal */
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productReviews, setProductReviews] = useState([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, message: '' });

    /* ── Fetch products ── */
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/inventory');
                const data = res.data || [];
                setProducts(data.slice(0, 12));

                /* Build unique categories */
                const cats = ['All', ...new Set(data.map(p => p.category).filter(Boolean).map(c => c.trim()))];
                setCategories(cats);
            } catch (err) {
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    /* ── Filtered products ── */
    const displayed = activeCategory === 'All'
        ? products
        : products.filter(p => (p.category || '').toLowerCase() === activeCategory.toLowerCase());

    /* ── Reviews ── */
    const fetchProductReviews = async (productId) => {
        try {
            const res = await api.get(`/feedback/product/${productId}`);
            setProductReviews(res.data);
        } catch (err) {
            setProductReviews([]);
        }
    };

    const handleProductClick = (product) => {
        setSelectedProduct(product);
        fetchProductReviews(product._id || product.id);
        setShowReviewModal(true);
    };

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/feedback', { ...reviewForm, productId: selectedProduct._id || selectedProduct.id });
            setReviewForm({ customerName: '', rating: 5, message: '' });
            fetchProductReviews(selectedProduct._id || selectedProduct.id);
            alert('Thank you for your review!');
        } catch {
            alert('Failed to submit review.');
        }
    };

    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        if (email) {
            alert(`Thanks for subscribing with ${email}!`);
            setEmail('');
        }
    };

    /* Feature/banner product = most expensive item */
    const featureProduct = products.reduce((best, p) => (!best || p.price > best.price) ? p : best, null);

    return (
        <div className="min-h-screen bg-white font-['Inter',sans-serif] text-gray-900 overflow-x-hidden">

            {/* ══════════════════════════════════════════
                SECTION 1 — HERO (Full-bleed light)
            ══════════════════════════════════════════ */}
            <section className="relative min-h-screen bg-black flex flex-col items-center justify-center text-white overflow-hidden">
                {/* Radial glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)' }} />
                <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full blur-[120px]"
                    style={{ background: 'radial-gradient(circle, rgba(100,120,255,0.15) 0%, transparent 70%)' }} />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-[100px]"
                    style={{ background: 'radial-gradient(circle, rgba(200,100,255,0.10) 0%, transparent 70%)' }} />

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-sm text-white/70 font-medium"
                >
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    New arrivals every week
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center text-6xl sm:text-7xl md:text-8xl font-black leading-[1.05] tracking-tight mb-6 px-4"
                    style={{ letterSpacing: '-0.03em' }}
                >
                    Power On.
                    <br />
                    <span className="text-white/40">Limits Off.</span>
                </motion.h1>

                {/* Sub-headline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.35 }}
                    className="text-white/50 text-lg sm:text-xl max-w-md text-center mb-10 px-4 leading-relaxed"
                >
                    Premium smartphones & accessories. Genuine warranty. Delivered to your door.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.48 }}
                    className="flex flex-col sm:flex-row gap-4 px-4"
                >
                    <a
                        href="#products"
                        className="group px-8 py-4 rounded-full bg-white text-black font-semibold text-base hover:bg-white/90 transition-all shadow-2xl flex items-center gap-2 justify-center"
                    >
                        Shop Now
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                    <a
                        href="#features"
                        className="px-8 py-4 rounded-full border border-white/25 text-white/80 font-semibold text-base hover:border-white/50 hover:text-white hover:bg-white/5 transition-all text-center"
                    >
                        Why Choose Us
                    </a>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 text-xs tracking-widest uppercase"
                >
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                        className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
                    >
                        <div className="w-1 h-2 rounded-full bg-white/30" />
                    </motion.div>
                    Scroll
                </motion.div>
            </section>

            {/* ══════════════════════════════════════════
                SECTION 2 — CATEGORY QUICK-LINKS
            ══════════════════════════════════════════ */}
            <section className="bg-white py-10 px-4 sm:px-8 border-b border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                        {categories.map((cat) => {
                            const Icon = getCategoryIcon(cat);
                            const isActive = cat === activeCategory;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`category-pill flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                                        isActive
                                            ? 'bg-black text-white border-black shadow-md'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon size={15} />
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                SECTION 3 — FEATURED PRODUCTS GRID
            ══════════════════════════════════════════ */}
            <section id="products" className="bg-white py-20 px-4 sm:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Heading */}
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <p className="text-xs font-bold tracking-[0.18em] uppercase text-gray-400 mb-2">Our Collection</p>
                            <h2 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                                {activeCategory === 'All' ? 'Featured Products' : activeCategory}
                            </h2>
                        </div>
                        <a href="#" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-gray-400 hover:text-black transition-colors group">
                            View All <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="rounded-2xl bg-gray-100 animate-pulse aspect-[3/4]" />
                            ))}
                        </div>
                    ) : displayed.length === 0 ? (
                        <div className="text-center py-24 text-gray-400">
                            <ShoppingBag size={40} className="mx-auto mb-4 opacity-40" />
                            <p className="text-lg font-medium">No products in this category yet.</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeCategory}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
                            >
                                {displayed.map((item, idx) => (
                                    <motion.div
                                        key={item._id || item.id}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.45, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
                                        onClick={() => handleProductClick(item)}
                                        className="product-card group relative bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 flex flex-col"
                                    >
                                        {/* Image area */}
                                        <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-800 aspect-square flex items-center justify-center p-6">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="product-card-img w-full h-full object-contain"
                                                />
                                            ) : (
                                                <ShoppingBag size={40} className="text-gray-300" />
                                            )}

                                            {/* Category badge */}
                                            {item.category && (
                                                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wide">
                                                    {item.category}
                                                </div>
                                            )}

                                            {/* Add to cart overlay button */}
                                            <div className="cart-btn-overlay absolute bottom-3 left-3 right-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToCart({
                                                            id: item._id || item.id,
                                                            name: item.name,
                                                            price: item.price,
                                                            imageUrl: item.imageUrl,
                                                            brand: item.brand,
                                                            category: item.category,
                                                        });
                                                    }}
                                                    className="w-full py-2.5 rounded-xl bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                                                >
                                                    <ShoppingCart size={15} />
                                                    Add to Cart
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-4 flex flex-col gap-1 flex-1">
                                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{item.brand || item.supplier || 'Laser Mobile'}</p>
                                            <h3
                                                className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-black transition-colors"
                                                title={item.name}
                                            >
                                                {item.name}
                                            </h3>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={10} fill="#f59e0b" stroke="none" />
                                                ))}
                                                <span className="text-[10px] text-gray-400 ml-1">4.9</span>
                                            </div>
                                            <p className="mt-2 text-base font-black text-gray-900 dark:text-white tracking-tight">{formatPrice(item.price)}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </section>

            {/* ══════════════════════════════════════════
                SECTION 4 — FEATURES (Why Choose Us)
            ══════════════════════════════════════════ */}
            <section id="features" className="bg-gray-50 py-20 px-4 sm:px-8 border-y border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        variants={inView}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        className="text-center mb-14"
                    >
                        <p className="text-xs font-bold tracking-[0.18em] uppercase text-gray-400 mb-3">Why Laser Mobile</p>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                            Built around you.
                        </h2>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { Icon: ShieldCheck, title: 'Official Warranty', desc: '1-year official warranty on every device we sell.' },
                            { Icon: Truck, title: 'Fast Delivery', desc: 'Same-day dispatch on orders placed before 3 PM.' },
                            { Icon: Headphones, title: '24/7 Support', desc: 'Expert technicians on standby whenever you need help.' },
                            { Icon: RefreshCw, title: 'Easy Returns', desc: '14-day hassle-free return policy, no questions asked.' },
                        ].map(({ Icon, title, desc }, i) => (
                            <motion.div
                                key={title}
                                variants={inView}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow"
                            >
                                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-5">
                                    <Icon size={22} className="text-white" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                SECTION 5 — FEATURE/BRAND BANNER
            ══════════════════════════════════════════ */}
            {featureProduct && (
                <section className="bg-black py-24 px-4 sm:px-8 overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            {/* Text side */}
                            <motion.div
                                variants={inView}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.4 }}
                                className="text-white"
                            >
                                <p className="text-xs font-bold tracking-[0.18em] uppercase text-white/40 mb-4">Editor's Pick</p>
                                <h2 className="text-5xl sm:text-6xl font-black leading-tight tracking-tight mb-6" style={{ letterSpacing: '-0.03em' }}>
                                    Designed for those who<br />
                                    <span className="text-white/40">demand more.</span>
                                </h2>
                                <p className="text-white/50 text-base mb-4 max-w-sm leading-relaxed">
                                    {featureProduct.description || 'Experience flagship-grade performance and craftsmanship in every detail.'}
                                </p>
                                <p className="text-3xl font-black text-white mb-8">{formatPrice(featureProduct.price)}</p>
                                <button
                                    onClick={() => handleProductClick(featureProduct)}
                                    className="group px-8 py-4 rounded-full bg-white text-black font-semibold text-base hover:bg-white/90 transition-all shadow-2xl flex items-center gap-2 w-fit"
                                >
                                    View Details
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>

                            {/* Image side */}
                            <motion.div
                                initial={{ opacity: 0, x: 60 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                className="flex items-center justify-center"
                            >
                                <div className="relative w-72 h-72 sm:w-96 sm:h-96">
                                    {/* Glow */}
                                    <div className="absolute inset-0 rounded-full blur-[80px]"
                                        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />
                                    {featureProduct.imageUrl ? (
                                        <img
                                            src={featureProduct.imageUrl}
                                            alt={featureProduct.name}
                                            className="relative w-full h-full object-contain drop-shadow-2xl"
                                        />
                                    ) : (
                                        <div className="relative w-full h-full rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            <ShoppingBag size={64} className="text-white/20" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════════
                SECTION 6 — NEWSLETTER STRIP
            ══════════════════════════════════════════ */}
            <section id="newsletter" className="bg-white py-24 px-4 sm:px-8 border-t border-gray-100">
                <div className="max-w-2xl mx-auto text-center">
                    <motion.div
                        variants={inView}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.5 }}
                    >
                        <p className="text-xs font-bold tracking-[0.18em] uppercase text-gray-400 mb-4">Stay in the loop</p>
                        <h2 className="text-5xl sm:text-6xl font-black tracking-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
                            Keep in touch.
                        </h2>
                        <p className="text-gray-400 text-base mb-10 leading-relaxed">
                            Get the latest arrivals, exclusive deals, and tech news delivered straight to your inbox.
                        </p>

                        <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <input
                                type="email"
                                required
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="newsletter-input flex-1 px-5 py-3.5 rounded-full border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:border-black transition-colors"
                            />
                            <button
                                type="submit"
                                className="px-7 py-3.5 rounded-full bg-black text-white font-semibold text-sm hover:bg-gray-800 transition-all flex items-center gap-2 justify-center whitespace-nowrap"
                            >
                                Subscribe <Send size={14} />
                            </button>
                        </form>
                        <p className="text-gray-400 text-xs mt-4">No spam. Unsubscribe any time.</p>
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                FOOTER
            ══════════════════════════════════════════ */}
            <footer className="bg-black text-white pt-20 pb-10 px-4 sm:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Top grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center gap-2 mb-5">
                                <ShoppingBag size={20} className="text-white" />
                                <span className="text-lg font-black tracking-tight">Laser Mobile</span>
                            </div>
                            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                                Your destination for premium mobile technology. Genuine products, expert support, and unmatched after-sales service.
                            </p>
                            {/* Social */}
                            <div className="flex gap-3 mt-6">
                                {[
                                    { Icon: Instagram, label: 'Instagram' },
                                    { Icon: Facebook, label: 'Facebook' },
                                ].map(({ Icon, label }) => (
                                    <button
                                        key={label}
                                        aria-label={label}
                                        className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all"
                                    >
                                        <Icon size={15} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Link columns */}
                        {[
                            { title: 'Shop', links: ['All Products', 'New Arrivals', 'Accessories', 'Deals'] },
                            { title: 'Support', links: ['FAQ', 'Shipping Policy', 'Returns', 'Contact Us'] },
                            { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Privacy Policy'] },
                        ].map(({ title, links }) => (
                            <div key={title}>
                                <h4 className="font-bold text-sm mb-5 text-white">{title}</h4>
                                <ul className="space-y-3">
                                    {links.map(link => (
                                        <li key={link}>
                                            <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">{link}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Bottom bar */}
                    <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-white/30 text-xs">© 2025 Laser Mobile Shop. All rights reserved.</p>

                        {/* Payment icons */}
                        <div className="flex items-center gap-2">
                            {['VISA', 'MC', 'AMEX'].map(card => (
                                <div
                                    key={card}
                                    className="px-2.5 py-1 rounded bg-white/10 text-white/50 text-[10px] font-bold tracking-wide border border-white/10"
                                >
                                    {card}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>

            {/* ══════════════════════════════════════════
                PRODUCT DETAIL + REVIEW MODAL
            ══════════════════════════════════════════ */}
            <AnimatePresence>
                {showReviewModal && selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[200]"
                        onClick={() => setShowReviewModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 32, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.97 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
                        >
                            {/* Close */}
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                            >
                                <X size={16} />
                            </button>

                            {/* Product info */}
                            <div className="md:w-5/12 bg-gray-50 p-8 flex flex-col border-b md:border-b-0 md:border-r border-gray-100">
                                <div className="flex-1 flex items-center justify-center bg-white rounded-2xl mb-6 min-h-[200px] p-6">
                                    {selectedProduct.imageUrl ? (
                                        <img
                                            src={selectedProduct.imageUrl}
                                            alt={selectedProduct.name}
                                            className="max-h-52 object-contain drop-shadow-lg"
                                        />
                                    ) : (
                                        <ShoppingBag size={56} className="text-gray-200" />
                                    )}
                                </div>
                                {selectedProduct.category && (
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{selectedProduct.category}</span>
                                )}
                                <h2 className="text-xl font-black text-gray-900 mb-1 leading-tight">{selectedProduct.name}</h2>
                                <p className="text-2xl font-black text-black mb-3">{formatPrice(selectedProduct.price)}</p>
                                <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-1">
                                    {selectedProduct.description || 'Premium mobile device featuring cutting-edge specifications and elegant design.'}
                                </p>
                                <button
                                    onClick={() => {
                                        addToCart({
                                            id: selectedProduct._id || selectedProduct.id,
                                            name: selectedProduct.name,
                                            price: selectedProduct.price,
                                            imageUrl: selectedProduct.imageUrl,
                                            brand: selectedProduct.brand,
                                            category: selectedProduct.category,
                                        });
                                        setShowReviewModal(false);
                                    }}
                                    className="w-full py-3.5 rounded-xl bg-black text-white font-bold text-sm hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart size={16} /> Add to Cart
                                </button>
                            </div>

                            {/* Reviews panel */}
                            <div className="md:w-7/12 p-8 overflow-y-auto custom-scrollbar flex flex-col">
                                <h3 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                                    <Star size={18} className="text-yellow-400" fill="#facc15" /> Customer Reviews
                                </h3>

                                <div className="flex-1 space-y-3 mb-6">
                                    {productReviews.length > 0 ? productReviews.map(review => (
                                        <div key={review.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-gray-900 text-sm">{review.customerName}</span>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={11} fill={i < review.rating ? '#f59e0b' : 'none'} stroke={i < review.rating ? 'none' : '#d1d5db'} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 leading-relaxed">{review.message}</p>
                                            <p className="text-xs text-gray-300 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10 text-gray-300 border border-dashed border-gray-200 rounded-xl">
                                            <Star size={28} className="mx-auto mb-2 opacity-40" />
                                            <p className="text-sm font-medium text-gray-400">No reviews yet. Be the first!</p>
                                        </div>
                                    )}
                                </div>

                                {/* Write review */}
                                <div className="border-t border-gray-100 pt-5">
                                    <h4 className="font-bold text-gray-800 text-sm mb-3">Write a Review</h4>
                                    <form onSubmit={submitReview} className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Your Name"
                                            required
                                            value={reviewForm.customerName}
                                            onChange={e => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-gray-50 focus:border-black focus:outline-none transition-colors"
                                        />
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span>Rating:</span>
                                            <input
                                                type="number" min="1" max="5" required
                                                value={reviewForm.rating}
                                                onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                                                className="w-16 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:border-black focus:outline-none transition-colors text-center"
                                            />
                                            <Star size={14} className="text-yellow-400" fill="#facc15" />
                                        </div>
                                        <textarea
                                            placeholder="Share your experience..."
                                            required
                                            value={reviewForm.message}
                                            onChange={e => setReviewForm({ ...reviewForm, message: e.target.value })}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-gray-50 focus:border-black focus:outline-none h-20 resize-none transition-colors"
                                        />
                                        <button
                                            type="submit"
                                            className="w-full py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors"
                                        >
                                            Submit Review
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingPage;
