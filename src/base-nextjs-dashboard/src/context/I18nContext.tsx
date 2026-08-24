"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import enMessages from "@/locales/en.json";

type Locale = "en" | "vi";

const DEFAULT_LOCALE: Locale = "en";

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
    // The default locale is bundled, so the first render has real strings rather than raw keys.
    // Other locales are fetched on demand and cached here.
    const [loaded, setLoaded] = useState<Partial<Record<Locale, Record<string, unknown>>>>({
        [DEFAULT_LOCALE]: enMessages,
    });
    const messages = loaded[locale] ?? enMessages;

    // Load messages for any locale that isn't bundled or already cached
    useEffect(() => {
        if (locale === DEFAULT_LOCALE) return;

        let cancelled = false;
        import(`@/locales/${locale}.json`).then((msgs) => {
            if (!cancelled) {
                setLoaded((prev) => ({ ...prev, [locale]: msgs.default }));
            }
        });
        return () => {
            cancelled = true;
        };
    }, [locale]);

    // Load saved locale from localStorage on mount
    useEffect(() => {
        const savedLocale = localStorage.getItem("locale") as Locale;
        if (savedLocale && (savedLocale === "en" || savedLocale === "vi")) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the saved locale from localStorage after SSR
            setLocaleState(savedLocale);
        }
    }, []);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("locale", newLocale);
    }, []);

    // Translation function
    const t = useCallback(
        (key: string): string => {
            const keys = key.split(".");
            let value: unknown = messages;

            for (const k of keys) {
                if (value && typeof value === "object" && k in value) {
                    value = (value as Record<string, unknown>)[k];
                } else {
                    return key; // Return key if translation not found
                }
            }

            return typeof value === "string" ? value : key;
        },
        [messages]
    );

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
}
