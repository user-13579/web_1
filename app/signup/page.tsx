'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
	const { signUp } = useAuth();
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await signUp(email, password);
			router.push('/');
		} catch (err: any) {
			setError(err?.message ?? 'Sign up failed');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="mx-auto max-w-md">
			<div className="mb-6">
				<h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Create account</h1>
				<p className="mt-1 text-sm text-neutral-600">Start your journey today</p>
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
					<button
						disabled={loading}
						className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
					>
						{loading ? 'Creating…' : 'Sign up'}
					</button>
				</form>
				<div className="mt-4 text-sm">
					<a className="text-neutral-700 underline underline-offset-4 hover:text-neutral-900" href="/login">Have an account? Log in</a>
				</div>
			</div>
		</div>
	);
}
 

