/**
 * PayOS Bank Accounts Configuration
 *
 * Single account: Bs Hoàng Hiệp (uses PAYOS_CLIENT_ID_2, PAYOS_API_KEY_2, PAYOS_CHECKSUM_KEY_2).
 * Web_1 account has been removed from PayOS setup.
 */

export type PayOSAccountId = 'bank2';

export interface PayOSAccount {
	id: PayOSAccountId;
	name: string;
	clientId: string;
	apiKey: string;
	checksumKey: string;
	qrCodeImage?: string;
}

const PAYOS_ACCOUNTS_BASE: Record<PayOSAccountId, Omit<PayOSAccount, 'clientId' | 'apiKey' | 'checksumKey'>> = {
	bank2: {
		id: 'bank2',
		name: 'Bs Hoàng Hiệp',
	},
};

function getPayOSAccountsWithCredentials(): Record<PayOSAccountId, PayOSAccount> {
	return {
		bank2: {
			...PAYOS_ACCOUNTS_BASE.bank2,
			clientId: process.env.PAYOS_CLIENT_ID_2 || '',
			apiKey: process.env.PAYOS_API_KEY_2 || '',
			checksumKey: process.env.PAYOS_CHECKSUM_KEY_2 || '',
		},
	};
}

export const PAYOS_ACCOUNTS: Record<PayOSAccountId, PayOSAccount> = (() => {
	if (typeof window === 'undefined') {
		return getPayOSAccountsWithCredentials();
	}
	return {
		bank2: {
			...PAYOS_ACCOUNTS_BASE.bank2,
			clientId: '',
			apiKey: '',
			checksumKey: '',
		},
	};
})();

export function getPayOSAccount(accountId: PayOSAccountId): PayOSAccount {
	const accounts = getPayOSAccountsWithCredentials();
	const account = accounts[accountId];
	if (!account) {
		throw new Error(`PayOS account ${accountId} not found`);
	}
	return account;
}

export function getAllPayOSAccounts(): PayOSAccount[] {
	const accounts = getPayOSAccountsWithCredentials();
	return Object.values(accounts).filter(
		(account) => account.clientId && account.apiKey && account.checksumKey
	);
}

export function isValidPayOSAccount(accountId: PayOSAccountId): boolean {
	const accounts = getPayOSAccountsWithCredentials();
	const account = accounts[accountId];
	return !!(
		account &&
		account.clientId &&
		account.apiKey &&
		account.checksumKey
	);
}

export function getPayOSAccountsForClient(): Array<{ id: PayOSAccountId; name: string }> {
	return Object.values(PAYOS_ACCOUNTS_BASE);
}
