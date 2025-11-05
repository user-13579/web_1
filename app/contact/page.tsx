'use client';

export default function ContactPage() {
	return (
		<div className="mx-auto max-w-3xl p-6">
			<div className="mb-8">
				<h1 className="text-3xl font-semibold tracking-tight">Contact us</h1>
				<p className="mt-1 text-sm text-neutral-600">Get in touch with us through the following channels.</p>
			</div>

			<div className="grid gap-6 sm:grid-cols-2">
				{/* Hotline Card */}
				<div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-8 shadow-[0_8px_30px_rgba(245,158,11,0.12)] elev-1">
					<div className="mb-4 flex items-center gap-3">
						<div className="rounded-full bg-amber-900/10 p-3">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-900">
								<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
							</svg>
						</div>
						<h2 className="text-xl font-semibold">Hotline</h2>
					</div>
					<a 
						href="tel:+84123456789" 
						className="block text-2xl font-bold text-amber-900 transition-colors hover:text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 rounded-lg"
					>
						+84 123 456 789
					</a>
					<p className="mt-2 text-sm text-neutral-600">Available Monday - Friday, 9:00 AM - 6:00 PM</p>
				</div>

				{/* Email Card */}
				<div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-8 shadow-[0_8px_30px_rgba(245,158,11,0.12)] elev-1">
					<div className="mb-4 flex items-center gap-3">
						<div className="rounded-full bg-amber-900/10 p-3">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-900">
								<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
								<polyline points="22,6 12,13 2,6" />
							</svg>
						</div>
						<h2 className="text-xl font-semibold">Email</h2>
					</div>
					<a 
						href="mailto:contact@example.com" 
						className="block text-lg font-bold text-amber-900 break-all transition-colors hover:text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 rounded-lg"
					>
						contact@example.com
					</a>
					<p className="mt-2 text-sm text-neutral-600">We'll respond within 24 hours</p>
				</div>
			</div>

			<div className="mt-8 rounded-2xl border border-amber-200/70 bg-white/60 p-6 text-center">
				<p className="text-sm text-neutral-600">
					Need immediate assistance? Call our hotline or send us an email. We're here to help!
				</p>
			</div>
		</div>
	);
}



