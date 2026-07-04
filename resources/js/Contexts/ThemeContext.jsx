import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children, settings = {} }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === 'undefined') return true;
        const saved = localStorage.getItem('amd_theme');
        if (saved) return saved === 'dark';
        
        const defaultDark = settings.dark_mode_default;
        if (defaultDark !== undefined && defaultDark !== null) {
            return defaultDark === '1' || defaultDark === 1 || defaultDark === true || defaultDark === 'true' || defaultDark === 'on';
        }
        return true; // Default for VenQore Platform
    });

    useEffect(() => {
        const defaultDark = settings.dark_mode_default;
        if (defaultDark !== undefined && defaultDark !== null) {
            const isDarkSetting = defaultDark === '1' || defaultDark === 1 || defaultDark === true || defaultDark === 'true' || defaultDark === 'on';
            const saved = localStorage.getItem('amd_theme');
            if (!saved) {
                setIsDarkMode(isDarkSetting);
            }
        }
    }, [settings.dark_mode_default]);

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
