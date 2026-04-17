import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, FileText, Printer, FileDown, Calendar, User, Plus, Trash2, Calculator, Mail, Send, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useCurrency } from '../context/CurrencyContext';

const Billings = () => {
    const { formatPrice } = useCurrency();
    const [activeTab, setActiveTab] = useState('history'); // 'history' or 'generate'
    const [sales, setSales] = useState([]);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBill, setSelectedBill] = useState(null);
    const [emailTo, setEmailTo] = useState('');
    const [emailSending, setEmailSending] = useState(false);
    const [emailResult, setEmailResult] = useState(null); // { success, message, previewUrl }

    // Form State for Manual Bill Generation
    const [manualBill, setManualBill] = useState({
        customerName: '',
        customerPhone: '',
        soldBy: '',
        paymentMethod: 'cash',
        items: [{ productName: '', quantity: 1, price: 0 }]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [salesRes, usersRes, productsRes] = await Promise.all([
                api.get('/sales'),
                api.get('/auth'),
                api.get('/inventory')
            ]);
            setSales(salesRes.data || []);
            setUsers(usersRes.data || []);
            setProducts(productsRes.data || []);

            // Set default salesperson to the first user or 'admin' 
            // if we have users, usually the logged-in user, but for now just the first one.
            if (usersRes.data && usersRes.data.length > 0) {
                setManualBill(prev => ({ ...prev, soldBy: usersRes.data[0]._id }));
            }
        } catch (err) {
            console.error('Error fetching billing data:', err);
        }
    };

    // Helper functions
    const getSalespersonName = (id) => {
        const user = users.find(u => u._id === id || u.id === id);
        return user ? user.name : (id === 'admin' ? 'Store Admin' : 'Unknown');
    };

    const getProductName = (productId, savedName) => {
        if (savedName) return savedName;
        const product = products.find(p => p._id === productId || p.id === productId);
        return product ? product.name : 'Unknown Product';
    };

    const handlePrint = () => window.print();

    const handleSendInvoiceEmail = async () => {
        if (!emailTo || !emailTo.includes('@')) {
            return setEmailResult({ success: false, message: 'Please enter a valid email address.' });
        }
        setEmailSending(true);
        setEmailResult(null);
        try {
            const invoiceData = {
                invoiceId: selectedBill._id || selectedBill.id,
                customerName: selectedBill.customerName,
                customerPhone: selectedBill.customerPhone,
                date: selectedBill.date || selectedBill.created_at,
                paymentMethod: selectedBill.paymentMethod,
                items: selectedBill.items || [],
                totalAmount: selectedBill.totalAmount,
                soldBy: getSalespersonName(selectedBill.soldBy)
            };
            const res = await api.post('/sales/email-invoice', { toEmail: emailTo, invoiceData });
            setEmailResult({
                success: true,
                message: `Invoice sent to ${emailTo}!`,
                previewUrl: res.data.previewUrl || null
            });
        } catch (err) {
            setEmailResult({
                success: false,
                message: err.response?.data?.msg || err.message || 'Failed to send email.'
            });
        } finally {
            setEmailSending(false);
        }
    };

    // --- History View Functions ---
    const filteredSales = sales.filter(s =>
        (s.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.id || s._id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Generate View Functions ---
    const handleManualItemChange = (index, field, value) => {
        const updatedItems = [...manualBill.items];
        updatedItems[index][field] = field === 'quantity' || field === 'price'
            ? parseFloat(value) || 0
            : value;
        setManualBill({ ...manualBill, items: updatedItems });
    };

    const addManualItem = () => {
        setManualBill({ ...manualBill, items: [...manualBill.items, { productName: '', quantity: 1, price: 0 }] });
    };

    const removeManualItem = (index) => {
        const updatedItems = manualBill.items.filter((_, i) => i !== index);
        setManualBill({ ...manualBill, items: updatedItems });
    };

    const calculateManualTotal = () => {
        return manualBill.items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
    };

    const handleGenerateBill = () => {
        if (!manualBill.customerName) return alert("Please enter Customer Name");
        if (manualBill.items.some(item => !item.productName || item.quantity <= 0 || item.price <= 0)) {
            return alert("Please ensure all items have a description, valid quantity, and price.");
        }

        const generatedBill = {
            _id: `INV-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString(),
            customerName: manualBill.customerName,
            customerPhone: manualBill.customerPhone,
            paymentMethod: manualBill.paymentMethod,
            soldBy: manualBill.soldBy,
            totalAmount: calculateManualTotal(),
            items: manualBill.items
        };

        setSelectedBill(generatedBill);
    };

    return (
        <div className="space-y-6">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #printable-bill, #printable-bill * { visibility: visible; }
                    #printable-bill { position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: white; padding: 0; margin: 0; }
                    .print-hide { display: none !important; }
                }
            `}</style>

            <div className="flex justify-between items-center print-hide">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="text-primary-600" />
                    Billings & Invoices
                </h2>
            </div>

            {/* Custom Tabs */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 p-1 flex w-max print-hide">
                <button
                    onClick={() => setActiveTab('history')}
                    className={clsx(
                        "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
                        activeTab === 'history' ? "bg-white border border-gray-100 shadow-sm text-primary-600" : "text-gray-500 hover:text-gray-700 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-white/50"
                    )}
                >
                    <FileText size={16} /> Invoice History
                </button>
                <button
                    onClick={() => setActiveTab('generate')}
                    className={clsx(
                        "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
                        activeTab === 'generate' ? "bg-white border border-gray-100 shadow-sm text-primary-600" : "text-gray-500 hover:text-gray-700 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-white/50"
                    )}
                >
                    <Calculator size={16} /> Generate Invoice
                </button>
            </div>

            {activeTab === 'history' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 overflow-hidden print-hide">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-100 dark:bg-white/50">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by customer or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-blue-100 bg-slate-100 dark:bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left max-h-[60vh] overflow-y-auto block relative">
                            <thead className="bg-gray-50/80 sticky top-0 text-gray-500 font-medium text-sm">
                                <tr>
                                    <th className="px-6 py-4 border-b border-gray-100 w-1/4">Invoice ID / Date</th>
                                    <th className="px-6 py-4 border-b border-gray-100 w-1/4">Customer</th>
                                    <th className="px-6 py-4 border-b border-gray-100 w-1/6">Amount</th>
                                    <th className="px-6 py-4 border-b border-gray-100 w-1/6">Salesperson</th>
                                    <th className="px-6 py-4 border-b border-gray-100 w-1/6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 w-full table">
                                {filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-gray-400">
                                            No sales records found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale) => (
                                        <tr key={sale._id || sale.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-xs text-gray-900 mb-1 truncate w-40" title={sale._id || sale.id}>
                                                    #{String(sale._id || sale.id).slice(0, 8)}...
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(sale.date || sale.created_at).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{sale.customerName || 'Walk-in'}</div>
                                                {sale.customerPhone && <div className="text-xs text-gray-500">{sale.customerPhone}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-primary-600">{formatPrice(sale.totalAmount)}</div>
                                                <div className="text-xs text-gray-500 capitalize">{sale.paymentMethod || 'Cash'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                    <User size={14} className="text-primary-500" />
                                                    {getSalespersonName(sale.soldBy)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                        setSelectedBill(sale);
                                        setEmailTo('');
                                        setEmailResult(null);
                                    }}
                                                    className="bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-slate-900 dark:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1.5"
                                                >
                                                    <FileDown size={16} />
                                                    View Bill
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {activeTab === 'generate' && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid lg:grid-cols-3 gap-6 print-hide">
                    {/* Form Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer Details */}
                        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Customer Details</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={manualBill.customerName}
                                        onChange={(e) => setManualBill({ ...manualBill, customerName: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-200 focus:border-primary-500 rounded-xl outline-none"
                                        placeholder=""
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={manualBill.customerPhone}
                                        onChange={(e) => setManualBill({ ...manualBill, customerPhone: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-200 focus:border-primary-500 rounded-xl outline-none"
                                        placeholder=""
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Salesperson</label>
                                    <select
                                        value={manualBill.soldBy}
                                        onChange={(e) => setManualBill({ ...manualBill, soldBy: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-200 focus:border-primary-500 rounded-xl outline-none"
                                    >
                                        <option value="admin">Store Admin</option>
                                        {users.map(u => (
                                            <option key={u._id} value={u._id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                    <select
                                        value={manualBill.paymentMethod}
                                        onChange={(e) => setManualBill({ ...manualBill, paymentMethod: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-200 focus:border-primary-500 rounded-xl outline-none"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="online">Online Transfer</option>
                                        <option value="unpaid">Unpaid / Term</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Line Items</h3>
                                <button
                                    onClick={addManualItem}
                                    className="bg-primary-50 text-primary-600 hover:bg-primary-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                >
                                    <Plus size={16} /> Add Item
                                </button>
                            </div>

                            <div className="space-y-3">
                                {manualBill.items.map((item, idx) => (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={idx} className="flex gap-3 items-end">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                                            <input
                                                type="text"
                                                value={item.productName}
                                                onChange={(e) => handleManualItemChange(idx, 'productName', e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 focus:border-primary-500 rounded-xl outline-none text-sm"
                                                placeholder="Service or Product Name"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleManualItemChange(idx, 'quantity', e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 focus:border-primary-500 rounded-xl outline-none text-sm text-center"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.price}
                                                onChange={(e) => handleManualItemChange(idx, 'price', e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 focus:border-primary-500 rounded-xl outline-none text-sm text-right"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeManualItem(idx)}
                                            disabled={manualBill.items.length === 1}
                                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div>
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl shadow-lg p-6 text-gray-800 sticky top-28">
                            <h3 className="font-bold mb-6 text-blue-700 flex items-center gap-2">
                                <Calculator size={20} /> Invoice Summary
                            </h3>

                            <div className="space-y-3 mb-6 opacity-90">
                                {manualBill.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm text-gray-700">
                                        <span className="truncate pr-4 flex-1">{item.productName || 'Unnamed Item'}</span>
                                        <span>{formatPrice(item.quantity * item.price)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-blue-200 pt-4 mb-8">
                                <div className="flex justify-between items-end">
                                    <span className="text-blue-500 text-sm font-medium">Total Amount</span>
                                    <span className="text-3xl font-black text-blue-700">{formatPrice(calculateManualTotal())}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateBill}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <FileText size={18} />
                                Generate Final Bill
                            </button>
                            <p className="text-xs text-center text-blue-400 mt-4 leading-relaxed">
                                This will format the details into a printable invoice without affecting store inventory.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Bill Modal (Used by both History and Generate Tabs) */}
            <AnimatePresence>
                {selectedBill && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 print-hide">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 print-hide">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Printer size={18} className="text-primary-600" /> Print Preview
                                </h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handlePrint}
                                        className="bg-primary-600 text-slate-900 dark:text-white hover:bg-primary-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg shadow-primary-500/30 transition-all font-bold"
                                    >
                                        <Printer size={16} /> Print
                                    </button>
                                    <button
                                        onClick={() => { setSelectedBill(null); setEmailTo(''); setEmailResult(null); }}
                                        className="text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors font-medium text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            {/* Printable Area - Laser Mobile Invoice Template */}
                            <div id="printable-bill" className="flex-1 overflow-y-auto bg-white text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
                                <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>

                                    {/* ── HEADER ── */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '10px' }}>
                                        {/* Left: Logo + Contact */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                {/* Mini SVG Logo */}
                                                <svg width="48" height="36" viewBox="0 0 520 130" xmlns="http://www.w3.org/2000/svg">
                                                    <g transform="translate(10, 0)">
                                                        <rect x="-5" y="40" width="12" height="12" fill="#E85D4E" />
                                                        <rect x="5" y="25" width="10" height="10" fill="#E85D4E" />
                                                        <rect x="25" y="15" width="14" height="14" fill="#E85D4E" />
                                                        <rect x="-8" y="58" width="10" height="10" fill="#E85D4E" />
                                                        <rect x="4" y="68" width="8" height="8" fill="#E85D4E" />
                                                        <rect x="15" y="35" width="16" height="16" fill="#415A9A" />
                                                        <rect x="32" y="50" width="22" height="22" fill="#415A9A" />
                                                        <path d="M 20 60 L 50 25 L 90 95 L 60 130 Z" fill="none" stroke="#E85D4E" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
                                                        <circle cx="75" cy="113" r="4" fill="#E85D4E" />
                                                        <path d="M 15 120 C 45 90, 65 40, 75 0" fill="none" stroke="#ECAB46" strokeWidth="6" strokeLinecap="round" />
                                                        <path d="M 28 125 C 58 95, 78 45, 88 5" fill="none" stroke="#ECAB46" strokeWidth="6" strokeLinecap="round" />
                                                    </g>
                                                    <g transform="translate(105, 74)">
                                                        <text fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="52" fill="#415A9A" letterSpacing="-1">LASER</text>
                                                        <text x="172" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="52" fill="#40434A" letterSpacing="-1">MOBILE</text>
                                                    </g>
                                                    <g transform="translate(108, 103)">
                                                        <text fontFamily="Arial, sans-serif" fontWeight="600" fontSize="18" fill="#40434A" letterSpacing="10">PHONE ARCADE</text>
                                                    </g>
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#444', lineHeight: '1.7' }}>
                                                <div>📍 No. 56, High Level Road, Homagama.</div>
                                                <div>📞 011 2098778 / 075 7950250</div>
                                                <div style={{ color: '#e53e3e', fontWeight: 'bold' }}>Hotline: 0715990499</div>
                                                <div>f K Zone Mobile &nbsp;🌐 kzonemobile.lk</div>
                                                <div>✉ lmphonearcade@gmail.com</div>
                                            </div>
                                        </div>

                                        {/* Right: Invoice Meta */}
                                        <div style={{ textAlign: 'right', fontSize: '12px', minWidth: '200px' }}>
                                            <table style={{ marginLeft: 'auto', borderCollapse: 'collapse' }}>
                                                <tbody>
                                                    <tr><td style={{ paddingRight: '8px', color: '#555' }}>Inv. No</td><td style={{ fontWeight: 'bold' }}>: {(selectedBill._id || selectedBill.id || '').toString().slice(-6).toUpperCase()}</td></tr>
                                                    <tr><td style={{ paddingRight: '8px', color: '#555' }}>Date</td><td style={{ fontWeight: 'bold' }}>: {new Date(selectedBill.date || selectedBill.created_at).toLocaleDateString('en-GB')}</td></tr>
                                                    <tr><td style={{ paddingRight: '8px', color: '#555' }}>Time</td><td style={{ fontWeight: 'bold' }}>: {new Date(selectedBill.date || selectedBill.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td></tr>
                                                    <tr><td style={{ paddingRight: '8px', color: '#555' }}>Pay Type</td><td style={{ fontWeight: 'bold' }}>: {selectedBill.paymentMethod ? selectedBill.paymentMethod.charAt(0).toUpperCase() + selectedBill.paymentMethod.slice(1) : 'Cash'}</td></tr>
                                                    <tr><td style={{ height: '8px' }}></td></tr>
                                                    <tr><td style={{ paddingRight: '8px', color: '#555' }}>Sales Person</td><td style={{ fontWeight: 'bold' }}>: {getSalespersonName(selectedBill.soldBy)}</td></tr>
                                                    <tr><td style={{ paddingRight: '8px', color: '#555' }}>Cashier</td><td style={{ fontWeight: 'bold' }}>: {getSalespersonName(selectedBill.soldBy)}</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* ── CUSTOMER INFO ── */}
                                    <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', fontSize: '12px' }}>
                                        <div><span style={{ color: '#555' }}>Name</span> : <strong>{selectedBill.customerName || 'Walk-in Customer'}</strong></div>
                                        <div><span style={{ color: '#555' }}>Mobile</span> : <strong>{selectedBill.customerPhone || '—'}</strong></div>
                                        <div style={{ flex: 1 }}><span style={{ color: '#555' }}>Address</span> : {selectedBill.customerAddress || ''}</div>
                                    </div>

                                    {/* ── ITEMS TABLE ── */}
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                                        <thead>
                                            <tr style={{ background: '#f0f0f0' }}>
                                                <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', width: '36px' }}>No.</th>
                                                <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left' }}>Item Description</th>
                                                <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center', width: '50px' }}>Qty.</th>
                                                <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', width: '100px' }}>Unit Price</th>
                                                <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', width: '100px' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedBill.items || []).map((item, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', verticalAlign: 'top' }}>{idx + 1}</td>
                                                    <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }}>
                                                        <div style={{ fontWeight: 'bold' }}>{getProductName(item.product, item.productName)}</div>
                                                        {item.warranty && <div style={{ color: '#555', fontSize: '11px' }}>{item.warranty}</div>}
                                                        {item.imei && <div style={{ color: '#555', fontSize: '11px' }}>IMEI/Ser No: {item.imei}</div>}
                                                        {item.remarks && <div style={{ color: '#555', fontSize: '11px' }}>Remarks: {item.remarks}</div>}
                                                    </td>
                                                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', verticalAlign: 'top' }}>{item.quantity}</td>
                                                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', verticalAlign: 'top' }}>{formatPrice(item.price)}</td>
                                                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', verticalAlign: 'top' }}>{formatPrice(item.price * item.quantity)}</td>
                                                </tr>
                                            ))}
                                            {/* Blank filler rows */}
                                            {Array.from({ length: Math.max(0, 4 - (selectedBill.items || []).length) }).map((_, i) => (
                                                <tr key={`empty-${i}`}>
                                                    <td style={{ border: '1px solid #ccc', padding: '14px 8px' }}>&nbsp;</td>
                                                    <td style={{ border: '1px solid #ccc', padding: '14px 8px' }}></td>
                                                    <td style={{ border: '1px solid #ccc', padding: '14px 8px' }}></td>
                                                    <td style={{ border: '1px solid #ccc', padding: '14px 8px' }}></td>
                                                    <td style={{ border: '1px solid #ccc', padding: '14px 8px' }}></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* ── FOOTER ── */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
                                        {/* Left: Disclaimer + Brand logos */}
                                        <div style={{ flex: 1, fontSize: '10px', color: '#444' }}>
                                            <p style={{ marginBottom: '6px' }}>Authorized Dealer for All kind of TRCSL Approval Mobile Phones, Tablets and Accessorise.</p>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                                                <span style={{ color: '#1428A0', fontWeight: 'bold', fontSize: '11px' }}>SAMSUNG</span>
                                                <span style={{ color: '#d4000f', fontWeight: 'bold', fontSize: '11px' }}>Huawei</span>
                                                <span style={{ color: '#555', fontWeight: 'bold', fontSize: '11px' }}>iPhone</span>
                                                <span style={{ color: '#ff6900', fontWeight: 'bold', fontSize: '12px' }}>mi</span>
                                                <span style={{ color: '#1DB954', fontWeight: 'bold', fontSize: '11px' }}>oppo</span>
                                                <span style={{ color: '#415FFF', fontWeight: 'bold', fontSize: '11px' }}>vivo</span>
                                                <span style={{ color: '#0000C8', fontWeight: 'bold', fontSize: '11px' }}>NOKIA</span>
                                            </div>
                                            <p style={{ marginBottom: '16px' }}>Item in the Bill were Checked and Received in Good Condition.</p>
                                            <div style={{ display: 'flex', gap: '60px', marginTop: '12px' }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ borderTop: '1px solid #333', paddingTop: '4px', minWidth: '120px' }}>Customer Signature</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ borderTop: '1px solid #333', paddingTop: '4px', minWidth: '120px' }}>Authorized Signature</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Totals */}
                                        <div style={{ minWidth: '220px', fontSize: '12px' }}>
                                            {[
                                                { label: 'Total Amount', value: formatPrice(selectedBill.totalAmount) },
                                                { label: 'Other Paid Amount', value: formatPrice(selectedBill.totalAmount) },
                                                { label: 'Cash Paid Amount', value: formatPrice(0) },
                                                { label: 'Balance', value: formatPrice(0) },
                                            ].map(({ label, value }) => (
                                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: '4px 0' }}>
                                                    <span style={{ color: '#444' }}>{label}</span>
                                                    <span style={{ fontWeight: label === 'Total Amount' ? 'normal' : 'normal', minWidth: '80px', textAlign: 'right' }}>{value}</span>
                                                </div>
                                            ))}
                                            <div style={{ marginTop: '10px', fontSize: '10px', color: '#333' }}>
                                                ALL ELECTRICAL ITEMS HAVE 06 MONTHS WARRANTY.
                                            </div>
                                            <div style={{ color: '#c00', fontWeight: 'bold', fontSize: '11px' }}>Thank You Come Again...</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Email Invoice Panel */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 print-hide">
                                <div className="flex items-center gap-2 mb-3">
                                    <Mail size={16} className="text-indigo-600" />
                                    <span className="text-sm font-semibold text-gray-800">Send Invoice by Email</span>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        id="invoice-email-input"
                                        value={emailTo}
                                        onChange={(e) => { setEmailTo(e.target.value); setEmailResult(null); }}
                                        placeholder="Enter customer email address..."
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-gray-800 placeholder-gray-400 transition-all"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendInvoiceEmail()}
                                    />
                                    <button
                                        onClick={handleSendInvoiceEmail}
                                        disabled={emailSending}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-md shadow-indigo-500/30 whitespace-nowrap"
                                    >
                                        {emailSending ? (
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                            </svg>
                                        ) : (
                                            <Send size={15} />
                                        )}
                                        {emailSending ? 'Sending...' : 'Send'}
                                    </button>
                                </div>
                                {emailResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`mt-3 flex items-start gap-2 text-sm rounded-xl px-4 py-3 ${emailResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                                    >
                                        {emailResult.success ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
                                        <div>
                                            <span>{emailResult.message}</span>
                                            {emailResult.previewUrl && (
                                                <a href={emailResult.previewUrl} target="_blank" rel="noopener noreferrer"
                                                    className="block mt-1 text-xs underline text-indigo-600 hover:text-indigo-800">
                                                    📬 Preview test email (Ethereal) →
                                                </a>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Billings;
