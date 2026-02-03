import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { PayOS } from '@payos/node';
import { getPayOSAccount } from '@/lib/payosAccounts';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const orderCode = searchParams.get('orderCode');
		const status = searchParams.get('status'); // PayOS may return status in callback

		// Get origin from request URL (more reliable than headers)
		const requestUrl = new URL(request.url);
		// Use production URL if set, otherwise derive from request
		// For production, NEXT_PUBLIC_APP_URL should be set to https://web-1-tawny.vercel.app
		let origin = process.env.NEXT_PUBLIC_APP_URL;
		
		if (!origin) {
			// Derive from request URL, but ensure it's not localhost in production
			if (requestUrl.host.includes('localhost')) {
				origin = 'http://localhost:3000';
			} else if (requestUrl.host.includes('vercel.app') || requestUrl.host.includes('web-1-tawny')) {
				origin = `https://${requestUrl.host}`;
			} else {
				origin = `${requestUrl.protocol}//${requestUrl.host}`;
			}
		}
		
		console.log('PayOS callback - origin:', origin, 'request URL:', request.url, 'host:', requestUrl.host);

		if (!orderCode) {
			console.error('PayOS callback: Missing orderCode in URL');
			// Still redirect to success page (no cancellation messages)
			return NextResponse.redirect(`${origin}/purchase/success`);
		}

		console.log('PayOS callback: Processing orderCode:', orderCode);

		// Get order information from Firestore
		let db;
		try {
			db = getDb();
			console.log('PayOS callback: Firestore connection established');
		} catch (dbError: any) {
			console.error('PayOS callback: Failed to get Firestore instance:', dbError);
			// Still redirect to success page with orderCode
			return NextResponse.redirect(`${origin}/purchase/success?orderCode=${orderCode}`);
		}

		const orderRef = doc(db, 'payos_orders', orderCode.toString());
		let orderSnap;
		try {
			orderSnap = await getDoc(orderRef);
			console.log('PayOS callback: Order lookup result - exists:', orderSnap.exists());
		} catch (readError: any) {
			console.error('PayOS callback: Failed to read order from Firestore:', readError);
			console.error('Read error details:', {
				message: readError?.message,
				code: readError?.code,
				orderCode: orderCode.toString(),
			});
			// Still redirect to success page with orderCode
			return NextResponse.redirect(`${origin}/purchase/success?orderCode=${orderCode}`);
		}

		if (!orderSnap.exists()) {
			console.error('PayOS callback: Order not found in Firestore:', orderCode);
			// Still redirect to success page with orderCode
			return NextResponse.redirect(`${origin}/purchase/success?orderCode=${orderCode}`);
		}

		const orderData = orderSnap.data();
		console.log('PayOS callback: Order data retrieved:', {
			product: orderData?.product,
			status: orderData?.status,
			hasCourseId: !!orderData?.courseId,
			hasPackageId: !!orderData?.packageId,
		});

		if (!orderData) {
			console.error('PayOS callback: Order data is null or undefined');
			// Still redirect to success page with orderCode
			return NextResponse.redirect(`${origin}/purchase/success?orderCode=${orderCode}`);
		}

		const { product, courseId, packageId, status: orderStatus, uid, email } = orderData as {
			product: string;
			courseId?: string;
			packageId?: string;
			status: string;
			uid?: string | null;
			email?: string | null;
		};

		if (!product) {
			console.error('PayOS callback: Order missing product field');
			// Still redirect to success page with orderCode
			return NextResponse.redirect(`${origin}/purchase/success?orderCode=${orderCode}`);
		}

		// Helper function to grant access
		const grantAccess = async () => {
			try {
				// Update order status if not already PAID
				if (orderStatus !== 'PAID' && orderStatus !== 'COMPLETED') {
					await updateDoc(orderRef, {
						status: 'PAID',
						paidAt: new Date().toISOString(),
					});
				}

				// Grant access to user
				if (uid) {
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
							console.log('PayOS callback: Meals access granted to user:', uid);
							// Double-check it was written
							const verifySnap = await getDoc(userRef);
							const verifyData = verifySnap.data();
							console.log('PayOS callback: Verified purchases after grant:', verifyData?.purchases);
							break;
						case 'course':
							if (courseId) {
								await updateDoc(userRef, { [`purchases.course_${courseId}`]: true });
								console.log('PayOS callback: Course access granted:', courseId, 'to user:', uid);
							}
							break;
						case 'mentor':
							if (packageId) {
								await updateDoc(userRef, { [`purchases.mentor_${packageId}`]: true });
								console.log('PayOS callback: Mentor access granted:', packageId, 'to user:', uid);
							}
							break;
					}
					console.log('PayOS callback: Access granted to user:', uid);
				} else if (email) {
					// Store in preauthorized_access for email-based access
					const preauthRef = doc(db, 'preauthorized_access', email.toLowerCase());
					const preauthData: { purchases?: Record<string, boolean> } = { purchases: {} };
					
					switch (product) {
						case 'meals':
							preauthData.purchases!.meals = true;
							break;
						case 'course':
							if (courseId) {
								preauthData.purchases![`course_${courseId}`] = true;
							}
							break;
						case 'mentor':
							if (packageId) {
								preauthData.purchases![`mentor_${packageId}`] = true;
							}
							break;
					}
					
					await setDoc(preauthRef, preauthData, { merge: true });
					console.log('PayOS callback: Access granted via email:', email);
				}
			} catch (processError: any) {
				console.error('PayOS callback: Error granting access:', processError);
				throw processError;
			}
		};

		// Check PayOS API directly to verify payment status (don't rely on webhook)
		let paymentConfirmed = false;
		let shouldProcess = false;

		// If already processed, grant access again to ensure it's active, then redirect
		if (orderStatus === 'PAID' || orderStatus === 'COMPLETED') {
			paymentConfirmed = true;
			// Still grant access to ensure it's active (in case it was missed)
			shouldProcess = true;
		} else {
			// Check PayOS API directly to verify payment (Bs Hoàng Hiệp account)
			try {
				const account = getPayOSAccount('bank2');
				const { clientId, apiKey, checksumKey } = account;

				if (clientId && apiKey && checksumKey) {
					const payOS = new PayOS({
						clientId,
						apiKey,
						checksumKey,
					});

					// Try to get payment info from PayOS
					let paymentInfo: any;
					try {
						// Try SDK method first
						if (typeof (payOS.paymentRequests as any).getPaymentLinkInformation === 'function') {
							paymentInfo = await (payOS.paymentRequests as any).getPaymentLinkInformation(orderCode);
						} else if (typeof (payOS.paymentRequests as any).getPaymentInformation === 'function') {
							paymentInfo = await (payOS.paymentRequests as any).getPaymentInformation(orderCode);
						} else {
							// Fallback: direct API call
							const response = await fetch(`https://api.payos.vn/v2/payment-requests/${orderCode}`, {
								method: 'GET',
								headers: {
									'x-client-id': clientId,
									'x-api-key': apiKey,
								},
							});
							
							if (response.ok) {
								paymentInfo = await response.json();
							}
						}

						const paymentStatus = paymentInfo?.status || paymentInfo?.data?.status;
						paymentConfirmed = 
							paymentStatus === 'PAID' || 
							paymentStatus === 'COMPLETED' ||
							paymentStatus === 'SUCCESS' ||
							paymentInfo?.code === '00';

						if (paymentConfirmed) {
							shouldProcess = true; // Grant access regardless of current status
						}
					} catch (payosError: any) {
						console.error('PayOS callback: Error checking PayOS API:', payosError);
						// If we can't verify, assume payment might be pending and redirect with orderCode
						// User can access via success page button
					}
				}
			} catch (error: any) {
				console.error('PayOS callback: Error initializing PayOS client:', error);
				// Continue - will redirect with orderCode
			}
		}

		// Only grant access if payment is confirmed
		// Do NOT grant access automatically - wait for webhook or manual verification
		if (shouldProcess && paymentConfirmed) {
			try {
				await grantAccess();
				console.log('PayOS callback: Payment confirmed and access granted successfully');
			} catch (processError: any) {
				console.error('PayOS callback: Error processing payment:', processError);
				// Don't grant access if there's an error - let webhook handle it
			}
		} else {
			console.log('PayOS callback: Payment not confirmed - access will be granted via webhook when payment is verified');
		}

		// Always redirect to success page with orderCode (no cancellation messages)
		// User will see "I have paid" button and click it to see congratulations and access product
		const redirectUrl = `${origin}/purchase/success?orderCode=${orderCode}`;
		return NextResponse.redirect(redirectUrl);
	} catch (err: any) {
		console.error('PayOS callback error:', err);
		console.error('Callback error details:', {
			message: err?.message,
			stack: err?.stack,
			url: request.url,
			orderCode: request.nextUrl.searchParams.get('orderCode'),
		});
		
		// Get origin from request URL
		const requestUrl = new URL(request.url);
		let origin = process.env.NEXT_PUBLIC_APP_URL;
		
		if (!origin) {
			if (requestUrl.host.includes('localhost')) {
				origin = 'http://localhost:3000';
			} else if (requestUrl.host.includes('vercel.app') || requestUrl.host.includes('web-1-tawny')) {
				origin = `https://${requestUrl.host}`;
			} else {
				origin = `${requestUrl.protocol}//${requestUrl.host}`;
			}
		}
		
		// Even on error, try to get order info and redirect to appropriate page
		const orderCode = request.nextUrl.searchParams.get('orderCode');
		if (orderCode) {
			// Always redirect to success page with orderCode (no cancellation messages)
			return NextResponse.redirect(`${origin}/purchase/success?orderCode=${orderCode}`);
		}
		
		// Fallback to success page even if no orderCode
		return NextResponse.redirect(`${origin}/purchase/success`);
	}
}

