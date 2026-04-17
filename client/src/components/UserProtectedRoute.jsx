import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const UserProtectedRoute = () => {
    const token = localStorage.getItem('token');

    // Check if user is authenticated at all (admin or normal user)
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default UserProtectedRoute;
