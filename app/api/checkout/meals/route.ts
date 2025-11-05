import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
	try {
		if (!stripeSecretKey) {
			return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
		}
		const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
		const { uid, email } = await request.json().catch(() => ({ uid: undefined, email: undefined }));
		const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
			mode: 'payment',
            success_url: `${origin}/purchase/success?product=meals`,
            cancel_url: `${origin}/meals?canceled=1`,
			customer_email: email,
			client_reference_id: uid,
			metadata: { product: 'meals' },
            line_items: [
				{
					price_data: {
                        currency: 'vnd',
						product_data: { name: 'All Meals Access' },
                        // Stripe minimum: must be >= $0.50 equivalent; use a safe buffer
                        unit_amount: 20000,
					},
					quantity: 1,
				},
			],
		});

		return NextResponse.json({ url: session.url }, { status: 200 });
	} catch (err: any) {
		return NextResponse.json({ error: err?.message ?? 'Failed to create session' }, { status: 500 });
	}
}


