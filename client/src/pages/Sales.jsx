import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, ShoppingCart, Plus, Minus, Trash2, Scan, Wrench, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../context/CurrencyContext';

const Sales = () => {
    const { formatPrice } = useCurrency();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [customer, setCustomer] = useState({ name: '', phone: '', paymentMethod: 'cash' });

    // Repair ticket modal
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [repairForm, setRepairForm] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        deviceModel: '',
        issueDescription: '',
        estimatedCost: '',
        notes: '',
    });
    const [technicians, setTechnicians] = useState([]);
    const [assignedTo, setAssignedTo] = useState('');
    const [repairLoading, setRepairLoading] = useState(false);
    const [repairSuccess, setRepairSuccess] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchTechnicians();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/inventory');
            setProducts(res.data);
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const res = await api.get('/auth');
            const techs = (res.data || []).filter(u =>
                (u.role || '').toLowerCase() === 'technician'
            );
            setTechnicians(techs);
        } catch (err) {
            console.error('Error fetching technicians:', err);
        }
    };

    const openRepairModal = () => {
        // Pre-fill from current sale customer info
        setRepairForm(prev => ({
            ...prev,
            customerName: customer.name || '',
            customerPhone: customer.phone || '',
            customerEmail: '',
            deviceModel: '',
            issueDescription: '',
            estimatedCost: '',
            notes: '',
        }));
        setAssignedTo('');
        setRepairSuccess(false);
        setShowRepairModal(true);
    };

    const handleRepairSubmit = async (e) => {
        e.preventDefault();
        setRepairLoading(true);
        try {
            const payload = {
                newCustomerName: repairForm.customerName,
                newCustomerPhone: repairForm.customerPhone,
                newCustomerEmail: repairForm.customerEmail,
                newDeviceModel: repairForm.deviceModel,
                issueDescription: repairForm.issueDescription,
                estimatedCost: Number(repairForm.estimatedCost) || 0,
                notes: repairForm.notes,
                assignedTo: assignedTo || null,
                status: 'pending',
                customer_id: 'new',
                device_id: 'new',
            };
            await api.post('/repairs', payload);
            setRepairSuccess(true);
            setTimeout(() => setShowRepairModal(false), 1800);
        } catch (err) {
            console.error('Repair ticket error:', err);
            alert('Failed to create repair ticket: ' + (err.response?.data?.msg || err.message));
        } finally {
            setRepairLoading(false);
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item._id === product._id);
        if (existingItem) {
            if (existingItem.quantity + 1 > product.stock) return alert('Not enough stock');
            setCart(cart.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item._id !== id));
    };

    const updateQuantity = (id, delta) => {
        setCart(cart.map(item => {
            if (item._id === id) {
                const newQty = item.quantity + delta;
                const product = products.find(p => p._id === id);
                if (newQty < 1) return item;
                if (newQty > product.stock) { alert('Not enough stock'); return item; }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const calculateTotal = () => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return alert('Cart is empty');
        const saleData = {
            products: cart.map(item => ({ product: item._id, quantity: item.quantity, price: item.price })),
            customerName: customer.name,
            customerPhone: customer.phone,
            paymentMethod: customer.paymentMethod
        };
        try {
            await api.post('/sales', saleData);
            alert('Sale completed successfully!');
            setCart([]);
            setCustomer({ name: '', phone: '', paymentMethod: 'cash' });
            fetchProducts();
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Checkout failed');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleBarcodeScan = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const product = products.find(p => p.barcode === barcodeInput || p.sku === barcodeInput);
            if (product) { addToCart(product); setBarcodeInput(''); }
            else { alert('Product not found for barcode: ' + barcodeInput); setBarcodeInput(''); }
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
                {/* Product List */}
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search variant, model, SKU or barcode..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-blue-100 bg-slate-100 dark:bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium text-slate-800"
                            />
                        </div>
                        <div className="relative w-64 group">
                            <Scan className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                            <input
                                type="text"
                                placeholder="Scan Barcode... (Enter)"
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                onKeyDown={handleBarcodeScan}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border-orange-200 bg-orange-50/50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono shadow-sm"
                            />
                        </div>

                    </div>
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredProducts.map(product => (
                            <motion.div
                                whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                                key={product._id}
                                className="bg-white rounded-xl p-3 border border-gray-100 cursor-pointer shadow-sm transition-all"
                                onClick={() => addToCart(product)}
                            >
                                <div className="h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-300">
                                    <Search size={32} />
                                </div>
                                <h3 className="font-bold text-gray-800 truncate">{product.name}</h3>
                                <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-primary-600">{formatPrice(product.price)}</span>
                                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{product.stock} left</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Cart & Checkout */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-slate-100 dark:bg-white/50">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-primary-700">
                            <ShoppingCart size={20} />
                            Current Sale
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <ShoppingCart size={48} className="mb-2 opacity-30" />
                                <p>Cart is empty</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item._id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm text-gray-800">{item.name}</h4>
                                        <p className="text-xs text-gray-500">{formatPrice(item.price)} x {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => updateQuantity(item._id, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Minus size={14} /></button>
                                        <span className="text-sm font-bold w-6 text-center text-gray-700">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item._id, 1)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Plus size={14} /></button>
                                        <button onClick={() => removeFromCart(item._id)} className="p-1 text-red-500 hover:bg-red-50 rounded ml-2"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-slate-100 dark:bg-white/50">
                        <div className="space-y-3 mb-4">
                            <input
                                placeholder="Customer Name"
                                value={customer.name}
                                onChange={e => setCustomer({ ...customer, name: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                            <input
                                placeholder="Customer Phone"
                                value={customer.phone}
                                onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                            <select
                                value={customer.paymentMethod}
                                onChange={e => setCustomer({ ...customer, paymentMethod: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="online">Online Transfer</option>
                            </select>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 font-medium">Total</span>
                            <span className="text-2xl font-extrabold text-primary-600">{formatPrice(calculateTotal())}</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                            className="w-full bg-gradient-to-r from-primary-600 to-sky-500 hover:from-primary-700 hover:to-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/30 transform active:scale-95"
                        >
                            Complete Sale
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Repair Ticket Modal ── */}
            <AnimatePresence>
                {showRepairModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={e => { if (e.target === e.currentTarget) setShowRepairModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 16 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                            className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-[#1E202C] bg-gradient-to-r from-cyan-600 to-blue-600">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Wrench size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-base leading-tight">Raise Repair Ticket</h3>
                                        <p className="text-cyan-100 text-xs">Create a new repair job from this sale</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowRepairModal(false)}
                                    className="text-white/60 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Success State */}
                            <AnimatePresence>
                                {repairSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center py-14 gap-3"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                                            <CheckCircle size={36} className="text-green-500" />
                                        </div>
                                        <p className="font-bold text-slate-800 dark:text-white text-lg">Ticket Created!</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">Repair ticket has been raised successfully.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Form */}
                            {!repairSuccess && (
                                <form onSubmit={handleRepairSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-repair-scroll">
                                    {/* Customer section */}
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Customer Info</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Customer Name *</label>
                                                <input
                                                    required
                                                    value={repairForm.customerName}
                                                    onChange={e => setRepairForm({ ...repairForm, customerName: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                                                    placeholder="e.g. John Silva"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Phone *</label>
                                                <input
                                                    required
                                                    value={repairForm.customerPhone}
                                                    onChange={e => setRepairForm({ ...repairForm, customerPhone: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                                                    placeholder="077xxxxxxx"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Email</label>
                                                <input
                                                    type="email"
                                                    value={repairForm.customerEmail}
                                                    onChange={e => setRepairForm({ ...repairForm, customerEmail: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                                                    placeholder="optional"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Device section */}
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Device & Issue</p>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Device Model *</label>
                                                <input
                                                    required
                                                    value={repairForm.deviceModel}
                                                    onChange={e => setRepairForm({ ...repairForm, deviceModel: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                                                    placeholder="e.g. iPhone 14 Pro, Samsung A54"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Issue Description *</label>
                                                <textarea
                                                    required
                                                    rows={3}
                                                    value={repairForm.issueDescription}
                                                    onChange={e => setRepairForm({ ...repairForm, issueDescription: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm resize-none"
                                                    placeholder="Describe the problem clearly..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assignment & Cost */}
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assignment & Cost</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Assign Technician</label>
                                                <select
                                                    value={assignedTo}
                                                    onChange={e => setAssignedTo(e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                                                >
                                                    <option value="">— Unassigned —</option>
                                                    {technicians.map(t => (
                                                        <option key={t.id} value={t.id}>
                                                            {t.fullName || t.name || t.email}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Est. Cost</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={repairForm.estimatedCost}
                                                    onChange={e => setRepairForm({ ...repairForm, estimatedCost: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Notes</label>
                                                <input
                                                    value={repairForm.notes}
                                                    onChange={e => setRepairForm({ ...repairForm, notes: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                                                    placeholder="Any additional notes..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowRepairModal(false)}
                                            className="flex-1 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors font-medium text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={repairLoading}
                                            className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                                        >
                                            {repairLoading ? (
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Wrench size={15} />
                                            )}
                                            {repairLoading ? 'Creating...' : 'Create Ticket'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-repair-scroll::-webkit-scrollbar { width: 5px; }
                .custom-repair-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-repair-scroll::-webkit-scrollbar-thumb { background: #2A2D3A; border-radius: 10px; }
            `}</style>
        </>
    );
};

export default Sales;
