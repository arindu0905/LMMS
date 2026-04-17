import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShoppingCart, Plus, CheckCircle, XCircle, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../context/CurrencyContext';

const PurchaseOrders = () => {
    const { formatPrice, currency } = useCurrency();
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    
    const [formData, setFormData] = useState({
        supplier_id: '',
        product_id: '',
        quantity: '',
        expected_delivery_date: '',
        total_cost: ''
    });

    useEffect(() => {
        fetchOrders();
        fetchDependencies();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/purchase-orders');
            setOrders(res.data);
        } catch (err) {
            console.error('Error fetching orders', err);
        }
    };

    const fetchDependencies = async () => {
        try {
            const [supRes, prodRes] = await Promise.all([
                api.get('/suppliers'),
                api.get('/inventory')
            ]);
            setSuppliers(supRes.data);
            setProducts(prodRes.data);
        } catch (err) {
            console.error('Error fetching dependencies', err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/purchase-orders', formData);
            setShowModal(false);
            setFormData({ supplier_id: '', product_id: '', quantity: '', expected_delivery_date: '', total_cost: '' });
            fetchOrders();
        } catch (err) {
            console.error('Error creating order', err);
        }
    };

    const updateOrderStatus = async (order, status) => {
        try {
            await api.put(`/purchase-orders/${order.id}/status`, { status });
            
            if (status === 'Received') {
                const productName = order.products?.name || 'Unknown Item';
                localStorage.setItem('pendingInventoryToast', JSON.stringify({
                    quantity: order.quantity,
                    productName: productName
                }));
            }
            
            fetchOrders();
        } catch (err) {
            console.error('Error updating status', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Purchase Orders</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/30"
                >
                    <Plus size={20} />
                    Create Reorder
                </button>
            </div>

            <div className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-[#0F111A] text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Order Details</th>
                                <th className="px-6 py-4">Supplier</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4">Timeline</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#1E202C]">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                        No purchase orders found.
                                    </td>
                                </tr>
                            ) : orders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{order.products?.name}</p>
                                                <p className="text-xs text-slate-500">Qty: {order.quantity} | Cost: {formatPrice(order.total_cost)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-800 dark:text-slate-200">{order.suppliers?.name}</p>
                                        <p className="text-xs text-slate-500">{order.suppliers?.email}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${
                                            order.status === 'Received' ? 'bg-green-100 text-green-700' :
                                            order.status === 'Not Received' ? 'bg-red-100 text-red-700' :
                                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                            'bg-orange-100 text-orange-700'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        <div className="space-y-1">
                                            <p>Ordered: {new Date(order.order_date).toLocaleDateString()}</p>
                                            {order.expected_delivery_date && <p>Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {(order.status === 'Shipped' || order.status === 'Pending') && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => updateOrderStatus(order, 'Received')}
                                                    className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                                                >
                                                    <CheckCircle size={14} /> Received
                                                </button>
                                                <button 
                                                    onClick={() => updateOrderStatus(order, 'Not Received')}
                                                    className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                                                >
                                                    <XCircle size={14} /> Not Received
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-[#161925] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E202C] w-full max-w-md p-6"
                        >
                            <h3 className="text-xl font-bold mb-4 dark:text-white">Create Reorder Request</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
                                    <select 
                                        name="supplier_id" 
                                        value={formData.supplier_id} 
                                        onChange={handleChange} 
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#1E202C] dark:bg-[#0F111A] text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.filter(s => s.contract_status === 'Approved').map(s => (
                                            <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Product</label>
                                    <select 
                                        name="product_id" 
                                        value={formData.product_id} 
                                        onChange={handleChange} 
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#1E202C] dark:bg-[#0F111A] text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value="">Select Product...</option>
                                        {products.map(p => (
                                            <option key={p.id || p._id} value={p.id || p._id}>{p.name} (Stock: {p.stock})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                                        <input 
                                            type="number" 
                                            name="quantity" 
                                            value={formData.quantity} 
                                            onChange={handleChange} 
                                            required min="1"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#1E202C] dark:bg-[#0F111A] text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Cost ({currency})</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            name="total_cost" 
                                            value={formData.total_cost} 
                                            onChange={handleChange} 
                                            required min="0"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#1E202C] dark:bg-[#0F111A] text-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expected Delivery (Optional)</label>
                                    <input 
                                        type="date" 
                                        name="expected_delivery_date" 
                                        value={formData.expected_delivery_date} 
                                        onChange={handleChange} 
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#1E202C] dark:bg-[#0F111A] text-slate-800 dark:text-white"
                                    />
                                </div>
                                
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium"
                                    >
                                        Submit Reorder
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PurchaseOrders;
