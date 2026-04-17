import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, Users,
    MousePointer2, Eye, UserMinus, Activity,
    Image as ImageIcon, MoreHorizontal, Video, Package, CreditCard, Box, PieChart
} from 'lucide-react';
import api from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

const sparklineData = {
    revenue: [10, 20, 15, 25, 22, 30, 28, 35, 30, 40, 38],
    customers: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], // flat line conceptually? The screenshot shows a solid progress/bar
    sessions: [40, 35, 38, 30, 32, 28, 25, 22, 25, 20, 18],
    pageViews: [30, 40, 35, 50, 45, 60, 55, 70, 65, 80, 75], // conceptually a progress bar in the screenshot
    churn: [20, 25, 22, 30, 28, 35, 32, 40, 38, 45, 42],
    activeUsers: [50, 45, 48, 40, 42, 35, 38, 30, 32, 25, 28],
    arpc: [10, 10, 10, 10, 10], // progress bar
    bounceRate: [30, 35, 32, 40, 38, 45, 42, 50, 48, 55, 52]
};

const MetricCard = ({
    title, value,
    trend, trendValue,
    chartData, chartColor,
    icon, iconColor, source,
    isProgressBar, progressValue, progressMax, progressFormatted,
    timeLabel
}) => {
    const isPositive = trend === 'up';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-slate-500 font-medium">{timeLabel || 'Month to date'}</span>
            </div>

            <div className="text-center mb-1">
                <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
                <div className="text-3xl font-bold text-slate-900">{value}</div>
            </div>

            <div className="h-12 w-full mt-2 mb-4 flex items-center justify-center">
                {isProgressBar ? (
                    <div className="w-full">
                        <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
                            <span>{progressValue}</span>
                            <span className="flex items-center gap-1"><span className="text-slate-700 dark:text-slate-300">🎯</span> {progressMax}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${chartColor}`}
                                style={{ width: `${Math.min(100, (parseFloat(String(progressValue).replace(/[^0-9.]/g, '')) / (parseFloat(String(progressMax).replace(/[^0-9.]/g, '')) || 1)) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData.map((val, i) => ({ value: val, index: i }))}>
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={chartColor}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={true}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="flex justify-between items-center mt-auto">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${iconColor} text-slate-900 dark:text-white`}>
                        {icon}
                    </div>
                    {source}
                </div>
                {trendValue && (
                    <div className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trendValue}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const ReportCard = ({ title, icon: Icon, colorClass, defaultImage }) => (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 group cursor-pointer hover:shadow-md transition-shadow">
        <div className="h-32 bg-slate-50 relative overflow-hidden border-b border-slate-100 flex items-center justify-center">
            {defaultImage ? (
                <div className="w-full h-full bg-cover bg-center opacity-80" style={{ backgroundImage: `url(${defaultImage})` }}></div>
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200"></div>
            )}
            <div className={`absolute bottom-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center text-slate-900 dark:text-white shadow-sm ${colorClass}`}>
                <Icon size={16} />
            </div>
        </div>
        <div className="p-4">
            <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        </div>
    </div>
);

const Reports = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{"name":"Steve"}');
    const firstName = user.name ? user.name.split(' ')[0] : 'Steve';
    const [timeFilter, setTimeFilter] = useState('month');

    // Live stats and filters
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { formatPrice } = useCurrency();

    useEffect(() => {
        fetchStats(timeFilter);
    }, [timeFilter]);

    const fetchStats = async (timeframe) => {
        setLoading(true);
        try {
            const res = await api.get(`/dashboard?timeframe=${timeframe}`);
            setStats(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setLoading(false);
        }
    };

    const handleFilterChange = (filter) => {
        setTimeFilter(filter);
    };

    const getTimeLabel = () => {
        switch (timeFilter) {
            case 'day': return 'Today Only';
            case 'year': return 'Year to Date';
            case 'month':
            default: return 'Month to Date';
        }
    };

    // Keep loading text but allow re-renders when data shifts slightly
    if (loading && !stats) return <div className="text-slate-500 dark:text-slate-400 flex py-20 px-8 items-center justify-center min-h-full">Loading real-time reports...</div>;

    return (
        <div className="space-y-8 bg-[#F8FAFC] min-h-full p-8 -m-8 rounded-t-xl text-slate-900">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Good Afternoon, {firstName}!</h1>

                <div className="bg-white rounded-lg p-1 border border-slate-200 inline-flex shadow-sm">
                    <button
                        onClick={() => handleFilterChange('day')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${timeFilter === 'day' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Day
                    </button>
                    <button
                        onClick={() => handleFilterChange('month')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${timeFilter === 'month' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Month
                    </button>
                    <button
                        onClick={() => handleFilterChange('year')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${timeFilter === 'year' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Year
                    </button>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Performance overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total System Revenue"
                        value={formatPrice(stats?.totalRevenue || 0)}
                        trend="up" trendValue={stats?.totalSales > 0 ? "Active" : null}
                        chartData={sparklineData.revenue} chartColor="#10B981"
                        icon={<DollarSign size={10} />} iconColor="bg-blue-600" source="Sales Engine"
                        timeLabel={getTimeLabel()}
                    />
                    <MetricCard
                        title="Total Inventory Value"
                        value={formatPrice(stats?.inventoryValue || 0)}
                        trend="up" trendValue={`${stats?.stockAlertsCount || 0} Low Items`}
                        chartData={sparklineData.sessions} chartColor="#3B82F6"
                        icon={<Package size={10} />} iconColor="bg-sky-500" source="Inventory DB"
                        timeLabel="Current Count"
                    />
                    <MetricCard
                        title="Daily Sales Velocity"
                        value={formatPrice(stats?.dailySales || 0)}
                        trend={stats?.dailySales > 0 ? "up" : "down"} trendValue={`${stats?.fulfilledTodayCount || 0} transactions`}
                        chartData={sparklineData.pageViews} chartColor="#F59E0B"
                        icon={<CreditCard size={10} />} iconColor="bg-orange-500" source="Sales Engine"
                        timeLabel="Today (00:00 - Now)"
                    />
                    <MetricCard
                        title="Cash Payments Volume"
                        value={formatPrice(stats?.paymentMethods?.cash || 0)}
                        trend="up" trendValue="Tracked"
                        isProgressBar={true} progressValue={formatPrice(stats?.paymentMethods?.cash || 0)} progressMax={formatPrice(stats?.totalRevenue > 0 ? stats.totalRevenue : 1000)} chartColor="bg-emerald-500"
                        icon={<DollarSign size={10} />} iconColor="bg-emerald-500" source="Cash Register"
                        timeLabel={getTimeLabel()}
                    />

                    <MetricCard
                        title="Card/POS Payments Volume"
                        value={formatPrice(stats?.paymentMethods?.card || 0)}
                        trend="up" trendValue="Tracked"
                        isProgressBar={true} progressValue={formatPrice(stats?.paymentMethods?.card || 0)} progressMax={formatPrice(stats?.totalRevenue > 0 ? stats.totalRevenue : 1000)} chartColor="bg-blue-500"
                        icon={<CreditCard size={10} />} iconColor="bg-blue-500" source="POS Terminal"
                        timeLabel={getTimeLabel()}
                    />
                    <MetricCard
                        title="Total Gross Sales Count"
                        value={stats?.totalSales || 0}
                        trend="up" trendValue="Growing"
                        chartData={sparklineData.activeUsers} chartColor="#8B5CF6"
                        icon={<PieChart size={10} />} iconColor="bg-purple-500" source="Sales Engine"
                        timeLabel={getTimeLabel()}
                    />
                    <MetricCard
                        title="Pending Repairs Count"
                        value={stats?.pendingRepairsCount || 0}
                        trend={stats?.pendingRepairsCount > 0 ? "down" : "up"} trendValue={stats?.pendingRepairsCount === 0 ? "All Clear" : "Action Needed"}
                        chartData={sparklineData.churn} chartColor="#EF4444"
                        icon={<Box size={10} />} iconColor="bg-red-500" source="Repairs System"
                        timeLabel="Active Queue"
                    />
                    <MetricCard
                        title="Registered System Users"
                        value={stats?.userCount || 0}
                        trend="up" trendValue="Verified"
                        chartData={sparklineData.bounceRate} chartColor="#10B981"
                        icon={<Users size={10} />} iconColor="bg-teal-500" source="Auth Database"
                        timeLabel="Active Scope"
                    />
                </div>
            </div>

            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Recently viewed dashboards and reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ReportCard
                        title="Weekly Performance Databoard"
                        icon={ImageIcon}
                        colorClass="bg-indigo-500"
                    />
                    <ReportCard
                        title="Marketing Databoard"
                        icon={Activity}
                        colorClass="bg-purple-500"
                    />
                    <ReportCard
                        title="Sales Databoard"
                        icon={ImageIcon}
                        colorClass="bg-indigo-500"
                    />
                    <ReportCard
                        title="Marketing performance Loop"
                        icon={Video}
                        colorClass="bg-blue-500"
                    />
                    <ReportCard
                        title="Website Performance Report"
                        icon={Video}
                        colorClass="bg-orange-400"
                    />
                </div>
            </div>
        </div>
    );
};

export default Reports;
