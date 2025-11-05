import Stripe from 'stripe';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
        }
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
        const { uid, email, courseId } = await request.json().catch(() => ({} as any));
        if (!courseId) {
            return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
        }
        const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            success_url: `${origin}/purchase/success?product=course&courseId=${encodeURIComponent(courseId)}`,
            cancel_url: `${origin}/courses/${encodeURIComponent(courseId)}?canceled=1`,
            customer_email: email,
            client_reference_id: uid,
            metadata: { product: 'course', courseId },
            line_items: [
                {
                    price_data: {
                        currency: 'vnd',
                        product_data: { name: `Course Access: ${courseId}` },
                        unit_amount: 20000, // meets Stripe minimum
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




