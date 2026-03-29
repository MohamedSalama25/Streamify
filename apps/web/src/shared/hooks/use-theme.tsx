"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme | undefined;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "streamify-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme | undefined>(undefined);

    useEffect(() => {
        // Determine initial theme on client mount
        let stored = localStorage.getItem(THEME_KEY) as Theme | null;
        if (!stored) {
            stored = "dark"; // Default theme
        }
        setThemeState(stored);

        // Apply immediately to avoid double render if possible
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(stored);
        // Remove inline style that might interfere
        document.documentElement.style.colorScheme = stored;
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newTheme);
        document.documentElement.style.colorScheme = newTheme;
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
