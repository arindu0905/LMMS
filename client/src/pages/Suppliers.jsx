import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Phone, Mail, MapPin, Pencil, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMPTY_FORM = { name: '', contactPerson: '', phone: '', email: '', address: '' };

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null); // null = adding, object = editing
    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
        } catch (err) {
            console.error('Error fetching suppliers:', err);
        }
    };

    const openAddModal = () => {
        setEditingSupplier(null);
        setFormData(EMPTY_FORM);
        setShowModal(true);
    };

    const openEditModal = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name || '',
            contactPerson: supplier.contact || supplier.contactPerson || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || ''
        });
        setShowModal(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdateContract = async (id, status) => {
        try {
            await api.put(`/suppliers/${id}`, { contract_status: status });
            fetchSuppliers();
        } catch (err) {
            console.error('Error updating contract:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await api.put(`/suppliers/${editingSupplier.id || editingSupplier._id}`, formData);
            } else {
                await api.post('/suppliers', formData);
            }
            setShowModal(false);
            setEditingSupplier(null);
            fetchSuppliers();
            setFormData(EMPTY_FORM);
        } catch (err) {
            console.error('Error saving supplier:', err);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) return;
        try {
            await api.delete(`/suppliers/${editingSupplier.id || editingSupplier._id}`);
            setShowModal(false);
            setEditingSupplier(null);
            fetchSuppliers();
            setFormData(EMPTY_FORM);
        } catch (err) {
            console.error('Error deleting supplier:', err);
            alert(err.response?.data?.msg || 'Failed to delete supplier');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Supplier Management</h2>
                <button
                    onClick={openAddModal}
                    className="bg-primary-600 hover:bg-primary-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/30"
                >
                    <Plus size={20} />
                    Add Supplier
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.map(supplier => (
                    <motion.div
                        key={supplier.id || supplier._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 dark:bg-[#161925] backdrop-blur-sm rounded-xl shadow-sm border border-white/40 dark:border-[#1E202C] p-6 hover:shadow-md transition-shadow relative group"
                    >
                        {/* Edit Button */}
                        <button
                            onClick={() => openEditModal(supplier)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-all"
                            title="Edit Supplier"
                        >
                            <Pencil size={16} />
                        </button>

                        <div className="flex items-start justify-between mb-1 pr-8">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{supplier.name}</h3>
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full shrink-0 ${
                                supplier.contract_status === 'Approved' ? 'bg-green-100 text-green-700' :
                                supplier.contract_status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                'bg-orange-100 text-orange-700'
                            }`}>
                                {supplier.contract_status || 'Pending'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                            Contact: {supplier.contact || supplier.contactPerson || '—'}
                        </p>

                        <div className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-primary-400 shrink-0" />
                                <span>{supplier.phone || '—'}</span>
                            </div>
                            {supplier.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-primary-400 shrink-0" />
                                    <span>{supplier.email}</span>
                                </div>
                            )}
                            {supplier.address && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-primary-400 shrink-0" />
                                    <span>{supplier.address}</span>
                                </div>
                            )}
                        </div>

                        {(!supplier.contract_status || supplier.contract_status === 'Pending') && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex gap-2">
                                <button
                                    onClick={() => handleUpdateContract(supplier.id || supplier._id, 'Approved')}
                                    className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:hover:bg-green-900/40 py-1.5 rounded text-sm font-medium transition-colors"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleUpdateContract(supplier.id || supplier._id, 'Rejected')}
                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 py-1.5 rounded text-sm font-medium transition-colors"
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Add / Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="bg-white dark:bg-[#161925] rounded-2xl shadow-2xl border border-white/50 dark:border-[#1E202C] max-w-md w-full p-6"
                        >
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {[
                                    { label: 'Company Name', name: 'name', required: true },
                                    { label: 'Contact Person', name: 'contactPerson' },
                                    { label: 'Phone', name: 'phone', required: true },
                                    { label: 'Email', name: 'email', type: 'email' },
                                ].map(({ label, name, required, type }) => (
                                    <div key={name}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
                                        <input
                                            type={type || 'text'}
                                            name={name}
                                            value={formData[name]}
                                            onChange={handleChange}
                                            required={required}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1E202C] bg-gray-50 dark:bg-[#0F111A] dark:text-white focus:bg-white dark:focus:bg-[#1E202C] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1E202C] bg-gray-50 dark:bg-[#0F111A] dark:text-white focus:bg-white dark:focus:bg-[#1E202C] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                        rows="2"
                                    />
                                </div>
                                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100 dark:border-[#1E202C]">
                                    <div>
                                        {editingSupplier && (
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors font-medium border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30"
                                        >
                                            {editingSupplier ? 'Save Changes' : 'Add Supplier'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Suppliers;
