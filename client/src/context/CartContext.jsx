import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [userId, setUserId] = useState(null);

    // 1. Detect the current user
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUserId(session?.user?.id || null);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUserId(session?.user?.id || null);
            if (event === 'SIGNED_OUT') {
                setCart([]); // Clear cart in memory on logout
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // 2. Load cart specifically for that user when they log in
    useEffect(() => {
        if (userId) {
            try {
                const localCart = localStorage.getItem(`cart_${userId}`);
                setCart(localCart ? JSON.parse(localCart) : []);
            } catch (error) {
                console.error("Failed to parse cart from local storage", error);
                setCart([]);
            }
        } else {
            setCart([]);
        }
    }, [userId]);

    // 3. Save to local storage under user-specific key whenever cart changes
    useEffect(() => {
        if (userId) {
            localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
        }
    }, [cart, userId]);

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartCount,
            cartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
};
