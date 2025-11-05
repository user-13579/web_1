'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function AccountPage() {
	const { user, logOut, sendVerificationEmail, reloadUser } = useAuth();
	const [verifying, setVerifying] = useState(false);
	const [verifySent, setVerifySent] = useState(false);
	const [verifyError, setVerifyError] = useState<string | null>(null);
	const router = useRouter();

	if (!user) {
		router.push('/login');
		return null;
	}

	const verified = user.emailVerified;

	return (
		<div className="mx-auto max-w-lg">
			<h1 className="mb-6 text-3xl font-semibold tracking-tight text-neutral-900">Account</h1>
			<div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
				<div className="mb-1 text-sm text-neutral-600">Signed in as</div>
				<div className="mb-2 text-base font-medium text-neutral-900">{user.email}</div>
				<div className="mb-6 text-xs">
					{verified ? (
						<span className="rounded-full border border-emerald-300/80 bg-emerald-50 px-2 py-0.5 text-emerald-700">Email verified</span>
					) : (
						<span className="rounded-full border border-amber-300/80 bg-amber-50 px-2 py-0.5 text-amber-800">Email not verified</span>
					)}
				</div>
				<div className="flex flex-wrap gap-3">
					{!verified && (
						<div className="flex flex-col gap-1">
						<button
							className="rounded-full border border-amber-300/80 bg-amber-50 px-4 py-2 text-sm text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
							disabled={verifying || verifySent}
							onClick={async () => {
								setVerifyError(null);
								setVerifying(true);
								try {
									await sendVerificationEmail();
									setVerifySent(true);
								} catch (err: any) {
									const code: string = err?.code ?? '';
									const msg: string = err?.message ?? '';
									if (code.includes('too-many-requests') || msg.toLowerCase().includes('too many')) {
										setVerifyError('Too many attempts. Please wait a few minutes and try again. Also check your spam folder.');
									} else if (msg) {
										setVerifyError(msg);
									} else {
										setVerifyError('Unable to send verification email right now. Please try again later.');
									}
								} finally {
									setVerifying(false);
								}
							}}
						>
							{verifySent ? 'Verification email sent' : verifying ? 'Sending…' : 'Verify email'}
						</button>
						{verifyError && <div className="text-sm text-amber-800">{verifyError}</div>}
						<button
							className="rounded-full border border-neutral-300/80 px-4 py-2 text-sm text-neutral-800 transition hover:bg-neutral-50"
							onClick={async () => {
								await reloadUser();
							}}
						>
							I've verified
						</button>
						</div>
					)}
					<a className="rounded-full border border-neutral-300/80 px-4 py-2 text-sm text-neutral-800 transition hover:bg-neutral-50" href="/reset-password">
						Change password
					</a>
					<button
						className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-white transition hover:bg-black"
						onClick={async () => {
							await logOut();
							router.push('/');
						}}
					>
						Log out
					</button>
				</div>
			</div>
		</div>
	);
}
