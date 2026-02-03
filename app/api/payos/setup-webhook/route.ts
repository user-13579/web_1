import { NextResponse } from 'next/server';
import { PayOS } from '@payos/node';
import { getPayOSAccount } from '@/lib/payosAccounts';

/**
 * API route to configure PayOS webhook URL (Bs Hoàng Hiệp account)
 * 
 * This endpoint can be called to set up the webhook URL in PayOS
 * Usage: POST /api/payos/setup-webhook
 * 
 * Note: This is a convenience endpoint. You can also use the script:
 * node scripts/setup-payos-webhook.js
 */
export async function POST(request: Request) {
	try {
		const account = getPayOSAccount('bank2');
		const { clientId, apiKey, checksumKey } = account;

		if (!clientId || !apiKey || !checksumKey) {
			return NextResponse.json(
				{ 
					success: false,
					error: 'Missing PayOS credentials',
					missing: {
						clientId: !clientId,
						apiKey: !apiKey,
						checksumKey: !checksumKey,
					},
					hint: 'Make sure PAYOS_CLIENT_ID_2, PAYOS_API_KEY_2, and PAYOS_CHECKSUM_KEY_2 are set in Vercel environment variables'
				},
				{ status: 500 }
			);
		}

		// Get webhook URL from request body or use default
		const body = await request.json().catch(() => ({}));
		const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://web-1-tawny.vercel.app';
		const webhookUrl = body.webhookUrl || `${origin}/api/payos/webhook`;

		console.log('Configuring PayOS webhook:', webhookUrl);

		// Try using PayOS SDK first
		try {
			const payOS = new PayOS({
				clientId: clientId,
				apiKey: apiKey,
				checksumKey: checksumKey,
			});

			// Check if SDK has webhook configuration method
			if (typeof (payOS as any).confirmWebhook === 'function') {
				const result = await (payOS as any).confirmWebhook({ webhookUrl });
				if (result && result.code === '00') {
					return NextResponse.json(
						{
							success: true,
							message: 'Webhook configured successfully using SDK',
							data: result.data,
							webhookUrl: webhookUrl,
						},
						{ status: 200 }
					);
				}
			}
		} catch (sdkError: any) {
			console.log('SDK method not available, trying direct API call:', sdkError.message);
		}

		// Fallback: Direct API call with better error handling
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			// Use the correct PayOS webhook setup endpoint
			// Try api-merchant.payos.vn first (production), fallback to api.payos.vn
			const apiUrl = 'https://api-merchant.payos.vn/v2/payment-requests/webhook';
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-client-id': clientId,
					'x-api-key': apiKey,
				},
				body: JSON.stringify({
					webhookUrl: webhookUrl,
				}),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			const result = await response.json();

			if (response.ok && result.code === '00') {
				return NextResponse.json(
					{
						success: true,
						message: 'Webhook configured successfully',
						data: result.data,
						webhookUrl: webhookUrl,
					},
					{ status: 200 }
				);
			} else {
				return NextResponse.json(
					{
						success: false,
						error: result.desc || 'Failed to configure webhook',
						code: result.code,
						status: response.status,
						details: result,
					},
					{ status: response.status }
				);
			}
		} catch (fetchError: any) {
			console.error('Direct API call failed:', fetchError);
			
			// Provide helpful error message and alternative methods
			return NextResponse.json(
				{
					success: false,
					error: 'Failed to connect to PayOS API',
					details: fetchError?.message || 'Network error',
					alternativeMethods: {
						method1: 'Configure webhook directly from your local machine using curl',
						method2: 'Use PayOS dashboard if available',
						method3: 'Contact PayOS support for webhook configuration',
					},
					curlCommand: `curl -X POST https://api.payos.vn/v2/webhook/setup \\
  -H "Content-Type: application/json" \\
  -H "x-client-id: ${clientId}" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{"webhookUrl": "${webhookUrl}"}'`,
				},
				{ status: 500 }
			);
		}
	} catch (err: any) {
		console.error('Error setting up PayOS webhook:', err);
		return NextResponse.json(
			{
				success: false,
				error: err?.message ?? 'Failed to configure webhook',
				stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
			},
			{ status: 500 }
		);
	}
}

// Allow GET for easy testing
export async function GET(request: Request) {
	return NextResponse.json({
		message: 'PayOS webhook setup endpoint',
		usage: 'POST to this endpoint to configure the webhook URL',
		example: {
			method: 'POST',
			body: {
				webhookUrl: 'https://your-domain.vercel.app/api/payos/webhook'
			}
		}
	}, { status: 200 });
}

