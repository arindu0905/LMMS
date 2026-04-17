import React from 'react';

const PlaceholderPage = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <h2 className="text-2xl font-bold text-gray-400 mb-2">{title}</h2>
        <p className="text-gray-500">This module is under construction.</p>
    </div>
);

export default PlaceholderPage;
