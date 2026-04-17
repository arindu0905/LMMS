import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Truck, CheckCircle, Package, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const SupplierPortal = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            // Suppliers should only see their own orders based on user_id context on backend, 
            // but we fetch all the orders if backend isn't filtering. 
            // In a production app, the backend MUST securely filter.
            const res = await api.get('/purchase-orders');
            
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                // Filter client side as a fallback just in case backend gets everything
                const filtered = res.data.filter(o => o.suppliers?.email === user.email);
                setOrders(filtered);
            } else {
                setOrders(res.data);
            }
        } catch (err) {
            console.error('Error fetching supplier orders', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsShipped = async (id) => {
        try {
            await api.put(`/purchase-orders/${id}/status`, { status: 'Shipped' });
            fetchOrders();
        } catch (err) {
            console.error('Error updating status', err);
        }
    };

    if (loading) return <div className="text-center py-10">Loading orders...</div>;

    const pendingOrders = orders.filter(o => o.status === 'Pending');
    const historyOrders = orders.filter(o => o.status !== 'Pending');

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Supplier Portal</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Active Orders */}
                <div className="bg-white dark:bg-[#161925] border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <AlertCircle className="text-orange-500" size={20} />
                        Action Required (Pending Orders)
                    </h3>
                    <div className="space-y-4">
                        {pendingOrders.length === 0 ? (
                            <p className="text-slate-500 text-sm">No new orders waiting for shipment.</p>
                        ) : pendingOrders.map(order => (
                            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-lg">{order.products?.name}</p>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Qty Needed: {order.quantity}</p>
                                    </div>
                                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Clock size={14} /> Pending
                                    </span>
                                </div>
                                <div className="flex justify-between items-end mt-4">
                                    <div className="text-xs text-slate-500">
                                        <p>Ordered: {new Date(order.order_date).toLocaleDateString()}</p>
                                        {order.expected_delivery_date && <p>Please deliver by: {new Date(order.expected_delivery_date).toLocaleDateString()}</p>}
                                    </div>
                                    <button 
                                        onClick={() => markAsShipped(order.id)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                                    >
                                        <Truck size={16} /> Mark as Shipped
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Order History */}
                <div className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Package className="text-slate-400" size={20} />
                        Order History
                    </h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {historyOrders.length === 0 ? (
                            <p className="text-slate-500 text-sm">No historical orders found.</p>
                        ) : historyOrders.map(order => (
                            <div key={order.id} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl flex justify-between items-center border border-slate-100 dark:border-white/10">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{order.products?.name}</p>
                                    <p className="text-xs text-slate-500">Qty: {order.quantity} • {new Date(order.order_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${
                                        order.status === 'Received' ? 'bg-green-100 text-green-700' :
                                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-200 text-slate-700'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SupplierPortal;
