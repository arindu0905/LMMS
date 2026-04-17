import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Smartphone, Filter, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { supabase } from '../supabaseClient';
import { useCurrency } from '../context/CurrencyContext';

const Payments = () => {
    const { formatPrice } = useCurrency();
    const [filter, setFilter] = useState('all'); // all, cash, card, online
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        fetchSales();

        // Subscribe to real-time sales updates
        const paymentsSubscription = supabase
            .channel('payments_public:sales')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'sales' },
                (payload) => {
                    console.log('New payment detected in realtime!', payload);
                    fetchSales(); // Refresh payment table instantly
                    setToastMessage('Live Update: New payment received!');
                    setTimeout(() => setToastMessage(null), 4000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(paymentsSubscription);
        };
    }, [filter, searchTerm, filterDate]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            let startDate = '';
            let endDate = '';
            if (filterDate) {
                const [year, month, day] = filterDate.split('-');
                const localStart = new Date(year, month - 1, day, 0, 0, 0);
                const localEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
                startDate = localStart.toISOString();
                endDate = localEnd.toISOString();
            }

            const res = await api.get('/payments', {
                params: {
                    method: filter,
                    search: searchTerm,
                    startDate,
                    endDate
                }
            });
            setSalesData(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching payments:', err);
            setLoading(false);
        }
    };

    const filteredSales = salesData; // Logic is now handled by the backend

    const getPaymentIcon = (method) => {
        switch (method) {
            case 'card': return <CreditCard size={18} className="text-blue-500" />;
            case 'online': return <Smartphone size={18} className="text-purple-500" />;
            case 'cash':
            default: return <DollarSign size={18} className="text-emerald-500" />;
        }
    };

    const getPaymentBadge = (method) => {
        switch (method) {
            case 'card': return 'bg-blue-500/10 text-blue-500';
            case 'online': return 'bg-purple-500/10 text-purple-500';
            case 'cash':
            default: return 'bg-emerald-500/10 text-emerald-500';
        }
    };

    if (loading) return <div className="text-slate-500 dark:text-slate-400 py-20 text-center">Loading payments...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] p-4 rounded-2xl">
                <div className="flex gap-2">
                    {['all', 'cash', 'card', 'online'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f
                                ? 'bg-blue-600 text-slate-900 dark:text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-white/5 hover:text-slate-900 dark:text-white'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all w-full sm:w-auto"
                        />
                        {filterDate && (
                            <button 
                                onClick={() => setFilterDate('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                title="Clear date filter"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search customer or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder-slate-500 w-full sm:w-64 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#0F111A]/50 border-b border-slate-200 dark:border-[#1E202C] text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <th className="p-4">Transaction ID</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Method</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-[#1E202C]">
                            {filteredSales.map((sale) => (
                                <tr key={sale.id || sale._id} className="hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-slate-500 dark:text-slate-400">
                                        {(sale.id || sale._id).substring(0, 8).toUpperCase()}
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{sale.customerName || 'Walk-in'}</p>
                                        {sale.customerPhone && <p className="text-xs text-slate-500">{sale.customerPhone}</p>}
                                    </td>
                                    <td className="p-4 text-slate-500 dark:text-slate-400">
                                        {new Date(sale.date || sale.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                                        {formatPrice(sale.totalAmount || 0)}
                                    </td>
                                    <td className="p-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getPaymentBadge(sale.paymentMethod)}`}>
                                            {getPaymentIcon(sale.paymentMethod)}
                                            {sale.paymentMethod || 'cash'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        No transactions found for this payment method.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Real-time Toast Notification */}
            {toastMessage && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/30 font-bold flex items-center gap-3 z-50"
                >
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    {toastMessage}
                </motion.div>
            )}
        </div>
    );
};

export default Payments;
