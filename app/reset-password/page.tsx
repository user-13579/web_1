'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ResetPasswordPage() {
	const { resetPassword, user } = useAuth();
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const isLoggedIn = !!user?.email;

	useEffect(() => {
		if (!isLoggedIn || !user?.email) return;
		// Auto-send on load for logged-in users
		let cancelled = false;
		(async () => {
			setMessage(null);
			setError(null);
			setLoading(true);
			try {
				await resetPassword(user.email!);
				if (!cancelled) setMessage('We sent a password reset link to your email. Check your inbox and spam folder.');
			} catch (err: any) {
				if (!cancelled) setError(err?.message ?? 'Failed to send email');
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [isLoggedIn, resetPassword, user?.email]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setMessage(null);
		setError(null);
		setLoading(true);
		try {
			const target = isLoggedIn && user?.email ? user.email : email;
			await resetPassword(target);
			setMessage('We sent a password reset link to your email. Check your inbox and spam folder.');
		} catch (err: any) {
			setError(err?.message ?? 'Failed to send email');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="mx-auto max-w-md">
			<div className="mb-6">
				<h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Reset password</h1>
				<p className="mt-1 text-sm text-neutral-600">We'll send a reset link to your account email</p>
			</div>
			<div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					{!isLoggedIn && (
						<div className="space-y-3 text-sm text-neutral-700">
							<p>To reset your password, please log in. We will send a reset link to your account email automatically.</p>
							<div className="flex gap-2">
								<a className="rounded-full bg-neutral-900 px-4 py-2 text-white hover:bg-black" href="/login">Log in</a>
								<a className="rounded-full border border-neutral-300/80 px-4 py-2 text-neutral-900 hover:bg-neutral-50" href="/signup">Sign up</a>
							</div>
						</div>
					)}
					{message && <p className="text-sm text-emerald-700">{message}</p>}
					{error && <p className="text-sm text-red-600">{error}</p>}
					{isLoggedIn && (
						<button
							disabled={loading}
							className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
						>
							{loading ? 'Sending…' : 'Resend reset email'}
						</button>
					)}
				</form>
			</div>
		</div>
	);
}
 

