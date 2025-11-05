import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';


export async function POST(request: Request) {
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
	const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
	if (!webhookSecret || !stripeSecretKey) {
		return NextResponse.json({ error: 'Missing Stripe env vars' }, { status: 500 });
	}
	const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

	try {
		// Next.js App Router provides request.body as a ReadableStream
		const raw = Buffer.from(await request.arrayBuffer());
		const sig = request.headers.get('stripe-signature') as string;
		let event: Stripe.Event;
		try {
			event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
		} catch (err: any) {
			return NextResponse.json({ error: `Webhook signature verification failed: ${err?.message}` }, { status: 400 });
		}

		if (event.type === 'checkout.session.completed') {
			const session = event.data.object as Stripe.Checkout.Session;
			const product = session.metadata?.product;
			const uid = session.client_reference_id ?? undefined;
			if (product === 'meals' && uid) {
				const db = getDb();
				const ref = doc(db, 'users', uid);
				const snap = await getDoc(ref);
				if (!snap.exists()) {
					await setDoc(ref, { purchases: { meals: true } });
				} else {
					await updateDoc(ref, { 'purchases.meals': true });
				}
			}
		}

		return NextResponse.json({ received: true }, { status: 200 });
	} catch (err: any) {
		return NextResponse.json({ error: err?.message ?? 'Webhook error' }, { status: 500 });
	}
}


