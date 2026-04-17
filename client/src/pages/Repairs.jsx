import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Wrench, Edit, Trash2, X, Bell, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../context/CurrencyContext';
import api from '../services/api';

const Repairs = () => {
    const { formatPrice } = useCurrency();

    // Current user from localStorage
    const currentUser = (() => {
        try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
    })();
    const userRole = (currentUser.role || '').toLowerCase();
    const isTechnician = userRole === 'technician';
    const canCreate  = userRole === 'admin' || userRole === 'sales';
    const canDelete  = userRole === 'admin';

    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRepair, setCurrentRepair] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Technician notification state
    const [assignedRepairs, setAssignedRepairs] = useState([]);
    const [showAssignedBanner, setShowAssignedBanner] = useState(false);

    // Relational States
    const [customers, setCustomers] = useState([]);
    const [devices, setDevices] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedDevice, setSelectedDevice] = useState('');

    // Fetch repairs
    const fetchRepairs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/repairs');
            setRepairs(res.data);
        } catch (error) {
            console.error('Error fetching repairs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (error) { console.error('Error fetching customers:', error); }
    };

    const fetchDevices = async (customerId) => {
        if (!customerId || customerId === 'new') {
            setDevices([]);
            return;
        }
        try {
            const res = await api.get(`/devices/customer/${customerId}`);
            setDevices(res.data);
        } catch (error) { console.error('Error fetching devices:', error); }
    };

    // Fetch assigned repairs for technician notification
    const fetchAssignedRepairs = async () => {
        if (!isTechnician) return;
        try {
            const res = await api.get('/repairs/my-assigned');
            if (res.data && res.data.length > 0) {
                setAssignedRepairs(res.data);
                setShowAssignedBanner(true);
            }
        } catch (error) {
            console.error('Error fetching assigned repairs:', error);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const res = await api.get('/auth');
            const techs = (res.data || []).filter(u =>
                (u.role || '').toLowerCase() === 'technician'
            );
            setTechnicians(techs);
        } catch (error) { console.error('Error fetching technicians:', error); }
    };

    useEffect(() => {
        fetchRepairs();
        fetchCustomers();
        fetchTechnicians();
        fetchAssignedRepairs();
    }, []);

    useEffect(() => {
        if (selectedCustomer) {
            fetchDevices(selectedCustomer);
        } else {
            setDevices([]);
        }
    }, [selectedCustomer]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this repair ticket?')) return;
        try {
            await api.delete(`/repairs/${id}`);
            setRepairs(repairs.filter(r => r._id !== id));
        } catch (error) {
            console.error('Error deleting repair:', error);
        }
    };

    // Helper: extract technician name from notes string
    const getTechnicianFromNotes = (notes) => {
        if (!notes) return '';
        const match = notes.match(/Technician:\s*([^|]+)/);
        return match ? match[1].trim() : '';
    };

    // Helper: get display notes (without the technician tag)
    const getCleanNotes = (notes) => {
        if (!notes) return '';
        return notes.replace(/\s*\|\s*Technician:[^|]*/g, '').replace(/Technician:[^|]*/g, '').trim().replace(/^\|+\s*/, '').replace(/\s*\|+$/, '');
    };

    const handleSaveRepair = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.estimatedCost = Number(data.estimatedCost) || 0;
        data.finalCost = Number(data.finalCost) || 0;

        try {
            let finalCustomerId = data.customer_id;
            let finalDeviceId = data.device_id;

            if (!isTechnician) {
                if (data.customer_id === 'new') {
                    const custRes = await api.post('/customers', {
                        name: data.newCustomerName,
                        phone: data.newCustomerPhone,
                        email: data.newCustomerEmail || ''
                    });
                    finalCustomerId = custRes.data.id;
                    await fetchCustomers();
                }

                if (data.device_id === 'new') {
                    const devRes = await api.post('/devices', {
                        customer_id: finalCustomerId,
                        model: data.newDeviceModel
                    });
                    finalDeviceId = devRes.data.id;
                }
            }

            // Build payload: technicians only send status/cost fields
            const payload = isTechnician
                ? {
                    status: data.status,
                    estimatedCost: data.estimatedCost,
                    finalCost: data.finalCost,
                    notes: data.notes,
                    // Pass through existing IDs to avoid clearing them
                    customer_id: currentRepair?.customer_id,
                    device_id: currentRepair?.device_id,
                    assignedTo: currentRepair?.assignedTo,
                }
                : {
                    newCustomerName: data.newCustomerName,
                    newCustomerPhone: data.newCustomerPhone,
                    newCustomerEmail: data.newCustomerEmail,
                    newDeviceModel: data.newDeviceModel,
                    customer_id: finalCustomerId,
                    device_id: finalDeviceId,
                    issueDescription: data.issueDescription,
                    status: data.status,
                    estimatedCost: data.estimatedCost,
                    finalCost: data.finalCost,
                    assignedTo: data.assignedTo,
                    notes: data.notes,
                };

            if (currentRepair) {
                await api.put(`/repairs/${currentRepair._id}`, payload);
            } else {
                await api.post('/repairs', payload);
            }

            fetchRepairs();
            if (isTechnician) fetchAssignedRepairs();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving repair:', error);
            alert('Failed to save repair. ' + (error.response?.data?.details || error.response?.data?.error || error.message));
        }
    };

    const statusColors = {
        pending: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        'in-progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        completed: 'bg-green-500/10 text-green-500 border-green-500/20',
        delivered: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
    };

    const filteredRepairs = repairs.filter(repair => {
        const custName = repair.customers?.name || repair.customerName || '';
        const devModel = repair.devices?.model || repair.deviceModel || '';
        const matchesSearch = custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            devModel.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || repair.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Technician Assigned-Repairs Notification Banner */}
            <AnimatePresence>
                {isTechnician && showAssignedBanner && assignedRepairs.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-4 flex gap-4 items-start"
                    >
                        <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Bell size={18} className="text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-blue-400 text-sm mb-1">
                                You have {assignedRepairs.length} active repair ticket{assignedRepairs.length > 1 ? 's' : ''} assigned to you
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {assignedRepairs.map(r => (
                                    <span
                                        key={r._id}
                                        onClick={() => {
                                            setCurrentRepair(r);
                                            setSelectedCustomer(r.customer_id || '');
                                            setSelectedDevice(r.device_id || '');
                                            setIsModalOpen(true);
                                        }}
                                        className="cursor-pointer inline-flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-500/20 transition-colors"
                                    >
                                        <Wrench size={11} />
                                        {r.devices?.model || r.deviceModel || 'Device'} — {r.customers?.name || r.customerName || 'Customer'}
                                        <span className={clsx(
                                            'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border',
                                            statusColors[r.status] || statusColors.pending
                                        )}>
                                            {r.status?.replace('-', ' ').toUpperCase()}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAssignedBanner(false)}
                            className="text-blue-400/60 hover:text-blue-400 transition-colors shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Wrench className="text-blue-500" />
                        Repair Management
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {isTechnician
                            ? 'View and update assigned repair tickets'
                            : 'Manage and track device repair tickets'}
                    </p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => {
                            setCurrentRepair(null);
                            setSelectedCustomer('');
                            setSelectedDevice('');
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium text-sm"
                    >
                        <Plus size={18} />
                        New Ticket
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-[#161925] p-4 rounded-2xl border border-slate-200 dark:border-[#1E202C] flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by customer or device..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 focus:bg-[#1A1D2B] transition-all text-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-slate-500" size={18} />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="delivered">Delivered</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#161925] rounded-3xl border border-slate-200 dark:border-[#1E202C] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#0F111A]/50 border-b border-slate-200 dark:border-[#1E202C]">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Device &amp; Issue</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Est. Cost</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E202C]">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Loading repairs...</td>
                                </tr>
                            ) : filteredRepairs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No repair tickets found.</td>
                                </tr>
                            ) : (
                                filteredRepairs.map((repair) => (
                                    <tr key={repair._id} className="hover:bg-slate-200 dark:bg-[#1E202C]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 dark:text-white">{repair.customers?.name || repair.customerName}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">{repair.customers?.phone || repair.customerPhone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-blue-400">{repair.devices?.model || repair.deviceModel}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={repair.issueDescription}>
                                                {repair.issueDescription}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-3 py-1 text-xs font-bold rounded-full border",
                                                statusColors[repair.status] || statusColors.pending
                                            )}>
                                                {repair.status.replace('-', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                                            {formatPrice(repair.estimatedCost || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setCurrentRepair(repair);
                                                        setSelectedCustomer(repair.customer_id || '');
                                                        setSelectedDevice(repair.device_id || '');
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(repair._id)}
                                                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-[#1E202C]">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {currentRepair ? 'Edit Repair Ticket' : 'New Repair Ticket'}
                                    </h3>
                                    {isTechnician && (
                                        <p className="text-xs text-blue-400 mt-0.5 font-medium">Technician View — Status &amp; Cost only</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto w-full custom-scrollbar">
                                <form id="repairForm" key={currentRepair ? currentRepair._id : 'new-ticket'} onSubmit={handleSaveRepair} className="space-y-4">

                                    {/* ─── Read-only top section for Technician ─── */}
                                    {isTechnician && currentRepair ? (
                                        <div className="bg-slate-50 dark:bg-[#0F111A] rounded-xl border border-slate-200 dark:border-[#1E202C] p-4 space-y-3">
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Ticket Info (read-only)</p>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-slate-500 dark:text-slate-400 text-xs">Customer</span>
                                                    <p className="font-medium text-slate-900 dark:text-white">{currentRepair.customers?.name || currentRepair.customerName || '—'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 dark:text-slate-400 text-xs">Phone</span>
                                                    <p className="font-medium text-slate-900 dark:text-white">{currentRepair.customers?.phone || currentRepair.customerPhone || '—'}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-slate-500 dark:text-slate-400 text-xs">Device</span>
                                                    <p className="font-medium text-blue-400">{currentRepair.devices?.model || currentRepair.deviceModel || '—'}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-slate-500 dark:text-slate-400 text-xs">Issue</span>
                                                    <p className="font-medium text-slate-900 dark:text-white">{currentRepair.issueDescription || '—'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ─── Full form for Admin / Sales ─── */
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2 space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer Name</label>
                                                    <input required name="newCustomerName" defaultValue={currentRepair?.customers?.name || currentRepair?.customerName || ''} type="text" className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer Phone</label>
                                                    <input required name="newCustomerPhone" defaultValue={currentRepair?.customers?.phone || currentRepair?.customerPhone || ''} type="text" className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer Email</label>
                                                    <input name="newCustomerEmail" defaultValue={currentRepair?.customers?.email || ''} type="email" className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Device Model</label>
                                                <input required name="newDeviceModel" defaultValue={currentRepair?.devices?.model || currentRepair?.deviceModel || ''} type="text" className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                                                <input type="hidden" name="customer_id" value={currentRepair?.customer_id ? currentRepair.customer_id : 'new'} />
                                                <input type="hidden" name="device_id" value={currentRepair?.device_id ? currentRepair.device_id : 'new'} />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Issue Description</label>
                                                <textarea required name="issueDescription" defaultValue={currentRepair?.issueDescription || ''} className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm min-h-[80px]" />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned Technician</label>
                                                <select
                                                    name="assignedTo"
                                                    defaultValue={currentRepair?.assignedTo || ''}
                                                    className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm"
                                                >
                                                    <option value="">— Unassigned —</option>
                                                    {technicians.map(t => (
                                                        <option key={t.id} value={t.id}>{t.fullName || t.name || t.email}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {/* ─── Editable fields for ALL roles (Status, Cost, Notes) ─── */}
                                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-[#1E202C] pt-4 mt-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</label>
                                            <select name="status" defaultValue={currentRepair?.status || 'pending'} className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm">
                                                <option value="pending">Pending</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                                <option value="delivered">Delivered</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes</label>
                                            <input name="notes" defaultValue={getCleanNotes(currentRepair?.notes || '')} type="text" className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Est. Cost</label>
                                            <input required name="estimatedCost" defaultValue={currentRepair?.estimatedCost || ''} type="number" step="0.01" min="0" className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                                        </div>
                                        {currentRepair && (
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Final Cost</label>
                                                <input name="finalCost" defaultValue={currentRepair?.finalCost || ''} type="number" step="0.01" min="0" className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </div>
                            <div className="p-6 border-t border-slate-200 dark:border-[#1E202C] bg-slate-50 dark:bg-[#0F111A]/50 flex justify-end gap-3 mt-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-white/5 transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    form="repairForm"
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-6 py-2 rounded-xl transition-colors font-medium shadow-lg shadow-blue-500/20 text-sm"
                                >
                                    {currentRepair ? 'Save Changes' : 'Create Ticket'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #2A2D3A; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default Repairs;
