'use client';

import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const PACKAGES = [
	{ id: 'p1', title: 'Starter Mentorship', details: ['2 calls / month', 'Chat Q&A', 'Personalized plan'] },
	{ id: 'p2', title: 'Pro Mentorship', details: ['4 calls / month', 'Priority chat', 'Deep dive reviews'] },
	{ id: 'p3', title: 'Elite Mentorship', details: ['Weekly calls', 'Unlimited chat', 'Hands-on guidance'] },
];

export default function MentorPage() {
    const { user, purchases, sendVerificationEmail } = useAuth();
    const hasAccess = !!purchases.mentor;
    const isLoggedIn = !!user;
    const isVerified = !!user?.emailVerified;
    const [activePackageId, setActivePackageId] = useState<string | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        const pkg = searchParams.get('package');
        if (pkg) {
            const el = document.getElementById(pkg);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [searchParams]);

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Mentor</h1>
				<p className="mt-1 text-sm text-neutral-600">Choose a mentorship package. Purchase to access scheduling and direct contact.</p>
			</div>
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
				{PACKAGES.map((pkg, idx) => (
					<Link
						key={pkg.id}
						href={`/mentor?package=${pkg.id}`}
						className="relative overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-b from-amber-50 via-white to-white p-5 shadow-[0_10px_40px_rgba(217,119,6,0.15)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(217,119,6,0.22)] hover-lift animate-[pulseGlow_3.5s_ease-in-out_infinite] animate-shine scale-90"
						id={pkg.id}
					>
						<div className="relative mb-4 h-40 w-full overflow-hidden rounded-xl">
							<Image
								src={`/meals/${Math.min(idx + 1, 5)}.jpg`}
								alt={pkg.title}
								fill
								className="object-cover transition-transform duration-500 hover:scale-[1.04]"
							/>
						</div>
						<div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-200/40 blur-2xl"></div>
						<div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-300/30 blur-3xl"></div>
						<div className="sparkles">
							<span style={{ left: '14%', top: '18%' }} />
							<span style={{ right: '12%', top: '26%', animationDelay: '0.5s' }} />
							<span style={{ left: '22%', bottom: '16%', animationDelay: '1s' }} />
						</div>
						<div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-100/60 px-3 py-1 text-[0.75rem] font-semibold text-amber-800">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="M5 16l-1-9 4 3 4-6 4 6 4-3-1 9H5zM4 18h16v2H4z" />
							</svg>
							Premium Mentorship
						</div>
						<h2 className="bg-gradient-to-r from-amber-700 to-amber-500 bg-clip-text text-lg font-semibold text-transparent">{pkg.title}</h2>
						<ul className="mt-3 space-y-2 text-sm text-neutral-800">
							{pkg.details.map((d, i) => (
								<li key={i} className="flex items-center gap-2">
									<span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_0_2px_rgba(250,204,21,0.35)]"></span>
									<span>{d}</span>
								</li>
							))}
						</ul>
						{hasAccess ? (
							<div className="mt-4 text-sm text-emerald-700">Purchased — access your mentor portal.</div>
						) : (
							<div className="mt-4 space-y-2">
                            <button
                                className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-[0_6px_20px_rgba(217,119,6,0.35)] transition hover:from-amber-600 hover:to-amber-700"
								onClick={(e) => { e.preventDefault(); setActivePackageId(pkg.id); }}
                            >
									Purchase
								</button>
							</div>
						)}
					</Link>
					))}
                {activePackageId && (
                    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" onClick={() => setActivePackageId(null)}>
                        <div className="w-full max-w-sm rounded-2xl border border-amber-300/60 bg-white p-4 text-sm text-neutral-800 shadow-[0_20px_60px_rgba(0,0,0,0.25)]" onClick={e => e.stopPropagation()}>
                            <div className="mb-3 flex items-center justify-between">
                                <div className="font-semibold text-neutral-900">Choose payment</div>
                                <button className="rounded-full px-2 py-1 text-neutral-500 hover:bg-neutral-100" onClick={() => setActivePackageId(null)}>Close</button>
                            </div>
                            {!isLoggedIn && (
                                <div className="space-x-2">
                                    <a className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-neutral-900 hover:from-amber-600 hover:to-amber-700" href="/login">Log in</a>
                                    <a className="rounded-full border border-amber-300/80 px-4 py-2 text-neutral-900 hover:bg-amber-50" href="/signup">Sign up</a>
                                </div>
                            )}
                            {isLoggedIn && !isVerified && (
                                <div>
                                    <p className="mb-2">Please verify your email before purchasing.</p>
                                    <button className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-neutral-900 hover:from-amber-600 hover:to-amber-700" onClick={() => void sendVerificationEmail()}>
                                        Send verification email
                                    </button>
                                </div>
                            )}
                            {isLoggedIn && isVerified && (
                                <div className="space-y-2">
                                    <button 
                                        className="w-full rounded-xl border-2 border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-300 hover:bg-neutral-50" 
                                        onClick={async () => {
                                            try {
                                                const res = await fetch('/api/checkout/mentor', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ 
                                                        uid: user?.uid, 
                                                        email: user?.email,
                                                        packageId: activePackageId,
                                                    }),
                                                });
                                                const data = await res.json();
                                                if (!res.ok) throw new Error(data?.error || 'Failed to start checkout');
                                                if (data?.url) window.location.href = data.url as string;
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-neutral-900">Credit/Debit Card</div>
                                                <div className="mt-0.5 text-xs text-neutral-600">Pay with Stripe</div>
                                            </div>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                    <button 
                                        className="w-full rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-100" 
                                        onClick={async () => {
                                            try {
                                                const res = await fetch('/api/checkout/vnpay', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ 
                                                        uid: user?.uid, 
                                                        email: user?.email,
                                                        product: 'mentor',
                                                        packageId: activePackageId,
                                                        amount: 50000,
                                                    }),
                                                });
                                                const data = await res.json();
                                                if (!res.ok) throw new Error(data?.error || 'Failed to start VNPay checkout');
                                                if (data?.url) window.location.href = data.url as string;
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-blue-900">VNPay QR</div>
                                                <div className="mt-0.5 text-xs text-blue-700">Scan QR code to pay</div>
                                            </div>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                    <a 
                                        className="flex w-full items-center justify-between rounded-xl border-2 border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-300 hover:bg-neutral-50" 
                                        href="/purchase/manual"
                                    >
                                        <div>
                                            <div className="font-semibold text-neutral-900">Manual Bank Transfer</div>
                                            <div className="mt-0.5 text-xs text-neutral-600">Bank QR code</div>
                                        </div>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
					{hasAccess && (
						<div className="mt-8 rounded-2xl border border-emerald-200/70 bg-emerald-50 p-5 text-sm text-emerald-900 shadow-[0_8px_30px_rgba(16,185,129,0.12)]">
							Welcome to mentorship! We will contact you via your account email with next steps.
						</div>
					)}
				</div>
			</div>
		);
}
