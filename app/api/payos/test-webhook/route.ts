import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getPayOSAccount } from '@/lib/payosAccounts';

/**
 * Test endpoint to send a test webhook to the webhook handler (Bs Hoàng Hiệp account)
 * GET /api/payos/test-webhook?orderCode=YOUR_ORDER_CODE
 * 
 * This simulates what PayOS would send and calls the webhook endpoint internally
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const orderCode = searchParams.get('orderCode') || '1763287873515874'; // Default to a test order
		
		const account = getPayOSAccount('bank2');
		const checksumKey = account.checksumKey;
		if (!checksumKey) {
			return NextResponse.json({ error: 'Missing PAYOS_CHECKSUM_KEY_2' }, { status: 500 });
		}

		// Create test webhook data matching PayOS format
		const webhookData: {
			code: string;
			desc: string;
			success: boolean;
			data: {
				orderCode: number;
				amount: number;
				description: string;
				accountNumber: string;
				reference: string;
				transactionDateTime: string;
				currency: string;
				paymentLinkId: string;
				code: string;
				desc: string;
				counterAccountBankId: string;
				counterAccountBankName: string;
				counterAccountName: string;
				counterAccountNumber: string;
				virtualAccountName: string;
				virtualAccountNumber: string;
			};
			signature?: string;
		} = {
			code: '00',
			desc: 'success',
			success: true,
			data: {
				orderCode: parseInt(orderCode),
				amount: 3000,
				description: 'Test Payment',
				accountNumber: '12345678',
				reference: 'TEST' + Date.now(),
				transactionDateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
				currency: 'VND',
				paymentLinkId: 'test-payment-link-' + Date.now(),
				code: '00',
				desc: 'Thành công',
				counterAccountBankId: '',
				counterAccountBankName: '',
				counterAccountName: '',
				counterAccountNumber: '',
				virtualAccountName: '',
				virtualAccountNumber: '',
			},
		};

		// Calculate signature using PayOS algorithm (same as webhook route)
		function calculateSignature(data: any, checksumKey: string): string {
			// Sort data by keys alphabetically
			const sortedKeys = Object.keys(data).sort();
			
			// Convert to query string format: key1=value1&key2=value2&...
			const queryStringParts: string[] = [];
			
			for (const key of sortedKeys) {
				let value = data[key];
				
				// Handle null/undefined as empty string
				if (value === null || value === undefined || value === 'null' || value === 'undefined') {
					value = '';
				}
				// Handle arrays by JSON.stringify
				else if (Array.isArray(value)) {
					value = JSON.stringify(value);
				}
				// Handle nested objects by JSON.stringify
				else if (typeof value === 'object') {
					value = JSON.stringify(value);
				}
				// Convert to string
				else {
					value = String(value);
				}
				
				queryStringParts.push(`${key}=${value}`);
			}
			
			const queryString = queryStringParts.join('&');
			
			// Calculate HMAC SHA256 signature
			const signature = crypto
				.createHmac('sha256', checksumKey)
				.update(queryString)
				.digest('hex');
			
			return signature;
		}

		// Add signature to webhook data
		webhookData.signature = calculateSignature(webhookData.data, checksumKey);

		// Call the webhook handler directly (internal call)
		// This avoids network issues and uses the same environment
		const webhookUrl = `${request.nextUrl.origin}/api/payos/webhook`;
		
		console.log('🧪 Testing webhook with orderCode:', orderCode);
		console.log('Signature:', webhookData.signature);
		
		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(webhookData),
		});

		const responseText = await response.text();
		let responseData: any;
		try {
			responseData = JSON.parse(responseText);
		} catch {
			responseData = responseText;
		}

		return NextResponse.json({
			success: response.ok,
			status: response.status,
			webhookUrl,
			testData: {
				orderCode: webhookData.data.orderCode,
				signature: webhookData.signature.substring(0, 20) + '...',
			},
			response: responseData,
			message: response.ok 
				? '✅ Test webhook sent successfully! Check Vercel logs for webhook processing and Firebase for order status update.'
				: '❌ Test webhook failed. Check the error above.',
		});
	} catch (err: any) {
		console.error('Test webhook error:', err);
		return NextResponse.json(
			{
				success: false,
				error: err?.message ?? 'Failed to test webhook',
				details: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
			},
			{ status: 500 }
		);
	}
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
