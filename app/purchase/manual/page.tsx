'use client';

import Image from 'next/image';

export default function ManualPaymentPage() {
	return (
		<div className="mx-auto max-w-xl">
			<h1 className="mb-4 text-2xl font-semibold tracking-tight text-neutral-900">Manual payment</h1>
			<p className="mb-4 text-sm text-neutral-700">Scan the QR code to send payment. After we confirm, your access will be enabled.</p>
			<div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
				<div className="relative mx-auto h-64 w-64">
					<Image src="/qr.png" alt="Bank transfer QR code" fill className="object-contain" />
				</div>
				<div className="mt-4 text-sm text-neutral-700">
					- Amount: specify on the checkout page or per instructions provided
					<br />
					- Note: include your account email in the transfer note
				</div>
			</div>
			<p className="mt-4 text-sm text-neutral-700">Once paid, you can return here or the original page. We will grant access shortly.</p>
		</div>
	);
}
