import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import { getPayOSAccount } from '@/lib/payosAccounts';

/**
 * Manual payment processing endpoint
 * Use this to manually process a payment if webhook didn't work
 * 
 * Usage: POST /api/payos/manual-process
 * Body: { orderCode: 1763358892771902 }
 */
export async function POST(request: Request) {
	try {
		const body = await request.json().catch(() => ({}));
		const orderCode = body.orderCode;

		if (!orderCode) {
			return NextResponse.json(
				{ 
					error: 'Missing orderCode',
					received: body,
					example: { orderCode: 1763358892771902 }
				},
				{ status: 400 }
			);
		}

		console.log(`🔧 Manual processing for order: ${orderCode} (type: ${typeof orderCode})`);

		// Get order from Firestore using Admin SDK (bypasses security rules)
		const db = getAdminDb();
		const orderRef = db.collection('payos_orders').doc(orderCode.toString());
		let orderSnap = await orderRef.get();

		// If order doesn't exist, try to fetch from PayOS and create it
		if (!orderSnap.exists) {
			console.warn(`⚠️ Order ${orderCode} not found in Firestore, attempting to fetch from PayOS...`);
			
			try {
				const account = getPayOSAccount('bank2');
				const { clientId, apiKey } = account;

				if (!clientId || !apiKey) {
					return NextResponse.json(
						{ 
							error: 'Order not found in Firestore and cannot fetch from PayOS (missing credentials)',
							orderCode: orderCode.toString(),
							hint: 'Set PAYOS_CLIENT_ID_2 and PAYOS_API_KEY_2 environment variables, or create the order manually in Firestore.',
						},
						{ status: 404 }
					);
				}

				// Fetch order from PayOS
				const payosResponse = await fetch(
					`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`,
					{
						method: 'GET',
						headers: {
							'x-client-id': clientId,
							'x-api-key': apiKey,
						},
					}
				);

				if (!payosResponse.ok) {
					const errorText = await payosResponse.text();
					console.error(`❌ Failed to fetch order from PayOS: ${payosResponse.status} ${errorText}`);
					return NextResponse.json(
						{ 
							error: 'Order not found in Firestore and PayOS API returned error',
							orderCode: orderCode.toString(),
							payosStatus: payosResponse.status,
							payosError: errorText,
						},
						{ status: 404 }
					);
				}

				const payosData = await payosResponse.json();
				console.log('📥 PayOS order data:', JSON.stringify(payosData, null, 2));

				// Infer product type from description
				const description = payosData.data?.description || '';
				let product = 'meals'; // Default
				let courseId: string | null = null;
				let packageId: string | null = null;

				if (description.toLowerCase().includes('course') || description.toLowerCase().includes('khóa học')) {
					product = 'course';
					// Try to extract course ID from description if possible
					const courseMatch = description.match(/course[_\s]?([a-z0-9]+)/i);
					if (courseMatch) {
						courseId = courseMatch[1];
					}
				} else if (description.toLowerCase().includes('mentor') || description.toLowerCase().includes('tư vấn')) {
					product = 'mentor';
					// Try to extract package ID from description if possible
					const packageMatch = description.match(/package[_\s]?([a-z0-9]+)/i);
					if (packageMatch) {
						packageId = packageMatch[1];
					}
				} else if (description.toLowerCase().includes('meal') || description.toLowerCase().includes('bữa ăn')) {
					product = 'meals';
				}

				// Create order in Firestore from PayOS data
				// Note: This is a fallback - ideally orders should be created during checkout
				const orderData = {
					orderCode: parseInt(orderCode.toString()),
					uid: null,
					email: null, // Can't get from PayOS API response
					product,
					courseId,
					packageId,
					amount: payosData.data?.amount || 0,
					status: payosData.data?.status === 'PAID' ? 'PAID' : 'PENDING',
					createdAt: payosData.data?.createdAt || new Date().toISOString(),
					paymentLinkId: payosData.data?.paymentLinkId || null,
					description: description,
					reconstructed: true, // Flag to indicate this was created from PayOS data
				};

				await orderRef.set(orderData);
				console.log(`✅ Created order ${orderCode} in Firestore from PayOS data`);
				
				// Re-fetch the order
				orderSnap = await orderRef.get();
			} catch (fetchError: any) {
				console.error('❌ Error fetching order from PayOS:', fetchError);
				return NextResponse.json(
					{ 
						error: 'Order not found in Firestore and failed to fetch from PayOS',
						orderCode: orderCode.toString(),
						message: fetchError?.message,
						hint: 'Create the order manually in Firestore or check if the orderCode is correct.',
					},
					{ status: 404 }
				);
			}
		}

		if (!orderSnap.exists) {
			return NextResponse.json(
				{ 
					error: 'Order not found after attempting to create from PayOS',
					orderCode: orderCode.toString(),
				},
				{ status: 404 }
			);
		}

		const orderDataRaw = orderSnap.data();
		const orderData = orderDataRaw as {
			uid?: string | null;
			email?: string | null;
			product: string;
			courseId?: string;
			packageId?: string;
			status: string;
			amount?: number;
		};

		// Check if already processed
		if (orderData.status === 'PAID' || orderData.status === 'COMPLETED') {
			return NextResponse.json({
				success: true,
				message: 'Order already processed',
				status: orderData.status,
			});
		}

		// Update order status
		await orderRef.update({
			status: 'PAID',
			paidAt: new Date().toISOString(),
			manuallyProcessed: true,
			manuallyProcessedAt: new Date().toISOString(),
		});

		// Grant access based on product
		if (orderData.uid) {
			const userRef = db.collection('users').doc(orderData.uid);
			const userSnap = await userRef.get();
			
			if (!userSnap.exists) {
				await userRef.set({ purchases: {} });
			}

			switch (orderData.product) {
				case 'meals':
					await userRef.update({ 'purchases.meals': true });
					break;
				case 'course':
					if (orderData.courseId) {
						await userRef.update({ [`purchases.course_${orderData.courseId}`]: true });
					}
					break;
				case 'mentor':
					if (orderData.packageId) {
						await userRef.update({ [`purchases.mentor_${orderData.packageId}`]: true });
					}
					break;
			}
		} else if (orderData.email) {
			const preauthRef = db.collection('preauthorized_access').doc(orderData.email.toLowerCase());
			const preauthData: { purchases?: Record<string, boolean> } = { purchases: {} };

			switch (orderData.product) {
				case 'meals':
					preauthData.purchases!.meals = true;
					break;
				case 'course':
					if (orderData.courseId) {
						preauthData.purchases![`course_${orderData.courseId}`] = true;
					}
					break;
				case 'mentor':
					if (orderData.packageId) {
						preauthData.purchases![`mentor_${orderData.packageId}`] = true;
					}
					break;
			}

			await preauthRef.set(preauthData, { merge: true });
		}

		// Send purchase confirmation email
		const userEmail = orderData.uid 
			? (await db.collection('users').doc(orderData.uid).get()).data()?.email 
			: orderData.email;
		
		if (userEmail) {
			try {
				await sendPurchaseConfirmationEmail({
					email: userEmail,
					product: orderData.product,
					productName: '', // Will be generated in the function
					orderCode: orderCode,
					amount: orderData.amount,
					courseId: orderData.courseId,
					packageId: orderData.packageId,
				});
			} catch (emailError: any) {
				console.error('❌ Failed to send purchase confirmation email:', emailError);
				// Don't throw - email failure shouldn't break the purchase flow
			}
		}

		return NextResponse.json({
			success: true,
			message: 'Order processed manually',
			orderCode,
			product: orderData.product,
		});
	} catch (err: any) {
		console.error('❌ Manual processing error:', err);
		console.error('❌ Error details:', {
			message: err?.message,
			stack: err?.stack,
			name: err?.name,
			code: err?.code,
		});
		return NextResponse.json(
			{
				error: 'Failed to process order',
				message: err?.message || 'Unknown error',
				details: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
			},
			{ status: 500 }
		);
	}
}

