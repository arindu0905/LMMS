import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const UserLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <Navbar />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default UserLayout;
