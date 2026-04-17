import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
    DollarSign, Package, ShoppingCart, Users, TrendingUp,
    Smartphone, AlertTriangle, CheckCircle, Scan, History,
    ShoppingBag, Settings, UserPlus, Clock, ArrowRight, Edit2, Star,
    Wrench, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../context/CurrencyContext';
import { supabase } from '../supabaseClient';
import clsx from 'clsx';

const StatCard = ({ title, value, iconType, delay, subtitle, badgeText, badgeColor }) => {

    // Config based on iconType
    const config = {
        sales: {
            icon: DollarSign,
            iconBg: 'bg-blue-600/20 text-blue-500',
            borderGlow: 'before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:bg-blue-600 before:shadow-[0_0_15px_rgba(37,99,235,0.8)]'
        },
        repairs: {
            icon: Smartphone,
            iconBg: 'bg-cyan-600/20 text-cyan-500',
            borderGlow: 'before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:bg-cyan-500 before:shadow-[0_0_15px_rgba(6,182,212,0.8)]'
        },
        alerts: {
            icon: AlertTriangle,
            iconBg: 'bg-orange-600/20 text-orange-500',
            borderGlow: 'before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:bg-orange-500 before:shadow-[0_0_15px_rgba(249,115,22,0.8)]'
        },
        fulfilled: {
            icon: CheckCircle,
            iconBg: 'bg-purple-600/20 text-purple-500',
            borderGlow: 'before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:bg-purple-500 before:shadow-[0_0_15px_rgba(168,85,247,0.8)]'
        }
    }[iconType];

    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay * 0.1 }}
            className={`bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-2xl p-5 relative overflow-hidden group ${config.borderGlow}`}
        >
            <div className="flex items-start justify-between mb-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.iconBg}`}>
                    <Icon size={20} />
                </div>
                {badgeText && (
                    <div className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 ${badgeColor}`}>
                        {iconType === 'sales' && <TrendingUp size={12} />}
                        {iconType === 'fulfilled' && <CheckCircle size={10} />}
                        {badgeText}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
                {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
            </div>
        </motion.div>
    );
};

const statusColors = {
    pending: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', label: 'Pending' },
    'in-progress': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'In Progress' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'Completed' },
    delivered: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', label: 'Delivered' },
};

const Dashboard = () => {
    const [stats, setStats] = useState({
        dailySales: 0,
        pendingRepairsCount: 0,
        stockAlertsCount: 0,
        fulfilledTodayCount: 0,
        paymentMethods: { cash: 0, card: 0, online: 0 },
        recentSales: [],
        recentFeedback: []
    });
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState(null);
    const { formatPrice } = useCurrency();

    // Technician popup state
    const [showTechPopup, setShowTechPopup] = useState(false);
    const [assignedRepairs, setAssignedRepairs] = useState([]);
    const [techPopupLoading, setTechPopupLoading] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        let parsedUser = null;
        if (userStr) {
            parsedUser = JSON.parse(userStr);
            setUser(parsedUser);
        }

        fetchStats();

        // Show technician popup every login (always on fresh page load)
        const role = (parsedUser?.role || '').toLowerCase();
        if (role === 'technician') {
            fetchAssignedRepairs();
        }

        // Subscribe to real-time sales updates
        const salesSubscription = supabase
            .channel('public:sales')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'sales' },
                (payload) => {
                    console.log('New sale detected in realtime!', payload);
                    fetchStats();
                    setToastMessage('Live Update: New sale recorded!');
                    setTimeout(() => setToastMessage(null), 4000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(salesSubscription);
        };
    }, []);

    const fetchAssignedRepairs = async () => {
        setTechPopupLoading(true);
        try {
            const res = await api.get('/repairs/my-assigned');
            setAssignedRepairs(res.data || []);
            setShowTechPopup(true);
        } catch (err) {
            console.error('Error fetching assigned repairs for popup:', err);
        } finally {
            setTechPopupLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/dashboard');
            setStats(res.data);

            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setLoading(false);
        }
    };

    if (loading) return <div className="text-slate-500 dark:text-slate-400 flex justify-center py-20">Loading dashboard...</div>;

    const userRole = (user?.role || '').toLowerCase();
    const isAdmin = userRole === 'admin';
    const isTech = userRole === 'technician';
    const isSales = userRole === 'sales';
    const isInv = userRole.includes('inventory');

    const canViewSales = isAdmin || isSales;
    const canViewRepairs = isAdmin || isTech;
    const canViewInventory = isAdmin || isInv;

    return (
        <div className="space-y-6">
            <div className={`grid grid-cols-1 md:grid-cols-2 ${canViewSales ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6`}>
                {canViewSales && (
                    <StatCard
                        title="Daily Sales"
                        value={formatPrice(stats.dailySales)}
                        iconType="sales"
                        delay={0}
                        badgeText="Today"
                        badgeColor="text-emerald-400 bg-emerald-400/10"
                    />
                )}
                {canViewRepairs && (
                    <StatCard
                        title="Pending Repairs"
                        value={`${stats.pendingRepairsCount || 0} Devices`}
                        iconType="repairs"
                        delay={1}
                        badgeText="Active"
                        badgeColor="text-slate-700 dark:text-slate-300 bg-slate-700/50"
                    />
                )}
                {canViewInventory && (
                    <StatCard
                        title="Stock Alerts"
                        value={`${stats.stockAlertsCount || 0} Low Items`}
                        iconType="alerts"
                        delay={2}
                        badgeText="Urgent"
                        badgeColor="text-orange-400 bg-orange-400/10"
                    />
                )}
                {canViewSales && (
                    <StatCard
                        title="Fulfilled Today"
                        value={`${stats.fulfilledTodayCount || 0} Sales`}
                        iconType="fulfilled"
                        delay={3}
                        badgeText="Completed"
                        badgeColor="text-emerald-400 bg-emerald-400/10"
                    />
                )}
            </div>

            {/* Payment Methods Breakdown */}
            {canViewSales && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-2xl p-5 flex items-center justify-between"
                    >
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Cash Payments</h3>
                            <p className="text-2xl font-bold text-emerald-400 tracking-tight">{formatPrice(stats.paymentMethods?.cash)}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <DollarSign size={20} />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-2xl p-5 flex items-center justify-between"
                    >
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Card Payments</h3>
                            <p className="text-2xl font-bold text-blue-400 tracking-tight">{formatPrice(stats.paymentMethods?.card)}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <DollarSign size={20} />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-2xl p-5 flex items-center justify-between"
                    >
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Online Payments</h3>
                            <p className="text-2xl font-bold text-purple-400 tracking-tight">{formatPrice(stats.paymentMethods?.online)}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                            <DollarSign size={20} />
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    {/* Quick Sale Terminal */}
                    {canViewSales && (
                        <div className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Quick Sale Terminal</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">Enter IMEI, product name, or scan barcode to start a new transaction instantly.</p>

                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Scan className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Scan or type item details..."
                                        className="w-full bg-white text-slate-900 font-medium rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                                    />
                                </div>
                                <button className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-blue-600/20 whitespace-nowrap">
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Active Repair Queue */}
                    {canViewRepairs && (
                        <div className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Repair Queue</h2>
                                <button className="text-blue-500 hover:text-blue-400 text-sm font-medium flex items-center gap-1 transition-colors">
                                    View All <ArrowRight size={14} />
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-[#1E202C] text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="pb-4 font-medium">Device</th>
                                            <th className="pb-4 font-medium">Issue</th>
                                            <th className="pb-4 font-medium">Client</th>
                                            <th className="pb-4 font-medium">Status</th>
                                            <th className="pb-4 font-medium">ETA</th>
                                            <th className="pb-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        <tr className="border-b border-slate-200 dark:border-[#1E202C] hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-white/5 transition-colors">
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-200 dark:bg-[#1E202C] flex items-center justify-center text-slate-500 dark:text-slate-400">
                                                        <Smartphone size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-200">iPhone 14 Pro</p>
                                                        <p className="text-xs text-slate-500 font-mono">IMEI: 459...203</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-slate-500 dark:text-slate-400">Cracked OLED Screen</td>
                                            <td className="py-4 text-slate-700 dark:text-slate-300">Marcus Chen</td>
                                            <td className="py-4">
                                                <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded uppercase tracking-wider">In Progress</span>
                                            </td>
                                            <td className="py-4 text-slate-500 dark:text-slate-400 font-mono">2h 15m</td>
                                            <td className="py-4 text-right">
                                                <button className="text-blue-500 hover:text-blue-400 transition-colors" title="Edit Repair">
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-white/5 transition-colors">
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-200 dark:bg-[#1E202C] flex items-center justify-center text-slate-500 dark:text-slate-400">
                                                        <Smartphone size={16} className="rotate-90" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-200">iPad Air Gen 5</p>
                                                        <p className="text-xs text-slate-500 font-mono">IMEI: 122...884</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-slate-500 dark:text-slate-400">Charging Port Repair</td>
                                            <td className="py-4 text-slate-700 dark:text-slate-300">Lara Watson</td>
                                            <td className="py-4">
                                                <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded uppercase tracking-wider">Awaiting Parts</span>
                                            </td>
                                            <td className="py-4 text-slate-500 dark:text-slate-400 font-mono">2 Days</td>
                                            <td className="py-4 text-right">
                                                <button className="text-blue-500 hover:text-blue-400 transition-colors" title="Edit Repair">
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="xl:col-span-1">
                    <div className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-2xl p-6 h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                            <History size={18} className="text-blue-500" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h2>
                        </div>

                        <div className="flex-1 space-y-6 relative before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-slate-200 dark:bg-[#1E202C]">

                            {canViewSales && stats.recentFeedback && stats.recentFeedback.map(review => (
                                <div key={review.id} className="flex gap-4 relative">
                                    <div className="w-10 h-10 rounded-full border-4 border-[#161925] bg-yellow-500/20 text-yellow-500 flex items-center justify-center relative z-10 shrink-0">
                                        <Star size={14} />
                                    </div>
                                    <div className="pt-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">New Product Review</p>
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={10} className={i < review.rating ? "text-yellow-500 fill-current" : "text-slate-600"} strokeWidth={i < review.rating ? 0 : 2} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{review.customerName} left a {review.rating}-star review: "{review.message}"</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-wider">
                                            {new Date(review.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {canViewSales && stats.recentSales.slice(0, 1).map((sale, index) => (
                                <div key={sale._id || index} className="flex gap-4 relative">
                                    <div className="w-10 h-10 rounded-full border-4 border-[#161925] bg-emerald-500/20 text-emerald-500 flex items-center justify-center relative z-10 shrink-0">
                                        <ShoppingBag size={14} />
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">New Sale Completed</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sale.customerName || 'Walk-in Customer'} bought items for {formatPrice(sale.totalAmount)}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-wider">
                                            {new Date(sale.date || Date.now()).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {canViewRepairs && (
                                <div className="flex gap-4 relative">
                                    <div className="w-10 h-10 rounded-full border-4 border-[#161925] bg-blue-500/20 text-blue-500 flex items-center justify-center relative z-10 shrink-0">
                                        <Settings size={14} />
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Repair Log Updated</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">iPhone 13 display replacement marked as 'Complete'.</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-wider">42 mins ago</p>
                                    </div>
                                </div>
                            )}

                            {canViewInventory && (
                                <div className="flex gap-4 relative">
                                    <div className="w-10 h-10 rounded-full border-4 border-[#161925] bg-orange-500/20 text-orange-500 flex items-center justify-center relative z-10 shrink-0">
                                        <AlertTriangle size={14} />
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Stock Alert</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">iPhone Glass Screen Protectors (Qty: 2) left in stock.</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-wider">1 hour ago</p>
                                    </div>
                                </div>
                            )}

                            {canViewSales && (
                                <div className="flex gap-4 relative">
                                    <div className="w-10 h-10 rounded-full border-4 border-[#161925] bg-slate-700/50 text-slate-500 dark:text-slate-400 flex items-center justify-center relative z-10 shrink-0">
                                        <UserPlus size={14} />
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">New Client Registered</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sarah Jenkins added to CRM database.</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-wider">3 hours ago</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className="w-full mt-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-white/5 rounded-xl transition-colors">
                            Load More History
                        </button>
                    </div>
                </div>

            </div>

            {/* Real-time Toast Notification */}
            {toastMessage && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-600/30 font-bold flex items-center gap-3 z-50"
                >
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    {toastMessage}
                </motion.div>
            )}

            {/* ── Technician Welcome Popup ── */}
            <AnimatePresence>
                {showTechPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowTechPopup(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 px-6 pt-6 pb-8 overflow-hidden">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                <button
                                    onClick={() => setShowTechPopup(false)}
                                    className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Wrench size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Good day,</p>
                                        <h2 className="text-white font-bold text-lg leading-tight">{user?.name || 'Technician'}</h2>
                                    </div>
                                </div>
                                <p className="text-blue-100 text-sm">
                                    {assignedRepairs.length > 0
                                        ? `You have ${assignedRepairs.length} active repair ticket${assignedRepairs.length > 1 ? 's' : ''} assigned to you.`
                                        : 'You have no active repair tickets assigned right now.'}
                                </p>
                            </div>

                            {/* Stat Pills */}
                            {assignedRepairs.length > 0 && (() => {
                                const counts = assignedRepairs.reduce((acc, r) => {
                                    acc[r.status] = (acc[r.status] || 0) + 1;
                                    return acc;
                                }, {});
                                return (
                                    <div className="flex gap-2 px-6 -mt-4 relative z-10 flex-wrap">
                                        {Object.entries(counts).map(([status, count]) => {
                                            const sc = statusColors[status] || statusColors.pending;
                                            return (
                                                <span key={status} className={`inline-flex items-center gap-1.5 ${sc.bg} ${sc.text} border ${sc.border} text-xs font-bold px-3 py-1.5 rounded-full shadow-sm`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                    {count} {sc.label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {/* Repair List */}
                            <div className="px-6 py-4 max-h-64 overflow-y-auto space-y-2 custom-dash-scroll">
                                {techPopupLoading ? (
                                    <p className="text-center text-slate-500 text-sm py-4">Loading your repairs...</p>
                                ) : assignedRepairs.length === 0 ? (
                                    <div className="text-center py-6">
                                        <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">All clear! No pending work.</p>
                                    </div>
                                ) : (
                                    assignedRepairs.map((r) => {
                                        const sc = statusColors[r.status] || statusColors.pending;
                                        return (
                                            <div key={r._id} className="flex items-center gap-3 bg-slate-50 dark:bg-[#0F111A] rounded-xl px-4 py-3 border border-slate-200 dark:border-[#1E202C]">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                                    <Smartphone size={15} className="text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                        {r.devices?.model || r.deviceModel || 'Device'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {r.customers?.name || r.customerName || 'Customer'} &mdash; {r.issueDescription || 'No description'}
                                                    </p>
                                                </div>
                                                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
                                                    {sc.label.toUpperCase()}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-5 pt-3 flex gap-3">
                                <button
                                    onClick={() => setShowTechPopup(false)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-blue-500/20"
                                >
                                    Got it, let's go!
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style>{`
                .custom-dash-scroll::-webkit-scrollbar { width: 5px; }
                .custom-dash-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-dash-scroll::-webkit-scrollbar-thumb { background: #2A2D3A; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default Dashboard;
