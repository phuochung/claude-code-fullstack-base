"use client";

import { useI18n } from "@/context/I18nContext";
import { useState, useRef, useEffect } from "react";

export default function LanguageSwitcher() {
    const { locale, setLocale } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages = [
        { code: "en", name: "English", flag: "🇺🇸" },
        { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
    ] as const;

    const currentLanguage = languages.find((lang) => lang.code === locale);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Change language"
            >
                <span className="text-lg">{currentLanguage?.flag}</span>
                <span className="hidden sm:inline">{currentLanguage?.code.toUpperCase()}</span>
                <svg
                    className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
                    {languages.map((lang, index) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLocale(lang.code);
                                setIsOpen(false);
                            }}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${locale === lang.code
                                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                                    : "text-gray-700 dark:text-gray-300"
                                } ${index === 0 ? "rounded-t-lg" : ""} ${index === languages.length - 1 ? "rounded-b-lg" : ""}`}
                        >
                            <span className="text-lg">{lang.flag}</span>
                            <span className="flex-1 font-medium">{lang.name}</span>
                            {locale === lang.code && (
                                <svg
                                    className="h-4 w-4 text-brand-600 dark:text-brand-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
