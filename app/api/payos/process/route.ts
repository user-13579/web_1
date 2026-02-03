import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { PayOS } from '@payos/node';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { getPayOSAccount } from '@/lib/payosAccounts';

// Grant access to user based on product type (same as webhook)
async function grantAccess(
	db: ReturnType<typeof getDb>,
	uid: string | null,
	email: string | null,
	product: string,
	courseId?: string,
	packageId?: string
) {
	if (!uid) {
		// If no UID, store in preauthorized_access collection for email-based access
		if (email) {
			const preauthRef = doc(db, 'preauthorized_access', email.toLowerCase());
			const preauthData: { purchases?: Record<string, boolean> } = {};
			preauthData.purchases = {};

			switch (product) {
				case 'meals':
					preauthData.purchases.meals = true;
					break;
				case 'course':
					if (courseId) {
						preauthData.purchases[`course_${courseId}`] = true;
					}
					break;
				case 'mentor':
					if (packageId) {
						preauthData.purchases[`mentor_${packageId}`] = true;
					}
					break;
			}

			await setDoc(preauthRef, preauthData, { merge: true });
		}
		return;
	}

	// Grant access directly to user
	const userRef = doc(db, 'users', uid);
	// Check if document exists first
	const userSnap = await getDoc(userRef);
	if (!userSnap.exists()) {
		// Create new document with empty purchases object first
		await setDoc(userRef, { 
			purchases: {},
		});
	}
	// Use updateDoc with nested path - this will preserve all existing purchases
	// Firestore will create the purchases object if it doesn't exist
	switch (product) {
		case 'meals':
			await updateDoc(userRef, { 'purchases.meals': true });
			break;
		case 'course':
			if (courseId) {
				await updateDoc(userRef, { [`purchases.course_${courseId}`]: true });
			}
			break;
		case 'mentor':
			if (packageId) {
				await updateDoc(userRef, { [`purchases.mentor_${packageId}`]: true });
			}
			break;
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { orderCode } = body;

		if (!orderCode) {
			return NextResponse.json({ error: 'Missing orderCode' }, { status: 400 });
		}

		// Get PayOS account (Bs Hoàng Hiệp)
		const account = getPayOSAccount('bank2');
		const { clientId, apiKey, checksumKey } = account;

		if (!clientId || !apiKey || !checksumKey) {
			return NextResponse.json(
				{ error: 'Missing PayOS credentials (PAYOS_CLIENT_ID_2, PAYOS_API_KEY_2, PAYOS_CHECKSUM_KEY_2)' },
				{ status: 500 }
			);
		}

		// Initialize PayOS client
		const payOS = new PayOS({
			clientId,
			apiKey,
			checksumKey,
		});

		// Get payment information from PayOS
		console.log('Checking PayOS payment status for orderCode:', orderCode);
		
		let paymentInfo: any;
		try {
			// Try using the PayOS SDK method (method name may vary)
			// Common method names: getPaymentLinkInformation, getPaymentInformation, getPayment
			if (typeof (payOS.paymentRequests as any).getPaymentLinkInformation === 'function') {
				paymentInfo = await (payOS.paymentRequests as any).getPaymentLinkInformation(orderCode);
			} else if (typeof (payOS.paymentRequests as any).getPaymentInformation === 'function') {
				paymentInfo = await (payOS.paymentRequests as any).getPaymentInformation(orderCode);
			} else {
				// Fallback: use direct API call
				const response = await fetch(`https://api.payos.vn/v2/payment-requests/${orderCode}`, {
					method: 'GET',
					headers: {
						'x-client-id': clientId,
						'x-api-key': apiKey,
					},
				});
				
				if (!response.ok) {
					throw new Error(`PayOS API returned ${response.status}: ${await response.text()}`);
				}
				
				paymentInfo = await response.json();
			}
		} catch (apiError: any) {
			console.error('Error calling PayOS API:', apiError);
			// If API call fails, we can still process based on Firestore status
			// But for now, return error
			throw new Error(`Failed to check PayOS payment status: ${apiError?.message || 'Unknown error'}`);
		}

		console.log('PayOS payment info:', {
			orderCode: paymentInfo?.orderCode || paymentInfo?.data?.orderCode,
			status: paymentInfo?.status || paymentInfo?.data?.status,
			amount: paymentInfo?.amount || paymentInfo?.data?.amount,
		});

		// Check if payment was successful
		const paymentStatus = paymentInfo?.status || paymentInfo?.data?.status;
		const isPaid = 
			paymentStatus === 'PAID' || 
			paymentStatus === 'COMPLETED' ||
			paymentStatus === 'SUCCESS' ||
			paymentInfo?.code === '00';

		if (!isPaid) {
			return NextResponse.json({
				success: false,
				status: paymentStatus,
				message: 'Payment not yet completed',
			}, { status: 200 });
		}

		// Get order information from Firestore
		const db = getDb();
		const orderRef = doc(db, 'payos_orders', orderCode.toString());
		const orderSnap = await getDoc(orderRef);

		if (!orderSnap.exists()) {
			return NextResponse.json({ error: 'Order not found in Firestore' }, { status: 404 });
		}

		const orderData = orderSnap.data() as {
			uid?: string | null;
			email?: string | null;
			product: string;
			courseId?: string;
			packageId?: string;
			status: string;
		};

		// Check if already processed (idempotency)
		if (orderData.status === 'PAID' || orderData.status === 'COMPLETED') {
			return NextResponse.json({
				success: true,
				status: 'already_processed',
				message: 'Payment already processed',
			}, { status: 200 });
		}

		// Update order status
		await updateDoc(orderRef, {
			status: 'PAID',
			paidAt: new Date().toISOString(),
			paymentLinkId: paymentInfo?.paymentLinkId || paymentInfo?.data?.paymentLinkId || null,
		});

		// Grant access to user
		await grantAccess(
			db,
			orderData.uid || null,
			orderData.email || null,
			orderData.product,
			orderData.courseId,
			orderData.packageId
		);

		return NextResponse.json({
			success: true,
			status: 'PAID',
			message: 'Payment processed and access granted',
			product: orderData.product,
		}, { status: 200 });

	} catch (err: any) {
		console.error('PayOS process error:', err);
		console.error('Error details:', {
			message: err?.message,
			code: err?.code,
			status: err?.status,
		});

		// If PayOS API returns specific error codes, handle them
		if (err?.code === 'PAYMENT_NOT_FOUND' || err?.status === 404) {
			return NextResponse.json({
				success: false,
				error: 'Payment not found in PayOS',
				message: 'The payment link may have expired or the order code is invalid',
			}, { status: 404 });
		}

		return NextResponse.json({
			success: false,
			error: err?.message ?? 'Failed to process payment',
			details: process.env.NODE_ENV === 'development' ? err?.stack : undefined
		}, { status: 500 });
	}
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

