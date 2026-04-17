import React from 'react';

const Logo = ({ className = "" }) => {
    return (
        <svg
            className={className}
            width="100%"
            height="100%"
            viewBox="0 0 520 130"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Left Side: Phone Icon */}
            <g transform="translate(10, 0)">
                {/* Dots and Pixels */}
                <rect x="-5" y="40" width="12" height="12" fill="#E85D4E" />
                <rect x="5" y="25" width="10" height="10" fill="#E85D4E" />
                <rect x="25" y="15" width="14" height="14" fill="#E85D4E" />
                <rect x="-8" y="58" width="10" height="10" fill="#E85D4E" />
                <rect x="4" y="68" width="8" height="8" fill="#E85D4E" />

                <rect x="15" y="35" width="16" height="16" fill="#415A9A" />
                <rect x="32" y="50" width="22" height="22" fill="#415A9A" />

                {/* Phone Body (Red Outline) tilted right */}
                <path d="M 20 60 L 50 25 L 90 95 L 60 130 Z" fill="none" stroke="#E85D4E" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />

                {/* Inner Phone Details */}
                <circle cx="75" cy="113" r="4" fill="#E85D4E" />
                <line x1="40" y1="40" x2="55" y2="35" stroke="#E85D4E" strokeWidth="4" strokeLinecap="round" />

                {/* Yellow Swooshes */}
                <path d="M 15 120 C 45 90, 65 40, 75 0" fill="none" stroke="#ECAB46" strokeWidth="6" strokeLinecap="round" />
                <path d="M 28 125 C 58 95, 78 45, 88 5" fill="none" stroke="#ECAB46" strokeWidth="6" strokeLinecap="round" />
                <path d="M 41 129 C 71 99, 91 50, 101 10" fill="none" stroke="#ECAB46" strokeWidth="6" strokeLinecap="round" />
            </g>

            {/* Main Text */}
            <g transform="translate(105, 74)">
                <text x="0" y="0" fontFamily="'Segoe UI Black', Arial, sans-serif" fontWeight="900" fontSize="52" fill="#415A9A" letterSpacing="-1">LASER</text>
                <text x="172" y="0" fontFamily="'Segoe UI Black', Arial, sans-serif" fontWeight="900" fontSize="52" fill="#40434A" letterSpacing="-1">MOBILE</text>
            </g>

            {/* Sub Text */}
            <g transform="translate(108, 103)">
                <text x="0" y="0" fontFamily="'Segoe UI', Arial, sans-serif" fontWeight="600" fontSize="18" fill="#40434A" letterSpacing="10">PHONE ARCADE</text>
            </g>
        </svg>
    );
};

export default Logo;
