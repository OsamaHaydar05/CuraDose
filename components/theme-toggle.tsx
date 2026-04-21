"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                <div className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400">
                    Light
                </div>
                <div className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400">
                    Dark
                </div>
                <div className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400">
                    System
                </div>
            </div>
        );
    }

    const baseClass =
        "min-h-10 rounded-lg px-3 py-2 text-sm font-medium transition";
    const activeClass = "bg-blue-600 text-white";
    const inactiveClass =
        "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";

    const isLightActive = theme === "light";
    const isDarkActive = theme === "dark";
    const isSystemActive = theme === "system";

    return (
        <div className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
            <button
                type="button"
                onClick={() => setTheme("light")}
                className={`${baseClass} ${isLightActive ? activeClass : inactiveClass}`}
                aria-label="Use light theme"
                title="Use light theme"
            >
                Light
            </button>

            <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`${baseClass} ${isDarkActive ? activeClass : inactiveClass}`}
                aria-label="Use dark theme"
                title="Use dark theme"
            >
                Dark
            </button>

            <button
                type="button"
                onClick={() => setTheme("system")}
                className={`${baseClass} ${isSystemActive ? activeClass : inactiveClass}`}
                aria-label="Use system theme"
                title={`Use system theme (${resolvedTheme ?? "unknown"})`}
            >
                System
            </button>
        </div>
    );
}