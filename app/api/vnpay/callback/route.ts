import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		
		// VNPay callback parameters
		const vnpResponseCode = searchParams.get('vnp_ResponseCode');
		const vnpTransactionStatus = searchParams.get('vnp_TransactionStatus');
		const transactionId = searchParams.get('vnp_TxnRef') || searchParams.get('transactionId');
		const product = searchParams.get('product') || 'meals';
		const courseId = searchParams.get('courseId');
		const packageId = searchParams.get('packageId');
		
		const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

		// TODO: Verify VNPay signature when actual API is provided
		// const isValid = verifyVNPaySignature(searchParams);
		// if (!isValid) {
		//   return NextResponse.redirect(`${origin}/purchase/vnpay?error=invalid_signature`);
		// }

		// Check payment status
		// VNPay response codes: 00 = success, others = failure
		const isSuccess = vnpResponseCode === '00' || vnpTransactionStatus === '00';

		if (isSuccess) {
			// Redirect to success page
			let successUrl = `${origin}/purchase/success?product=${product}`;
			if (courseId) {
				successUrl += `&courseId=${encodeURIComponent(courseId)}`;
			}
			if (packageId) {
				successUrl += `&packageId=${encodeURIComponent(packageId)}`;
			}
			successUrl += `&paymentMethod=vnpay&transactionId=${transactionId}`;
			
			return NextResponse.redirect(successUrl);
		} else {
			// Redirect to failure page
			let cancelUrl = `${origin}/purchase/vnpay?error=payment_failed`;
			if (product === 'course' && courseId) {
				cancelUrl = `${origin}/courses/${encodeURIComponent(courseId)}?canceled=1&error=payment_failed`;
			} else if (product === 'meals') {
				cancelUrl = `${origin}/meals?canceled=1&error=payment_failed`;
			} else if (product === 'mentor') {
				cancelUrl = `${origin}/mentor?canceled=1&error=payment_failed`;
			}
			
			return NextResponse.redirect(cancelUrl);
		}
	} catch (err: any) {
		const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
		return NextResponse.redirect(`${origin}/purchase/vnpay?error=server_error`);
	}
}

export async function POST(request: NextRequest) {
	// IPN (Instant Payment Notification) handler
	// VNPay will POST to this endpoint to notify about payment status
	try {
		const body = await request.json().catch(() => ({}));
		const searchParams = request.nextUrl.searchParams;
		
		// TODO: Verify IPN signature when actual API is provided
		// const isValid = verifyVNPayIPNSignature(body);
		// if (!isValid) {
		//   return NextResponse.json({ RspCode: '97', Message: 'Invalid signature' }, { status: 400 });
		// }

		const transactionId = body.vnp_TxnRef || body.transactionId;
		const responseCode = body.vnp_ResponseCode;
		
		// TODO: Update payment status in database
		// if (responseCode === '00') {
		//   await updatePaymentStatus(transactionId, 'completed');
		//   await grantAccess(product, courseId, packageId, uid);
		// }

		// Return success response to VNPay
		return NextResponse.json({ 
			RspCode: '00', 
			Message: 'Success' 
		}, { status: 200 });
	} catch (err: any) {
		return NextResponse.json({ 
			RspCode: '99', 
			Message: 'Error processing IPN' 
		}, { status: 500 });
	}
}

