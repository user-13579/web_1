'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'vi';

type LanguageContextValue = {
	language: Language;
	toggleLanguage: () => void;
	setLanguage: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'app_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const [language, setLanguageState] = useState<Language>('en');

	useEffect(() => {
		try {
			const saved = window.localStorage.getItem(STORAGE_KEY) as Language | null;
			if (saved === 'en' || saved === 'vi') setLanguageState(saved);
		} catch {}
	}, []);

	useEffect(() => {
		try {
			window.localStorage.setItem(STORAGE_KEY, language);
		} catch {}
	}, [language]);

	function toggleLanguage() {
		setLanguageState(prev => (prev === 'en' ? 'vi' : 'en'));
	}

	function setLanguage(lang: Language) {
		setLanguageState(lang);
	}

	const value = useMemo<LanguageContextValue>(
		() => ({ language, toggleLanguage, setLanguage }),
		[language],
	);

	return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
	const ctx = useContext(LanguageContext);
	if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
	return ctx;
}
