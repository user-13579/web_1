'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function PurchaseSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, setPurchased } = useAuth();
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const product = params.get('product');
    const paymentMethod = params.get('paymentMethod');
    if (!product || applied) return;
    if (!user) return; // wait for auth to load

    (async () => {
      try {
        if (product === 'meals') {
          await setPurchased('meals', true);
          setApplied(true);
          router.replace('/meals');
          return;
        }
        if (product === 'course') {
          const courseId = params.get('courseId') ?? '';
          if (courseId) {
            await setPurchased(`course_${courseId}` as any, true);
            setApplied(true);
            router.replace(`/courses/${courseId}`);
            return;
          }
        }
        if (product === 'mentor') {
          const packageId = params.get('packageId') ?? '';
          await setPurchased('mentor', true);
          setApplied(true);
          router.replace('/mentor');
          return;
        }
        // Fallback: go home
        setApplied(true);
        router.replace('/');
      } catch {
        // noop; keep user on page to retry
      }
    })();
  }, [params, user, setPurchased, applied, router]);

  // Fallback navigation: if user isn't available (e.g., not logged in), still navigate
  useEffect(() => {
    const product = params.get('product') ?? undefined;
    const courseId = params.get('courseId') ?? undefined;
    const id = setTimeout(() => {
      if (product === 'course' && courseId) {
        router.replace(`/courses/${courseId}?product=course`);
      } else if (product === 'meals') {
        router.replace('/meals?product=meals');
      } else {
        router.replace('/');
      }
    }, 2000);
    return () => clearTimeout(id);
  }, [router, params]);

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Payment successful</h1>
      <p className="mt-2 text-neutral-700">Finalizing your access…</p>
      {(() => {
        const product = params.get('product');
        const courseId = params.get('courseId');
        const packageId = params.get('packageId');
        const paymentMethod = params.get('paymentMethod');
        
        if (product === 'course' && courseId) {
          return (
            <a className="mt-6 inline-block rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black" href={`/courses/${courseId}?product=course`}>
              Go to course
            </a>
          );
        }
        if (product === 'mentor') {
          return (
            <a className="mt-6 inline-block rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black" href="/mentor">
              Go to mentor
            </a>
          );
        }
        return (
          <a className="mt-6 inline-block rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black" href="/meals?product=meals">
            Go to meals
          </a>
        );
      })()}
    </div>
  );
}


