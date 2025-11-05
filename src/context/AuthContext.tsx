'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	sendEmailVerification,
	type User,
	reload,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '@/lib/firebase';
 
export type Purchases = {
    meals?: boolean;
    courses?: boolean; // optional global courses access
    mentor?: boolean;
    // Allow per-item keys like "course_c1", "course_abc"
    [key: string]: boolean | undefined;
};
 
 type AuthContextValue = {
 	user: User | null;
 	loading: boolean;
 	purchases: Purchases;
 	signUp: (email: string, password: string) => Promise<void>;
 	logIn: (email: string, password: string) => Promise<void>;
 	logOut: () => Promise<void>;
 	resetPassword: (email: string) => Promise<void>;
 	sendVerificationEmail: () => Promise<void>;
	reloadUser: () => Promise<void>;
 	setPurchased: (key: keyof Purchases, value: boolean) => Promise<void>;
 };
 
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
 	const [user, setUser] = useState<User | null>(null);
 	const [loading, setLoading] = useState(true);
 	const [purchases, setPurchases] = useState<Purchases>({});
 
 	useEffect(() => {
 		if (typeof window === 'undefined') return;
 		
 		const auth = getFirebaseAuth();
 		const db = getDb();
 		const unsub = onAuthStateChanged(auth, async current => {
 			setUser(current);
 			if (current) {
 				const ref = doc(db, 'users', current.uid);
 				const snap = await getDoc(ref);
 				if (snap.exists()) {
 					const data = snap.data() as { purchases?: Purchases };
 					setPurchases(data.purchases ?? {});
 				} else {
 					await setDoc(ref, { purchases: {} });
 					setPurchases({});
 				}
 			} else {
 				setPurchases({});
 			}
 			setLoading(false);
 		});
 		return () => unsub();
 	}, []);
 
 	async function signUp(email: string, password: string) {
 		if (typeof window === 'undefined') return;
 		const auth = getFirebaseAuth();
 		await createUserWithEmailAndPassword(auth, email, password);
 	}

 	async function logIn(email: string, password: string) {
 		if (typeof window === 'undefined') return;
 		const auth = getFirebaseAuth();
 		await signInWithEmailAndPassword(auth, email, password);
 	}

 	async function logOut() {
 		if (typeof window === 'undefined') return;
 		const auth = getFirebaseAuth();
 		await signOut(auth);
 	}

 	async function resetPassword(email: string) {
 		if (typeof window === 'undefined') return;
 		const auth = getFirebaseAuth();
 		await sendPasswordResetEmail(auth, email);
 	}

	async function sendVerificationEmail() {
		if (typeof window === 'undefined') return;
		const auth = getFirebaseAuth();
		if (!auth.currentUser) return;
		if (auth.currentUser.emailVerified) return;
		// Basic client-side throttle to avoid Firebase rate limits
		try {
			const key = 'verifyEmailLastSentAt';
			const last = window.localStorage.getItem(key);
			if (last) {
				const lastMs = Number(last);
				if (!Number.isNaN(lastMs)) {
					const elapsed = Date.now() - lastMs;
					const minIntervalMs = 60_000; // 60 seconds
					if (elapsed < minIntervalMs) {
						throw new Error('Please wait a minute before requesting another verification email.');
					}
				}
			}
			await sendEmailVerification(auth.currentUser);
			window.localStorage.setItem(key, String(Date.now()));
		} catch (err) {
			// Re-throw so UI can present a friendly message
			throw err;
		}
	}

	async function reloadUser() {
		if (typeof window === 'undefined') return;
		const auth = getFirebaseAuth();
		if (!auth.currentUser) return;
		await reload(auth.currentUser);
		// Update local state after reload to reflect latest verification status
		setUser(auth.currentUser);
	}
 
 	async function setPurchased(key: keyof Purchases, value: boolean) {
 		if (typeof window === 'undefined') return;
 		if (!user) return;
 		const db = getDb();
 		const ref = doc(db, 'users', user.uid);
 		await updateDoc(ref, { [`purchases.${key}`]: value });
 		setPurchases(prev => ({ ...prev, [key]: value }));
 	}
 
	const value = useMemo<AuthContextValue>(
		() => ({ user, loading, purchases, signUp, logIn, logOut, resetPassword, sendVerificationEmail, reloadUser, setPurchased }),
		[user, loading, purchases],
	);
 
 	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
 }
 
 export function useAuth(): AuthContextValue {
 	const ctx = useContext(AuthContext);
 	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
 	return ctx;
 }
 

