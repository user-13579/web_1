import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	try {
		const { uid, email, product, courseId, packageId, amount } = await request.json().catch(() => ({} as any));
		
		if (!product) {
			return NextResponse.json({ error: 'Missing product type' }, { status: 400 });
		}

		// Validate product types
		const validProducts = ['meals', 'course', 'mentor'];
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

		const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
		
		// Determine amount based on product type
		let finalAmount = amount;
		if (!finalAmount) {
			switch (product) {
				case 'meals':
					finalAmount = 20000; // ₫20,000
					break;
				case 'course':
					finalAmount = 20000; // ₫20,000 per course
					break;
				case 'mentor':
					finalAmount = 50000; // ₫50,000 per package (adjust as needed)
					break;
			}
		}

		// TODO: Replace this with actual VNPay API integration when provided
		// For now, this is a placeholder that returns a payment URL structure
		
		// VNPay integration placeholder - replace with actual API call
		const vnpayConfig = {
			// These will be provided by the user later
			// tmnCode: process.env.VNPAY_TMN_CODE,
			// secretKey: process.env.VNPAY_SECRET_KEY,
			// returnUrl: `${origin}/api/vnpay/callback`,
			// ipnUrl: `${origin}/api/vnpay/ipn`,
		};

		// Generate a unique transaction ID
		const transactionId = `VNPAY_${Date.now()}_${Math.random().toString(36).substring(7)}`;
		
		// Build payment data
		const paymentData = {
			product,
			courseId: product === 'course' ? courseId : undefined,
			packageId: product === 'mentor' ? packageId : undefined,
			amount: finalAmount,
			uid,
			email,
			transactionId,
			timestamp: Date.now(),
		};

		// TODO: Call VNPay API to create payment URL
		// const vnpayUrl = await createVNPayPayment({
		//   amount: finalAmount,
		//   orderId: transactionId,
		//   orderDescription: getProductDescription(product, courseId, packageId),
		//   returnUrl: vnpayConfig.returnUrl,
		//   ipnUrl: vnpayConfig.ipnUrl,
		// });

		// For now, return a placeholder URL that will be replaced with actual VNPay URL
		// In production, this should be the actual VNPay payment URL
		const vnpayUrl = `${origin}/purchase/vnpay?transactionId=${transactionId}&product=${product}${courseId ? `&courseId=${courseId}` : ''}${packageId ? `&packageId=${packageId}` : ''}`;

		return NextResponse.json({ 
			url: vnpayUrl,
			transactionId,
			amount: finalAmount,
		}, { status: 200 });
	} catch (err: any) {
		return NextResponse.json({ error: err?.message ?? 'Failed to create VNPay payment' }, { status: 500 });
	}
}

// Helper function to get product description (will be used in actual VNPay integration)
function getProductDescription(product: string, courseId?: string, packageId?: string): string {
	switch (product) {
		case 'meals':
			return 'All Meals Access';
		case 'course':
			return `Course Access: ${courseId || 'Unknown'}`;
		case 'mentor':
			return `Mentor Package: ${packageId || 'Unknown'}`;
		default:
			return 'Product Purchase';
	}
}

