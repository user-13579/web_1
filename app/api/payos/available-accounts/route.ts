import { NextResponse } from 'next/server';
import { getAllPayOSAccounts, type PayOSAccountId } from '@/lib/payosAccounts';

/**
 * API endpoint to get available PayOS bank accounts
 * 
 * Returns only accounts that have all required credentials configured.
 * Used by client-side components to show bank selection.
 */
export async function GET() {
	try {
		const accounts = getAllPayOSAccounts();
		
		// Return only id and name (no credentials)
		const availableAccounts = accounts.map(account => ({
			id: account.id as PayOSAccountId,
			name: account.name,
		}));

		return NextResponse.json(
			{
				accounts: availableAccounts,
				count: availableAccounts.length,
			},
			{
				status: 200,
				headers: {
					'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
				},
			}
		);
	} catch (error: any) {
		console.error('Error fetching available PayOS accounts:', error);
		return NextResponse.json(
			{
				error: 'Failed to fetch available accounts',
				details: process.env.NODE_ENV === 'development' ? error.message : undefined,
			},
			{ status: 500 }
		);
	}
}

// Export runtime config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

