import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Edit, Trash2, ClipboardList } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageCheck, X } from 'lucide-react';

const Inventory = () => {
    const { formatPrice } = useCurrency();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [logsData, setLogsData] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logFilter, setLogFilter] = useState({ category: '', action: '', startDate: '', endDate: '' });
    const [liveToast, setLiveToast] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        category: 'mobile',
        price: '',
        costPrice: '',
        stock: '',
        sku: '',
        barcode: '',
        description: ''
    });

    useEffect(() => {
        fetchProducts();

        // Check for pending cross-page toasts
        const pendingToast = localStorage.getItem('pendingInventoryToast');
        if (pendingToast) {
            try {
                const { quantity, productName } = JSON.parse(pendingToast);
                setLiveToast({
                    title: 'New Stock Arrived',
                    message: `${quantity}x ${productName} were just received into inventory!`,
                    time: new Date().toLocaleTimeString()
                });
                setTimeout(() => setLiveToast(null), 6000);
            } catch (e) {}
            localStorage.removeItem('pendingInventoryToast');
        }

        // Subscribing to Supabase Realtime for Inventory Logs
        const channel = supabase
            .channel('public:inventory_logs')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'inventory_logs' },
                async (payload) => {
                    const log = payload.new;
                    if (log.action === 'ADDED') {
                        // Fetch the product name to display in the toast
                        const { data: p } = await supabase.from('products').select('name').eq('id', log.product_id).single();
                        const productName = p ? p.name : 'Unknown Product';
                        
                        setLiveToast({
                            title: 'Live Stock Update',
                            message: `${log.quantity_change}x ${productName} just arrived and was added to inventory!`,
                            time: new Date().toLocaleTimeString()
                        });

                        // Automatically refresh the table data
                        fetchProducts();
                        
                        // Hide after 6 seconds
                        setTimeout(() => setLiveToast(null), 6000);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/inventory');
            setProducts(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching products:', err);
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const res = await api.get('/inventory/logs');
            setLogsData(res.data);
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleViewLogs = () => {
        setShowLogsModal(true);
        setLogFilter({ category: '', action: '', startDate: '', endDate: '' });
        fetchLogs();
    };

    const filteredLogs = logsData.filter(log => {
        const productCategory = log.products?.category || '';
        
        const matchCategory = logFilter.category === '' || productCategory === logFilter.category;
        const matchAction = logFilter.action === '' || log.action === logFilter.action;
        
        const logDateStr = log.created_at.split('T')[0];
        const matchStartDate = logFilter.startDate === '' || logDateStr >= logFilter.startDate;
        const matchEndDate = logFilter.endDate === '' || logDateStr <= logFilter.endDate;

        return matchCategory && matchAction && matchStartDate && matchEndDate;
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/inventory/${editingId}`, formData);
            } else {
                await api.post('/inventory', formData);
            }
            setShowModal(false);
            setEditingId(null);
            fetchProducts();
            setFormData({
                name: '', brand: '', category: 'mobile', price: '', costPrice: '', stock: '', sku: '', barcode: '', description: ''
            });
        } catch (err) {
            console.error('Error saving product:', err);
            alert('Failed to save product');
        }
    };

    const handleEdit = (product) => {
        setEditingId(product._id);
        setFormData({
            name: product.name || '',
            brand: product.brand || '',
            category: product.category || 'mobile',
            price: product.price || '',
            costPrice: product.costPrice || '',
            stock: product.stock || '',
            sku: product.sku || '',
            barcode: product.barcode || '',
            description: product.description || ''
        });
        setShowModal(true);
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData({
            name: '', brand: '', category: 'mobile', price: '', costPrice: '', stock: '', sku: '', barcode: '', warranty_expiry: '', description: ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/inventory/${id}`);
                fetchProducts();
            } catch (err) {
                console.error('Error deleting product', err);
            }
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
                <div className="flex gap-3">
                    <button
                        onClick={handleViewLogs}
                        className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                    >
                        <ClipboardList size={18} />
                        Audit Logs
                    </button>
                    <button
                        onClick={openAddModal}
                        className="bg-primary-600 hover:bg-primary-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Add Product
                    </button>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/40 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-blue-100 bg-slate-100 dark:bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Product Name</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Stock</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map((product) => (
                            <tr key={product._id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-medium text-gray-900">{product.name}</div>
                                        <div className="text-sm text-gray-500">{product.brand} - {product.sku}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 capitalize">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.category === 'mobile' ? 'bg-blue-100 text-blue-700' :
                                        product.category === 'accessory' ? 'bg-purple-100 text-purple-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {product.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`font-medium ${product.stock < 5 ? 'text-red-500' : 'text-green-600'}`}>
                                        {product.stock} Units
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-700">{formatPrice(product.price)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleEdit(product)} className="text-gray-400 hover:text-primary-600 transition-colors">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(product._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-white/50 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">
                            {editingId ? 'Edit Product' : 'Add New Product'}
                        </h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                <input name="brand" value={formData.brand} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors">
                                    <option value="mobile">Mobile Phone</option>
                                    <option value="accessory">Accessory</option>
                                    <option value="part">Spare Part</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                                <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                                <input type="number" name="stock" value={formData.stock} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                                <input name="sku" value={formData.sku} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode / Serial</label>
                                <input name="barcode" value={formData.barcode} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
                            </div>

                            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-slate-900 dark:text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30">
                                    {editingId ? 'Update Product' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Logs Modal */}
            {showLogsModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-white/50 max-w-4xl w-full p-6 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <ClipboardList className="text-primary-600" /> Inventory Audit Logs
                            </h3>
                            <button onClick={() => setShowLogsModal(false)} className="text-gray-400 hover:text-gray-600">Close</button>
                        </div>
                        
                        <div className="flex gap-4 mb-4">
                            <select 
                                value={logFilter.category}
                                onChange={(e) => setLogFilter({...logFilter, category: e.target.value})}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none"
                            >
                                <option value="">All Categories</option>
                                <option value="mobile">Mobile Phone</option>
                                <option value="accessory">Accessory</option>
                                <option value="part">Spare Part</option>
                            </select>
                            <select 
                                value={logFilter.action}
                                onChange={(e) => setLogFilter({...logFilter, action: e.target.value})}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none"
                            >
                                <option value="">All Actions</option>
                                <option value="ADDED">ADDED</option>
                                <option value="UPDATED">UPDATED</option>
                                <option value="SOLD">SOLD</option>
                                <option value="DELETED">DELETED</option>
                            </select>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="date"
                                    value={logFilter.startDate}
                                    title="Start Date"
                                    onChange={(e) => setLogFilter({...logFilter, startDate: e.target.value})}
                                    className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none text-gray-600"
                                />
                                <span className="text-gray-400 text-sm">to</span>
                                <input 
                                    type="date"
                                    value={logFilter.endDate}
                                    title="End Date"
                                    onChange={(e) => setLogFilter({...logFilter, endDate: e.target.value})}
                                    className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none text-gray-600"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-gray-50/50 rounded-lg border border-gray-100 p-2">
                            {loadingLogs ? (
                                <div className="text-center py-8 text-gray-500">Loading logs...</div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 text-gray-600 font-medium sticky top-0 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 border-b">Date</th>
                                            <th className="px-4 py-3 border-b">Action</th>
                                            <th className="px-4 py-3 border-b">Product</th>
                                            <th className="px-4 py-3 border-b">User</th>
                                            <th className="px-4 py-3 border-b text-right">Change</th>
                                            <th className="px-4 py-3 border-b text-right">New Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {filteredLogs.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-6 text-gray-400">No logs found</td></tr>
                                        ) : filteredLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-gray-50/80">
                                                <td className="px-4 py-3 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 flex max-w-max rounded-full text-[10px] font-bold tracking-wider ${
                                                        log.action === 'ADDED' ? 'bg-green-100 text-green-700' :
                                                        log.action === 'SOLD' ? 'bg-blue-100 text-blue-700' :
                                                        log.action === 'UPDATED' ? 'bg-orange-100 text-orange-700' :
                                                        log.action === 'DELETED' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>{log.action}</span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {log.products?.name || 'Deleted Product'}
                                                    {log.products?.sku && <span className="block text-xs text-gray-500">{log.products.sku}</span>}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{log.users?.name || 'System / Admin'}</td>
                                                <td className="px-4 py-3 text-right font-mono">
                                                    <span className={log.quantity_change > 0 ? 'text-green-600' : log.quantity_change < 0 ? 'text-red-600' : 'text-gray-500'}>
                                                        {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-700">{log.new_stock}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Realtime Toast Notification */}
            <AnimatePresence>
                {liveToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-6 right-6 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-2xl rounded-2xl p-4 flex gap-4 items-start max-w-sm"
                    >
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center shrink-0">
                            <PackageCheck className="text-green-600 dark:text-green-400" size={20} />
                        </div>
                        <div className="flex-1 pt-0.5">
                            <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-1 z-50">{liveToast.title}</h4>
                            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{liveToast.message}</p>
                            <span className="text-slate-400 dark:text-slate-500 text-[10px] mt-2 block font-medium">{liveToast.time}</span>
                        </div>
                        <button onClick={() => setLiveToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Inventory;
