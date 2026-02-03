import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

/**
 * Debug endpoint to check webhook status and recent orders
 * GET /api/payos/webhook-debug
 */
export async function GET(request: NextRequest) {
	try {
		const db = getAdminDb();
		
		// Get recent orders
		const ordersQuery = db.collection('payos_orders')
			.orderBy('createdAt', 'desc')
			.limit(10);
		
		const ordersSnapshot = await ordersQuery.get();
		
		type OrderData = {
			status?: string;
			product?: string;
			email?: string | null;
			createdAt?: string;
			paidAt?: string | null;
		};
		
		const recentOrders = ordersSnapshot.docs.map(doc => {
			const data = doc.data() as OrderData;
			return {
				id: doc.id,
				status: data.status || 'PENDING',
				product: data.product || null,
				email: data.email || null,
				createdAt: data.createdAt || null,
				paidAt: data.paidAt || null,
			};
		});

		// Count orders by status
		const allOrdersQuery = db.collection('payos_orders');
		const allOrdersSnapshot = await allOrdersQuery.get();
		const statusCounts: Record<string, number> = {};
		
		allOrdersSnapshot.docs.forEach(doc => {
			const data = doc.data() as OrderData;
			const status = data.status || 'UNKNOWN';
			statusCounts[status] = (statusCounts[status] || 0) + 1;
		});

		// Check PayOS account (Bs Hoàng Hiệp) credentials
		const hasChecksumKey = !!process.env.PAYOS_CHECKSUM_KEY_2;
		const hasClientId = !!process.env.PAYOS_CLIENT_ID_2;
		const hasApiKey = !!process.env.PAYOS_API_KEY_2;

		return NextResponse.json({
			webhookUrl: 'https://web-1-tawny.vercel.app/api/payos/webhook',
			environment: {
				hasChecksumKey,
				hasClientId,
				hasApiKey,
			},
			orderStats: {
				total: allOrdersSnapshot.size,
				byStatus: statusCounts,
			},
			recentOrders: recentOrders.map(order => ({
				orderCode: order.id,
				status: order.status,
				product: order.product,
				email: order.email,
				createdAt: order.createdAt,
				paidAt: order.paidAt,
			})),
		});
	} catch (err: any) {
		console.error('Webhook debug error:', err);
		return NextResponse.json(
			{
				error: err?.message ?? 'Debug error',
				details: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
			},
			{ status: 500 }
		);
	}
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

