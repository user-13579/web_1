'use client';

import Link from 'next/link';

export default function ExamplePage() {
	return (
		<div className="mx-auto max-w-2xl p-6">
			<h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Example Page</h1>
			<p className="mt-2 text-sm text-neutral-700">
				This is a simple example page. Use the links below to navigate.
			</p>

			<div className="mt-6 grid gap-3 sm:grid-cols-2">
				<Link href="/meals" className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md">
					<span className="block text-lg font-medium text-neutral-900">Meals</span>
					<span className="block text-sm text-neutral-600">Browse meal pictures</span>
				</Link>
				<Link href="/mentor" className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md">
					<span className="block text-lg font-medium text-neutral-900">Mentor</span>
					<span className="block text-sm text-neutral-600">View mentorship packages</span>
				</Link>
			</div>

			<p className="mt-6 text-xs text-neutral-500">Open this page at /example</p>
		</div>
	);
}





