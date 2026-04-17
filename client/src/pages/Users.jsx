import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users as UsersIcon, Shield, UserPlus, Trash2, Edit2, CheckCircle, XCircle, LayoutGrid, List } from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'customer'
    });
    const [showModal, setShowModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', role: 'customer' });
    const [viewMode, setViewMode] = useState('grid');
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth');
            const sanitized = res.data.map(u => ({
                ...u,
                role: (!u.role || String(u.role).toLowerCase() === 'user') ? 'customer' : u.role
            }));
            setUsers(sanitized);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            setShowModal(false);
            fetchUsers();
            setFormData({ name: '', email: '', password: '', role: 'customer' });
        } catch (err) {
            console.error('Error adding user:', err);
            alert('Failed to add user');
        }
    };

    const handleDeleteClick = (id) => {
        setUserToDelete(id);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/auth/${userToDelete}`);
            setUserToDelete(null);
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user', err);
            const msg = err.response?.data?.msg || 'Failed to delete user';
            alert(msg);
        }
    };

    const handleEditClick = (user) => {
        setUserToEdit(user.id || user._id);
        setEditFormData({
            name: user.fullName || user.name || '',
            role: user.role || 'customer'
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/auth/${userToEdit}`, editFormData);
            setShowEditModal(false);
            setUserToEdit(null);
            fetchUsers();
        } catch (err) {
            console.error('Error updating user:', err);
            alert('Failed to update user');
        }
    };

    const handleToggleStatus = async (user) => {
        const currentIsActive = user.is_active !== false; // default true
        try {
            await api.put(`/auth/${user.id || user._id}`, {
                name: user.fullName || user.name,
                role: user.role,
                isActive: !currentIsActive
            });
            fetchUsers();
        } catch (err) {
            console.error('Error toggling status:', err);
            const errorMsg = err.response?.data?.details || err.response?.data?.msg || err.message;
            if (errorMsg && errorMsg.includes('is_active')) {
                alert('Failed: The "is_active" column is missing in your Supabase database. Please add it via the Supabase Dashboard as a Boolean with a default value of TRUE.');
            } else {
                alert(`Failed to update user status: ${errorMsg}`);
            }
        }
    };

    const filteredUsers = users.filter((u) => {
        if (filterRole === 'all') return true;
        
        const internalRoles = ['admin', 'technician', 'inventory_manager', 'inventory manager', 'sales'];
        const currentRole = String(u.role).toLowerCase();
        
        if (filterRole === 'internal') {
            return internalRoles.includes(currentRole);
        }
        if (filterRole === 'customers') {
            return currentRole === 'customer';
        }
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">User Management</h2>
                <div className="flex items-center gap-4">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] text-sm rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                    >
                        <option value="all">All Users</option>
                        <option value="internal">Internal Team</option>
                        <option value="customers">Customers</option>
                    </select>
                    <div className="flex items-center bg-white dark:bg-[#161925] rounded-xl border border-slate-200 dark:border-[#1E202C] p-1 shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'table' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            title="Table View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary-600 hover:bg-primary-700 text-slate-900 dark:text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/30 font-medium"
                    >
                        <UserPlus size={20} />
                        Add User
                    </button>
                </div>
            </div>

            {viewMode === 'table' ? (
                <div className="bg-white/80 dark:bg-[#161925]/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 dark:border-[#1E202C] overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-[#0F111A]/50 text-gray-500 dark:text-slate-400 font-medium">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((user) => (
                            <tr key={user.id || user._id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                (user.fullName || user.name || 'U').charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{user.fullName || user.name || 'Unnamed User'}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 capitalize text-gray-700">
                                        <Shield size={14} className="text-primary-500" />
                                        {user.role}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(user.created_at || user.updated_at || user.createdAt || Date.now()).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {user.is_active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleToggleStatus(user)} className={`${user.is_active !== false ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700'} transition-colors`} title={user.is_active !== false ? 'Deactivate' : 'Activate'}>
                                            {user.is_active !== false ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                        </button>
                                        <button onClick={() => handleEditClick(user)} className="text-blue-500 hover:text-blue-700 transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDeleteClick(user.id || user._id)} className="text-red-500 hover:text-red-700 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredUsers.map((user) => (
                        <div key={user.id || user._id} className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-[#1E202C] rounded-3xl p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden transition-all hover:shadow-lg dark:hover:border-[#2A2D3A]">
                            <div className={`absolute top-0 w-full h-1.5 ${user.is_active !== false ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                            
                            <div className="relative mt-4 mb-3">
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl font-bold uppercase ring-4 ring-white dark:ring-[#161925]">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        (user.fullName || user.name || 'U').charAt(0)
                                    )}
                                </div>
                                <span className={`absolute bottom-0 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#161925] ${user.is_active !== false ? 'bg-green-500' : 'bg-slate-400'}`} title={user.is_active !== false ? 'Active' : 'Inactive'}></span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate w-full px-2">
                                {user.fullName || user.name || 'Unnamed User'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate w-full px-2 mb-4">
                                {user.email}
                            </p>

                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-[#0F111A] text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-6 border border-slate-200 dark:border-[#1E202C]">
                                <Shield size={12} className="text-primary-500" />
                                {user.role}
                            </div>

                            <div className="flex items-center justify-center gap-2 mt-auto w-full pt-4 border-t border-slate-100 dark:border-[#1E202C]">
                                <button 
                                    onClick={() => handleToggleStatus(user)} 
                                    className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${user.is_active !== false ? 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#1E202C]' : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-500/10'}`}
                                >
                                    {user.is_active !== false ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                    {user.is_active !== false ? 'Deactivate' : 'Activate'}
                                </button>
                                <button 
                                    onClick={() => handleEditClick(user)} 
                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-500/10 rounded-xl transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(user.id || user._id)} 
                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-white/50 max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Add New User</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input name="password" type="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors">
                                    <option value="customer">Customer</option>
                                    <option value="sales">Sales</option>
                                    <option value="inventory_manager">Inventory Manager</option>
                                    <option value="technician">Technician</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-slate-900 dark:text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30">Add User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {userToDelete && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-white/50 max-w-sm w-full p-6 text-center">
                        <Trash2 className="mx-auto text-red-500 mb-4" size={48} />
                        <h3 className="text-xl font-bold mb-2 text-gray-900">Delete User?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setUserToDelete(null)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">Cancel</button>
                            <button onClick={confirmDelete} className="px-6 py-2 bg-red-500 text-slate-900 dark:text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 font-medium">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-white/50 max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Edit User</h3>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input name="name" value={editFormData.name} onChange={handleEditChange} required className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select name="role" value={editFormData.role} onChange={handleEditChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors">
                                    <option value="customer">Customer</option>
                                    <option value="sales">Sales</option>
                                    <option value="inventory_manager">Inventory Manager</option>
                                    <option value="technician">Technician</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-slate-900 dark:text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
