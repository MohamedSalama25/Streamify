"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { en } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";
import type { Dictionary } from "./dictionaries/en";

export type Locale = "en" | "ar";

const LOCALE_KEY = "streamify-locale";

const dictionaries: Record<Locale, Dictionary> = { en, ar };

interface I18nContextValue {
    locale: Locale;
    t: Dictionary;
    setLocale: (locale: Locale) => void;
    toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(): Locale {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === "ar" || stored === "en") return stored;
    return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("en");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setLocaleState(getInitialLocale());
        setMounted(true);
    }, []);

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l);
        localStorage.setItem(LOCALE_KEY, l);
        document.documentElement.setAttribute("dir", l === "ar" ? "rtl" : "ltr");
        document.documentElement.setAttribute("lang", l);
    }, []);

    const toggleLocale = useCallback(() => {
        setLocale(locale === "en" ? "ar" : "en");
    }, [locale, setLocale]);

    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
            document.documentElement.setAttribute("lang", locale);
        }
    }, [locale, mounted]);

    const t = dictionaries[locale];

    return (
        <I18nContext.Provider value={{ locale, t, setLocale, toggleLocale }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error("useI18n must be used within I18nProvider");
    return ctx;
}

export { type Dictionary };
