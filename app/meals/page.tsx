'use client';

import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const FREE_MEALS = [
	{ id: 'm1', title: 'Grilled Chicken Salad', img: '/meals/1.jpg' },
	{ id: 'm2', title: 'Veggie Stir-Fry', img: '/meals/2.jpg' },
	{ id: 'm3', title: 'Pasta Primavera', img: '/meals/3.jpg' },
];

const PREMIUM_MEALS = [
	{ id: 'm4', title: 'Salmon with Quinoa', img: '/meals/4.jpg' },
	{ id: 'm5', title: 'Beef Bulgogi Bowl', img: '/meals/5.jpg' },
];

export default function MealsPage() {
    const { user, purchases, sendVerificationEmail, setPurchased } = useAuth();
	const hasAccess = !!purchases.meals;
	const isLoggedIn = !!user;
	const isVerified = !!user?.emailVerified;
	const [showOptions, setShowOptions] = useState(false);
    const params = useSearchParams();
    const [appliedFromQuery, setAppliedFromQuery] = useState(false);

    // Fallback unlock: if redirected back to this page with payment indicators
    useEffect(() => {
        if (appliedFromQuery) return;
        if (!user) return;
        const paid = params.get('paid');
        const product = params.get('product');
        if (paid === '1' || product === 'meals') {
            (async () => {
                try {
                    await setPurchased('meals', true);
                    setAppliedFromQuery(true);
                } catch {
                    // ignore; user can retry by reloading
                }
            })();
        }
    }, [params, user, setPurchased, appliedFromQuery]);

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Meals</h1>
				<p className="mt-1 text-sm text-neutral-600">Enjoy these free meals. Unlock more to see the full list.</p>
			</div>

			{!hasAccess && (
				<div id="unlock" className="mb-6 rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-5 shadow-[0_10px_30px_rgba(245,158,11,0.12)] elev-1">
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className="text-sm font-medium text-amber-900">Unlock all meals with a one-time purchase</p>
							<p className="mt-1 text-xs text-amber-800/80">Immediate access • Lifetime updates • Email support</p>
						</div>
						<div className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-900 shadow-sm">Best value</div>
					</div>
					<div className="mt-3 flex items-center justify-between">
						<div className="text-sm text-neutral-700">
							<span className="text-lg font-semibold text-neutral-900">₫20,000</span>
							<span className="ml-2 align-middle text-xs text-neutral-500">one-time</span>
						</div>
						<button
							className="animate-shine rounded-full bg-gradient-to-r from-neutral-900 to-black px-5 py-2.5 text-sm font-medium text-white shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)]"
							onClick={() => setShowOptions(true)}
						>
							Purchase
						</button>
					</div>
					{showOptions && (
						<div className="fixed inset-0 z-50 grid place-items-center bg-black/40" onClick={() => setShowOptions(false)}>
							<div className="w-full max-w-sm rounded-2xl border border-neutral-200/70 bg-white/90 p-4 text-sm text-neutral-800 shadow-[0_40px_80px_rgba(0,0,0,0.35)] glass" onClick={e => e.stopPropagation()}>
								<div className="mb-3 flex items-center justify-between">
									<div className="font-semibold text-neutral-900">Choose payment</div>
									<button className="rounded-full px-2 py-1 text-neutral-500 hover:bg-neutral-100" onClick={() => setShowOptions(false)}>Close</button>
								</div>
							{!isLoggedIn && (
								<div className="space-x-2">
									<a className="rounded-full bg-neutral-900 px-4 py-2 text-white shadow-sm hover:bg-black" href="/login">Log in</a>
									<a className="rounded-full border border-neutral-300/80 px-4 py-2 text-neutral-900 hover:bg-neutral-50" href="/signup">Sign up</a>
								</div>
							)}
							{isLoggedIn && !isVerified && (
								<div>
									<p className="mb-2">Please verify your email before purchasing.</p>
									<button className="rounded-full bg-neutral-900 px-4 py-2 text-white shadow-sm hover:bg-black" onClick={() => void sendVerificationEmail()}>
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
												const res = await fetch('/api/checkout/meals', {
													method: 'POST',
													headers: { 'Content-Type': 'application/json' },
													body: JSON.stringify({ uid: user?.uid, email: user?.email }),
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
														product: 'meals',
														amount: 20000,
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
				</div>
			)}
			<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
				{FREE_MEALS.map(m => (
					<li key={m.id} className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover-lift">
						<div className="relative h-44 w-full">
							<Image src={m.img} alt={m.title} fill className="object-cover transition-transform duration-300 hover:scale-[1.03]" />
						</div>
					</li>
				))}

				{PREMIUM_MEALS.map(m => (
					<li key={m.id} className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover-lift">
						<div className="relative h-44 w-full">
							<Image
								src={m.img}
								alt={m.title}
								fill
								className={`object-cover transition-transform duration-300 hover:scale-[1.03] ${hasAccess ? '' : 'blur-[8px] brightness-[0.6]'}`}
							/>
						</div>
					</li>
				))}
			</ul>

		</div>
	);
}
 

