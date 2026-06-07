import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === 'undefined') return true;
        const saved = localStorage.getItem('amd_theme');
        if (saved) return saved === 'dark';
        return true; // Default for VenQore Platform
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('amd_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('amd_theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(prev => !prev);

    return (
        <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        // Fallback for components outside provider
        return { isDarkMode: true, setIsDarkMode: () => {}, toggleTheme: () => {} };
    }
    return context;
};
