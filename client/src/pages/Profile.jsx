import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { User, Mail, Save, Lock, Camera, Check, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [message, setMessage] = useState(null);

    const [newEmail, setNewEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        const getProfile = async () => {
            try {
                setLoading(true);
                const { data: { user }, error: userErr } = await supabase.auth.getUser();
                if (userErr) throw userErr;
                
                setUser(user);
                setNewEmail(user.email);

                if (user) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (error) throw error;
                    setProfile(data);
                }
            } catch (error) {
                console.error('Error loading profile:', error.message);
            } finally {
                setLoading(false);
            }
        };

        getProfile();
    }, []);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 200;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Compress highly to fit comfortably in a TEXT column
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                setProfile({ ...profile, avatarUrl: dataUrl });
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        
        if (password && password !== confirmPassword) {
            setMessage('Passwords do not match!');
            return;
        }

        try {
            setLoading(true);
            setMessage(null);
            
            // 1. Update Auth Data (Email / Password)
            const authUpdates = {};
            if (newEmail !== user.email) authUpdates.email = newEmail;
            if (password) authUpdates.password = password;

            if (Object.keys(authUpdates).length > 0) {
                const { error: authError } = await supabase.auth.updateUser(authUpdates);
                if (authError) throw authError;
            }

            // 2. Update Public Profile Table (Name / Avatar)
            const updates = {
                ...profile,
                id: user.id,
                email: newEmail,
                fullName: profile.fullName,
                avatarUrl: profile.avatarUrl,
                updated_at: new Date(),
            };

            const { error: profileError } = await supabase.from('profiles').upsert(updates);
            if (profileError) throw profileError;

            let successMsg = 'Profile updated successfully!';
            if (authUpdates.email) successMsg += ' A confirmation link may have been sent to your new email address.';
            
            setMessage(successMsg);
            setTimeout(() => setMessage(null), 6000);
            
            // Wipe password fields for security
            setPassword('');
            setConfirmPassword('');

            // Force global event so layout avatar refreshes
            const updatedUser = {
                ...JSON.parse(localStorage.getItem('user')),
                name: profile.fullName,
                email: newEmail,
                avatarUrl: profile.avatarUrl
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('authStatusChanged'));

        } catch (error) {
            setMessage('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !profile) return <div className="text-center p-10 text-slate-500">Loading your settings...</div>;

    const isSuccess = message && !message.includes('Error') && !message.includes('not match');

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Account Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Manage your profile information, password, and security preferences.</p>

            <div className="bg-white dark:bg-[#161925] rounded-3xl shadow-sm border border-slate-200 dark:border-[#1E202C] overflow-hidden">
                
                {message && (
                    <div className={clsx("p-4 m-6 rounded-xl flex items-center gap-3 border", isSuccess ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20")}>
                        {isSuccess ? <Check size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center font-bold text-xs">!</div>}
                        <span className="font-medium text-sm">{message}</span>
                    </div>
                )}

                <form onSubmit={updateProfile} autoComplete="off" className="p-6 sm:p-10 space-y-8">
                    
                    {/* Avatar Upload Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-slate-200 dark:border-[#1E202C]">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 dark:bg-[#1E202C] ring-4 ring-white dark:ring-[#161925] shadow-lg flex items-center justify-center">
                                {profile?.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={64} className="text-slate-300 dark:text-slate-600" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                                title="Change Avatar"
                            >
                                <Camera size={18} />
                            </button>
                            {profile?.avatarUrl && (
                                <button
                                    type="button"
                                    onClick={() => setProfile({ ...profile, avatarUrl: null })}
                                    className="absolute bottom-0 left-0 w-10 h-10 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                                    title="Remove Avatar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                ref={fileInputRef} 
                                onChange={handleAvatarChange} 
                                className="hidden" 
                            />
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Profile Picture</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                                Click the camera icon to upload a custom avatar. JPG, GIF or PNG. Max size of 800K.
                            </p>
                        </div>
                    </div>

                    {/* General Information */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <User size={20} className="text-blue-500" />
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                                <input
                                    type="text"
                                    value={profile?.fullName || ''}
                                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-medium"
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-medium"
                                        placeholder="your.email@example.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Password Updates */}
                    <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-[#1E202C]">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Lock size={20} className="text-blue-500" />
                            Security
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Leave these fields completely blank if you do not wish to change your password.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm New Password</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E202C] text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E202C] transition-colors font-semibold"
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-semibold transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/30"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default Profile;
