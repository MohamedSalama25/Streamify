"use client";

import { Moon, Sun, Globe } from "lucide-react";
import { useTheme } from "@/shared/hooks/use-theme";
import { useI18n } from "@/shared/i18n";
import { BrandMark } from "@/shared/components/brand-mark";
import { cn } from "@/shared/lib/cn";

export function TopNav() {
    const { theme, setTheme } = useTheme();
    const { locale, toggleLocale, t } = useI18n();

    return (
        <header className="fixed top-0 z-50 w-full glass-surface border-b border-outline-variant/10">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
                {/* Left — Brand */}
                <div className="flex items-center">
                    <BrandMark />
                </div>

                {/* Right — Controls */}
                <div className="flex items-center gap-2">
                    {/* Language Toggle */}
                    <button
                        onClick={toggleLocale}
                        className="flex items-center gap-1.5 rounded-full ghost-border px-3 py-1.5 text-label-md font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
                        aria-label="Toggle language"
                    >
                        <Globe className="h-3.5 w-3.5" />
                        <span>{locale === "en" ? t.language.ar : t.language.en}</span>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="flex h-9 w-9 items-center justify-center rounded-full ghost-border text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        )}
                    </button>

                </div>
            </div>
        </header>
    );
}
