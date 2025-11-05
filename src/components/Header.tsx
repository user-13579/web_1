'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const LABELS = {
	en: {
		home: 'Home',
		meals: 'Meals',
		courses: 'Courses',
		mentor: 'Mentor',
		contact: 'Contact',
		login: 'Log in',
		signup: 'Sign up',
	},
	vi: {
		home: 'Trang chủ',
		meals: 'Bữa ăn',
		courses: 'Khóa học',
		mentor: 'Cố vấn',
		testimonials: 'Cảm nhận',
		contact: 'Liên hệ',
		login: 'Đăng nhập',
		signup: 'Đăng ký',
	},
} as const;

function getAvatarInitial(email?: string | null): string {
	if (!email) return '?';
	return email.charAt(0).toUpperCase();
}

export default function Header() {
	const { user } = useAuth();
	const { language, toggleLanguage } = useLanguage();
	const t = LABELS[language];
	return (
		<header className="sticky top-0 z-30 border-b border-amber-200/60 bg-white/70 backdrop-blur">
			<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
				<nav className="flex items-center gap-7 text-[0.95rem] font-bold text-[#5B3F19]">
					<Link href="/" className="relative rounded-full px-4 py-2 transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-50 hover:via-amber-100/80 hover:to-amber-50 hover:text-amber-900 hover:shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60">{t.home}</Link>
					<Link href="/meals" className="relative rounded-full px-4 py-2 transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-50 hover:via-amber-100/80 hover:to-amber-50 hover:text-amber-900 hover:shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60">{t.meals}</Link>
					<Link href="/courses" className="relative rounded-full px-4 py-2 transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-50 hover:via-amber-100/80 hover:to-amber-50 hover:text-amber-900 hover:shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60">{t.courses}</Link>
					<Link href="/mentor" className="relative rounded-full px-4 py-2 transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-50 hover:via-amber-100/80 hover:to-amber-50 hover:text-amber-900 hover:shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60">{t.mentor}</Link>
					<Link href="/testimonials" className="relative rounded-full px-4 py-2 transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-50 hover:via-amber-100/80 hover:to-amber-50 hover:text-amber-900 hover:shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60">{language === 'vi' ? LABELS.vi.testimonials : 'Testimonials'}</Link>
					<Link href="/contact" className="relative rounded-full px-4 py-2 transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-50 hover:via-amber-100/80 hover:to-amber-50 hover:text-amber-900 hover:shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60">{t.contact}</Link>
				</nav>
				<div className="flex items-center gap-3">
					<button
						aria-label="Toggle language"
						onClick={toggleLanguage}
						className="rounded-full border border-amber-300/70 bg-white px-4 py-2 text-xs font-bold text-[#5B3F19] transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-50 hover:via-amber-100/80 hover:to-amber-50 hover:border-amber-400/80 hover:shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:scale-105"
					>
						{language === 'en' ? 'EN' : 'VI'}
					</button>
					{user ? (
						<Link href="/account" className="relative grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white transition-all duration-300 hover:shadow-[0_6px_20px_rgba(107,74,31,0.4)] hover:scale-110 hover:ring-2 hover:ring-amber-400/50" style={{ backgroundColor: '#6B4A1F' }}>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path fillRule="evenodd" clipRule="evenodd" d="M12 2.25a4.5 4.5 0 00-4.5 4.5 4.5 4.5 0 108.999.001A4.5 4.5 0 0012 2.25zm-7.5 15a7.5 7.5 0 0115 0v.75a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-.75z" />
							</svg>
						</Link>
					) : (
						<div className="flex items-center gap-2">
						<Link href="/login" className="relative rounded-full px-4 py-2 text-sm font-bold text-[#5B3F19] transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-50 hover:via-amber-100/80 hover:to-amber-50 hover:text-amber-900 hover:shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60">{t.login}</Link>
							<Link
								className="relative rounded-full bg-gradient-to-r from-amber-900 to-amber-800 px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:from-amber-950 hover:to-amber-900 hover:shadow-[0_6px_20px_rgba(180,83,9,0.4)] hover:scale-105"
								href="/signup"
							>
								{t.signup}
							</Link>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
 

