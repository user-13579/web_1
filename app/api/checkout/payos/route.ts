import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { doc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { PayOS } from '@payos/node';
import { getPayOSAccount, type PayOSAccountId } from '@/lib/payosAccounts';

// Generate HMAC SHA256 signature for PayOS
function generateSignature(data: string, checksumKey: string): string {
	return crypto.createHmac('sha256', checksumKey).update(data).digest('hex');
}

// Generate unique order code
// PayOS requires: order_code must not be greater than 9007199254740991 (Number.MAX_SAFE_INTEGER)
// We'll use: timestamp (10 digits, seconds) + random (6 digits) = 16 digits max
function generateOrderCode(): number {
	// Use seconds timestamp (10 digits) + random (6 digits) = 16 digits max
	// This ensures we stay under Number.MAX_SAFE_INTEGER (9007199254740991)
	const timestamp = Math.floor(Date.now() / 1000); // Convert to seconds (10 digits)
	const random = Math.floor(Math.random() * 1000000); // 6 digits
	const orderCode = parseInt(`${timestamp}${random.toString().padStart(6, '0')}`);
	
	// Ensure it doesn't exceed max safe integer
	const maxSafe = 9007199254740991;
	if (orderCode > maxSafe) {
		// If too large, use a shorter format: timestamp (9 digits) + random (7 digits)
		const shortTimestamp = timestamp % 1000000000; // Last 9 digits
		return parseInt(`${shortTimestamp}${random.toString().padStart(7, '0')}`);
	}
	
	return orderCode;
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: Request) {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
}

export async function POST(request: Request) {
	try {
		// Parse request body with better error handling
		let body: any;
		try {
			body = await request.json();
		} catch (parseError) {
			console.error('Failed to parse request body:', parseError);
			return NextResponse.json(
				{ error: 'Invalid request body. Expected JSON.' },
				{ 
					status: 400,
					headers: {
						'Access-Control-Allow-Origin': '*',
					}
				}
			);
		}

		const { uid, email, product, courseId, packageId, amount, bankAccountId } = body;

		// Validate required fields
		if (!product) {
			return NextResponse.json(
				{ error: 'Missing product type' },
				{
					status: 400,
					headers: {
						'Access-Control-Allow-Origin': '*',
					}
				}
			);
		}

		// Validate product types
		const validProducts = ['meals', 'course', 'mentor', 'combo'];
		if (!validProducts.includes(product)) {
			return NextResponse.json({ error: 'Invalid product type' }, { status: 400 });
		}

		// Validate courseId for course purchases
		if (product === 'course' && !courseId) {
			return NextResponse.json({ error: 'Missing courseId for course purchase' }, { status: 400 });
		}

		// Validate packageId for mentor purchases
		if (product === 'mentor' && !packageId) {
			return NextResponse.json({ error: 'Missing packageId for mentor purchase' }, { status: 400 });
		}

		// Validate amount
		if (!amount || amount <= 0 || isNaN(amount)) {
			console.error('Invalid amount received:', { amount, product, courseId, packageId });
			return NextResponse.json({ 
				error: `Invalid amount: ${amount}. Amount must be greater than 0.` 
			}, { status: 400 });
		}

		// Get PayOS account (default to bank2 - Bs Hoàng Hiệp)
		const accountId: PayOSAccountId = (bankAccountId as PayOSAccountId) || 'bank2';
		let payOSAccount;
		try {
			payOSAccount = getPayOSAccount(accountId);
		} catch (error: any) {
			console.error(`Failed to get PayOS account ${accountId}:`, error);
			return NextResponse.json(
				{ error: `Invalid bank account selected: ${accountId}` },
				{
					status: 400,
					headers: {
						'Access-Control-Allow-Origin': '*',
					}
				}
			);
		}

		const { clientId, apiKey, checksumKey } = payOSAccount;

		if (!clientId || !apiKey || !checksumKey) {
			console.error(`Missing PayOS credentials for account ${accountId}:`, {
				hasClientId: !!clientId,
				hasApiKey: !!apiKey,
				hasChecksumKey: !!checksumKey,
			});
			return NextResponse.json(
				{ error: `Missing PayOS credentials for ${payOSAccount.name}. Please configure environment variables.` },
				{
					status: 500,
					headers: {
						'Access-Control-Allow-Origin': '*',
					}
				}
			);
		}

		// Get origin from request URL (more reliable than headers)
		const requestUrl = new URL(request.url);
		// Use production URL if set, otherwise derive from request
		let origin = process.env.NEXT_PUBLIC_APP_URL;
		
		if (!origin) {
			// Derive from request URL
			if (requestUrl.host.includes('localhost')) {
				origin = 'http://localhost:3000';
			} else if (requestUrl.host.includes('vercel.app') || requestUrl.host.includes('web-1-tawny')) {
				origin = `https://${requestUrl.host}`;
			} else {
				origin = `${requestUrl.protocol}//${requestUrl.host}`;
			}
		}

		// Generate unique order code
		const orderCode = generateOrderCode();

		// Build product description
		let description = '';
		let itemName = '';
		switch (product) {
			case 'meals':
				description = 'All Meals Access';
				itemName = 'All Meals Access';
				break;
			case 'course':
				description = `Course Access: ${courseId || 'Unknown'}`;
				itemName = `Course: ${courseId || 'Unknown'}`;
				break;
			case 'mentor':
				description = `Mentor Package: ${packageId || 'Unknown'}`;
				itemName = `Mentor Package: ${packageId || 'Unknown'}`;
				break;
			case 'combo':
				description = 'Complete Healing Combo';
				itemName = 'Combo: All Meals + Healing Materials';
				break;
		}

		// Prepare payment request data
		const paymentData = {
			orderCode,
			amount: Math.round(amount), // Ensure integer
			description,
			items: [
				{
					name: itemName,
					quantity: 1,
					price: Math.round(amount),
				},
			],
			cancelUrl: `${origin}/purchase/cancel?product=${product}`,
			returnUrl: `${origin}/api/payos/callback?orderCode=${orderCode}`,
		};

		// Create signature for request (PayOS may require this in some cases)
		const dataString = JSON.stringify(paymentData);
		const signature = generateSignature(dataString, checksumKey);

		// Store order information in Firestore for later reference
		// Note: This requires Firestore security rules to allow writes to payos_orders
		try {
			const db = getDb();
			const orderRef = doc(db, 'payos_orders', orderCode.toString());
			await setDoc(orderRef, {
				orderCode,
				uid: uid || null,
				email: email || null,
				product,
				courseId: product === 'course' ? courseId : null,
				packageId: product === 'mentor' ? packageId : null,
				amount: Math.round(amount),
				status: 'PENDING',
				createdAt: new Date().toISOString(),
				bankAccountId: accountId, // Store which bank account was used
				...(product === 'combo' ? { comboId: 'combo1' } : {}),
			});
		} catch (firestoreError: any) {
			// Log error but don't fail the checkout - order will be created in PayOS anyway
			console.error('Failed to store order in Firestore:', firestoreError);
			// Continue with PayOS API call - we can store order later via webhook
		}

		// Call PayOS API using official SDK
		try {
			console.log('Creating PayOS client:', {
				bankAccountId: accountId,
				bankAccountName: payOSAccount.name,
				hasClientId: !!clientId,
				hasApiKey: !!apiKey,
				hasChecksumKey: !!checksumKey,
				orderCode,
				amount: Math.round(amount),
			});

			// Initialize PayOS client
			const payOS = new PayOS({
				clientId: clientId,
				apiKey: apiKey,
				checksumKey: checksumKey,
			});

			// Create payment link using SDK
			const paymentLinkData = await payOS.paymentRequests.create({
				orderCode: orderCode,
				amount: Math.round(amount),
				description: description,
				items: paymentData.items,
				cancelUrl: paymentData.cancelUrl,
				returnUrl: paymentData.returnUrl,
			});

			console.log('PayOS payment link created:', {
				checkoutUrl: paymentLinkData.checkoutUrl,
				qrCode: paymentLinkData.qrCode,
				paymentLinkId: paymentLinkData.paymentLinkId,
			});

			// Return both checkout URL and QR code
			if (paymentLinkData.checkoutUrl) {
				return NextResponse.json(
					{
						checkoutUrl: paymentLinkData.checkoutUrl,
						qrCode: paymentLinkData.qrCode || null,
						orderCode,
						paymentLinkId: paymentLinkData.paymentLinkId,
					},
					{
						status: 200,
						headers: {
							'Access-Control-Allow-Origin': '*',
						}
					}
				);
			}

			return NextResponse.json(
				{ error: 'No checkout URL in response from PayOS SDK' },
				{
					status: 500,
					headers: {
						'Access-Control-Allow-Origin': '*',
					}
				}
			);
		} catch (payosError: any) {
			console.error('PayOS SDK error:', payosError);
			console.error('PayOS SDK error details:', {
				message: payosError?.message,
				code: payosError?.code,
				status: payosError?.status,
				stack: payosError?.stack,
			});

			// Provide user-friendly error messages
			let errorMessage = 'Failed to create PayOS payment link';
			if (payosError?.message) {
				errorMessage = payosError.message;
			} else if (payosError?.code) {
				errorMessage = `PayOS error: ${payosError.code}`;
			}

			return NextResponse.json(
				{
					error: errorMessage,
					details: 'Check PayOS credentials and API status',
					debug: process.env.NODE_ENV === 'development' ? {
						errorCode: payosError?.code,
						errorStatus: payosError?.status,
						errorMessage: payosError?.message,
					} : undefined,
				},
				{
					status: 500,
					headers: {
						'Access-Control-Allow-Origin': '*',
					}
				}
			);
		}
	} catch (err: any) {
		console.error('PayOS checkout route error:', err);
		console.error('Error stack:', err?.stack);
		return NextResponse.json(
			{
				error: err?.message ?? 'Failed to create PayOS payment',
				details: process.env.NODE_ENV === 'development' ? err?.stack : undefined
			},
			{
				status: 500,
				headers: {
					'Access-Control-Allow-Origin': '*',
				}
			}
		);
	}
}

// Export runtime config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

