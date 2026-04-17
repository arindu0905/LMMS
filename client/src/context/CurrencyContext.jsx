import React, { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    // Standard starting currency
    const [currency, setCurrency] = useState('LKR');

    // Hardcoded static exchange rates mapped against the LKR baseline
    const rates = {
        LKR: { rate: 1, symbol: 'Rs ' },
        USD: { rate: 1/300, symbol: '$' },
        EUR: { rate: 0.92/300, symbol: '€' },
        GBP: { rate: 0.79/300, symbol: '£' },
        AUD: { rate: 1.53/300, symbol: 'A$' }
    };

    /**
     * Converts a raw numeric price into a formatted string native 
     * to the currently selected currency
     */
    const formatPrice = (basePrice) => {
        if (!basePrice && basePrice !== 0) return rates[currency].symbol + '0.00';

        const converted = basePrice * rates[currency].rate;

        // Locale conversion automatically inserts native commas for large numbers
        return rates[currency].symbol + converted.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, currencies: Object.keys(rates) }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);
