import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables
 */
export function getAdminApp(): App {
	if (!adminApp) {
		// Check if already initialized
		const existingApps = getApps();
		if (existingApps.length > 0) {
			adminApp = existingApps[0];
			return adminApp;
		}

		// Initialize with service account or application default credentials
		try {
			// Option 1: Use service account JSON from environment variable
			if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
				const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
				adminApp = initializeApp({
					credential: cert(serviceAccount),
					projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id,
				});
			} 
			// Option 2: Use individual environment variables
			else if (
				process.env.FIREBASE_PRIVATE_KEY &&
				process.env.FIREBASE_CLIENT_EMAIL &&
				process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
			) {
				adminApp = initializeApp({
					credential: cert({
						projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
						privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
						clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
					}),
					projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
				});
			}
			// Option 3: Use Application Default Credentials (for cloud environments like Vercel)
			else {
				adminApp = initializeApp({
					projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
				});
			}
		} catch (error: any) {
			throw new Error(
				`Failed to initialize Firebase Admin SDK: ${error?.message}. Make sure to set up service account credentials.`
			);
		}
	}
	return adminApp;
}

/**
 * Get Firestore Admin instance
 */
export function getAdminDb(): Firestore {
	if (!adminDb) {
		adminDb = getFirestore(getAdminApp());
	}
	return adminDb;
}

