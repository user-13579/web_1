'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function VNPayPaymentPage() {
	const params = useSearchParams();
	const router = useRouter();
	const { user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [qrCode, setQrCode] = useState<string | null>(null);
	const [transactionId, setTransactionId] = useState<string | null>(null);
	const [amount, setAmount] = useState<number | null>(null);
	const [product, setProduct] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const transactionIdParam = params.get('transactionId');
		const productParam = params.get('product');
		const errorParam = params.get('error');

		if (errorParam) {
			setError(errorParam === 'payment_failed' ? 'Payment failed. Please try again.' : 'An error occurred.');
			return;
		}

		if (transactionIdParam && productParam) {
			setTransactionId(transactionIdParam);
			setProduct(productParam);
			
			// Fetch payment details and QR code
			fetchPaymentDetails(transactionIdParam, productParam);
		}
	}, [params]);

	const fetchPaymentDetails = async (txnId: string, prod: string) => {
		setLoading(true);
		try {
			// TODO: Replace with actual VNPay API call to get QR code
			// For now, this is a placeholder
			// const response = await fetch(`/api/vnpay/qrcode?transactionId=${txnId}`);
			// const data = await response.json();
			// setQrCode(data.qrCode);
			// setAmount(data.amount);

			// Placeholder: Set a default amount based on product
			let defaultAmount = 20000;
			if (prod === 'mentor') {
				defaultAmount = 50000;
			}
			setAmount(defaultAmount);

			// Placeholder QR code - replace with actual VNPay QR code
			// For now, using a placeholder image
			setQrCode('/qr.png'); // This should be replaced with actual VNPay QR code URL
			
			setLoading(false);
		} catch (err) {
			console.error('Failed to fetch payment details:', err);
			setError('Failed to load payment details. Please try again.');
			setLoading(false);
		}
	};

	const handleCheckPayment = async () => {
		if (!transactionId) return;
		
		setLoading(true);
		try {
			// TODO: Check payment status with VNPay API
			// const response = await fetch(`/api/vnpay/check?transactionId=${transactionId}`);
			// const data = await response.json();
			
			// For now, redirect to success page after manual check
			// In production, this should check actual payment status
			if (product) {
				let successUrl = `/purchase/success?product=${product}&paymentMethod=vnpay`;
				const courseId = params.get('courseId');
				const packageId = params.get('packageId');
				if (courseId) successUrl += `&courseId=${encodeURIComponent(courseId)}`;
				if (packageId) successUrl += `&packageId=${encodeURIComponent(packageId)}`;
				router.push(successUrl);
			}
		} catch (err) {
			console.error('Failed to check payment:', err);
			setError('Failed to verify payment. Please contact support.');
			setLoading(false);
		}
	};

	if (error) {
		return (
			<div className="mx-auto max-w-xl">
				<div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
					<h1 className="mb-2 text-xl font-semibold text-red-900">Payment Error</h1>
					<p className="mb-4 text-red-700">{error}</p>
					<button
						onClick={() => router.back()}
						className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
					>
						Go Back
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-xl">
			<h1 className="mb-4 text-2xl font-semibold tracking-tight text-neutral-900">VNPay QR Payment</h1>
			
			{loading && !qrCode ? (
				<div className="flex items-center justify-center py-12">
					<div className="text-neutral-600">Loading payment details...</div>
				</div>
			) : (
				<>
					<div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
						<div className="mb-4 text-center">
							<h2 className="mb-2 text-lg font-semibold text-neutral-900">Scan QR Code to Pay</h2>
							{amount && (
								<p className="text-2xl font-bold text-neutral-900">
									₫{amount.toLocaleString('vi-VN')}
								</p>
							)}
							{transactionId && (
								<p className="mt-2 text-xs text-neutral-500">Transaction ID: {transactionId}</p>
							)}
						</div>
						
						{qrCode && (
							<div className="mx-auto mb-4 flex justify-center">
								<div className="relative h-64 w-64 overflow-hidden rounded-xl border-2 border-neutral-200 bg-white p-4">
									<Image
										src={qrCode}
										alt="VNPay QR Code"
										fill
										className="object-contain"
										priority
									/>
								</div>
							</div>
						)}

						<div className="space-y-2 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-700">
							<p className="font-medium">Instructions:</p>
							<ol className="ml-4 list-decimal space-y-1">
								<li>Open your banking app or VNPay app</li>
								<li>Scan the QR code above</li>
								<li>Confirm the payment amount</li>
								<li>Complete the payment</li>
								<li>Click "I've Paid" below after completing payment</li>
							</ol>
						</div>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row">
						<button
							onClick={handleCheckPayment}
							disabled={loading}
							className="flex-1 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(37,99,235,0.35)] transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
						>
							{loading ? 'Checking...' : "I've Paid"}
						</button>
						<button
							onClick={() => router.back()}
							className="flex-1 rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
						>
							Cancel
						</button>
					</div>

					<p className="mt-4 text-center text-xs text-neutral-500">
						Payment will be processed automatically. If you encounter any issues, please contact support.
					</p>
				</>
			)}
		</div>
	);
}

