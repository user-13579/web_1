import { NextResponse } from 'next/server';
import { getPayOSAccount } from '@/lib/payosAccounts';

/**
 * Check PayOS payment status via API
 * 
 * Usage: GET /api/payos/check-status?paymentLinkId=YOUR_PAYMENT_LINK_ID
 * 
 * This allows you to manually check payment status without waiting for webhook
 */
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const paymentLinkId = searchParams.get('paymentLinkId');
		const orderCode = searchParams.get('orderCode');

		if (!paymentLinkId && !orderCode) {
			return NextResponse.json(
				{ 
					error: 'Missing parameter',
					message: 'Provide either paymentLinkId or orderCode query parameter',
					example: '/api/payos/check-status?paymentLinkId=YOUR_PAYMENT_LINK_ID'
				},
				{ status: 400 }
			);
		}

		const account = getPayOSAccount('bank2');
		const { clientId, apiKey } = account;

		if (!clientId || !apiKey) {
			return NextResponse.json(
				{ 
					error: 'Missing PayOS credentials',
					message: 'PAYOS_CLIENT_ID_2 and PAYOS_API_KEY_2 must be set in environment variables'
				},
				{ status: 500 }
			);
		}

		// Build API URL
		let apiUrl: string;
		if (paymentLinkId) {
			// Check by payment link ID
			apiUrl = `https://api-merchant.payos.vn/v2/payment-requests/${paymentLinkId}`;
		} else if (orderCode) {
			// Check by order code
			apiUrl = `https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`;
		} else {
			return NextResponse.json(
				{ error: 'Invalid parameters' },
				{ status: 400 }
			);
		}

		console.log(`🔍 Checking PayOS payment status: ${apiUrl}`);

		// Call PayOS API
		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'x-client-id': clientId,
				'x-api-key': apiKey,
			},
		});

		const result = await response.json();

		if (!response.ok) {
			return NextResponse.json(
				{
					error: 'PayOS API error',
					status: response.status,
					details: result,
				},
				{ status: response.status }
			);
		}

		// Extract payment status
		const status = result.data?.status || result.status;
		const isPaid = status === 'PAID' || status === 'paid';

		return NextResponse.json({
			success: true,
			status: status,
			isPaid: isPaid,
			data: result.data || result,
			message: isPaid 
				? 'Payment is confirmed (PAID)' 
				: `Payment status: ${status} (may be pending or processing)`,
		});
	} catch (err: any) {
		console.error('❌ Error checking payment status:', err);
		return NextResponse.json(
			{
				error: 'Failed to check payment status',
				message: err?.message || 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

