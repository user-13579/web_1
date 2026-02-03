import { NextResponse } from 'next/server';
import { getPayOSAccount } from '@/lib/payosAccounts';

/**
 * Test endpoint to verify PayOS credentials and API connectivity (Bs Hoàng Hiệp account)
 * GET /api/checkout/payos/test
 */
export async function GET(request: Request) {
	try {
		const account = getPayOSAccount('bank2');
		const { clientId, apiKey, checksumKey } = account;

		const hasCredentials = {
			clientId: !!clientId,
			apiKey: !!apiKey,
			checksumKey: !!checksumKey,
		};

		// Test PayOS API connectivity with multiple endpoints
		const payosEndpoints = [
			'https://api.payos.vn/v2/payment-requests',
			'https://api.payos.vn/payment-requests',
			'https://payos.vn/api/v2/payment-requests',
		];
		
		let apiTest: any = { status: 'not_tested' };
		if (clientId && apiKey) {
			// First, test basic connectivity to PayOS domain
			let connectivityTest: any = {};
			try {
				const domainTest = await fetch('https://api.payos.vn', {
					method: 'GET',
					signal: AbortSignal.timeout(5000),
				});
				connectivityTest.domain = {
					reachable: true,
					status: domainTest.status,
				};
			} catch (domainError: any) {
				connectivityTest.domain = {
					reachable: false,
					error: domainError?.message,
				};
			}
			
			// Test the actual API endpoint
			for (const endpoint of payosEndpoints) {
				let timeoutId: NodeJS.Timeout | null = null;
				try {
					const controller = new AbortController();
					timeoutId = setTimeout(() => controller.abort(), 10000);
					
					const testResponse = await fetch(endpoint, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'x-client-id': clientId,
							'x-api-key': apiKey,
						},
						body: JSON.stringify({
							orderCode: 999999999,
							amount: 1000,
							description: 'Test connection',
							items: [{ name: 'Test', quantity: 1, price: 1000 }],
							cancelUrl: 'https://example.com',
							returnUrl: 'https://example.com',
						}),
						signal: controller.signal,
					});
					
					if (timeoutId) clearTimeout(timeoutId);
					const responseText = await testResponse.text();
					
					apiTest = {
						endpoint: endpoint,
						status: testResponse.status,
						statusText: testResponse.statusText,
						response: responseText.substring(0, 500),
						ok: testResponse.ok,
						connectivityTest,
					};
					break; // If successful, stop testing other endpoints
				} catch (fetchError: any) {
					if (timeoutId) clearTimeout(timeoutId);
					apiTest = {
						endpoint: endpoint,
						status: 'error',
						error: fetchError?.message,
						errorName: fetchError?.name,
						cause: fetchError?.cause?.message,
						connectivityTest,
					};
					// Continue to next endpoint
				}
			}
		}

		return NextResponse.json(
			{
				credentials: hasCredentials,
				apiTest,
				timestamp: new Date().toISOString(),
			},
			{ status: 200 }
		);
	} catch (err: any) {
		return NextResponse.json(
			{
				error: err?.message,
				stack: err?.stack,
			},
			{ status: 500 }
		);
	}
}

