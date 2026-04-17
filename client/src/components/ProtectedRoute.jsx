import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    let user = null;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        console.error("Error parsing user data", e);
        return <Navigate to="/login" replace />;
    }

    // Strict Access Control
    // Allow users with internal roles to access dashboard routes
    const allowedRoles = ['admin', 'inventory_manager', 'inventory manager', 'technician', 'sales', 'supplier'];
    if (!allowedRoles.includes(user?.role?.toLowerCase())) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
