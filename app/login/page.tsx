'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
	const { logIn } = useAuth();
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [suggestSignup, setSuggestSignup] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSuggestSignup(false);
		setLoading(true);
		try {
			await logIn(email, password);
			router.push('/account');
		} catch (err: any) {
			const code: string = err?.code ?? '';
			const message: string = err?.message ?? '';
			const isUserNotFound = code.includes('user-not-found') || message.toLowerCase().includes('user-not-found');
			if (isUserNotFound) {
				setError("We couldn't find an account with that email.");
				setSuggestSignup(true);
			} else {
				setError(message || 'Login failed');
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="mx-auto max-w-md">
			<div className="mb-6">
				<h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Welcome back</h1>
				<p className="mt-1 text-sm text-neutral-600">Log in to access your account</p>
			</div>
			<div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<input
						type="email"
						placeholder="Email"
						className="w-full rounded-xl border border-neutral-300/80 px-3 py-2 text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>
					<input
						type="password"
						placeholder="Password"
						className="w-full rounded-xl border border-neutral-300/80 px-3 py-2 text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
					/>
					{error && <p className="text-sm text-red-600">{error}</p>}
					{suggestSignup && (
						<div className="rounded-xl border border-amber-200/70 bg-amber-50 p-3 text-sm text-amber-900">
							<p className="mb-2">New here? Create an account to get started.</p>
							<a
								className="inline-block rounded-full bg-neutral-900 px-4 py-2 text-white hover:bg-black"
								href="/signup"
							>
								Sign up
							</a>
						</div>
					)}
					<button
						disabled={loading}
						className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
					>
						{loading ? 'Logging in…' : 'Log in'}
					</button>
				</form>
				<div className="mt-4 text-sm text-neutral-700">
					<a className="underline underline-offset-4 hover:text-neutral-900" href="/reset-password">Forgot password?</a>
					<span className="mx-2">•</span>
					<a className="underline underline-offset-4 hover:text-neutral-900" href="/signup">Create an account</a>
				</div>
			</div>
		</div>
	);
}
 

