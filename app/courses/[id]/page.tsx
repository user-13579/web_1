'use client';

import Image from 'next/image';
import YouTubePlayer from '@/components/YouTubePlayer';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';

const COURSES: Record<string, { title: string; about: string; youtubeId: string; coverIdx: number }> = {
  c1: { title: 'Healthy Cooking 101', about: 'Master fundamentals of healthy, tasty cooking.', youtubeId: 'dQw4w9WgXcQ', coverIdx: 1 },
  c2: { title: 'Advanced Nutrition', about: 'Deep-dive into macros, micros, and hydration strategies.', youtubeId: 'ysz5S6PUM-U', coverIdx: 2 },
  c3: { title: 'Quick Weeknight Dinners', about: 'Fast, flavorful dinners using minimal tools.', youtubeId: 'oHg5SJYRHA0', coverIdx: 3 },
  c4: { title: 'Global Flavors', about: 'Explore techniques and spices from cuisines worldwide.', youtubeId: 'aqz-KE-bpKQ', coverIdx: 4 },
  c5: { title: 'Plant-Based Mastery', about: 'Build balanced, protein-rich plant-centric meals.', youtubeId: 'jNQXAC9IVRw', coverIdx: 5 },
  c6: { title: 'Baking Essentials', about: 'Foundational methods for breads, cakes, and pastries.', youtubeId: '5qap5aO4i9A', coverIdx: 5 },
};

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const course = useMemo(() => COURSES[params.id], [params.id]);
  const { user, purchases, setPurchased, sendVerificationEmail } = useAuth();
  const hasGlobalAccess = !!purchases.courses;
  const hasCourseAccess = !!purchases[`course_${params.id}`];
  const hasAccess = hasGlobalAccess || hasCourseAccess;
  const paramsSearch = useSearchParams();
  const [appliedFromQuery, setAppliedFromQuery] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const isLoggedIn = !!user;
  const isVerified = !!user?.emailVerified;

  useEffect(() => {
    if (appliedFromQuery) return;
    if (!user) return;
    const product = paramsSearch.get('product');
    if (product === 'course') {
      (async () => {
        try {
          await setPurchased(`course_${params.id}` as any, true);
          setAppliedFromQuery(true);
        } catch {}
      })();
    }
  }, [params.id, paramsSearch, user, setPurchased, appliedFromQuery]);

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Course not found</h1>
        <a className="mt-4 inline-block text-sm text-neutral-700 underline" href="/courses">Back to courses</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">{course.title}</h1>
        <p className="mt-1 text-sm text-neutral-600">{course.about}</p>
      </div>

      {hasAccess ? (
        <div className="relative mb-5 overflow-hidden rounded-2xl border border-neutral-200/70 bg-black shadow-[0_12px_40px_rgba(0,0,0,0.2)] elev-2">
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <div className="absolute left-0 top-0 h-full w-full">
              <YouTubePlayer videoId={course.youtubeId} playerVars={{ playsinline: 1 }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-5 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white">
          <div className="relative h-40 w-full">
            <Image src={`/meals/${Math.min(course.coverIdx, 5)}.jpg`} alt={course.title} fill className="object-cover" />
          </div>
          <div className="p-4 text-sm text-neutral-700">This is a sample lesson embedded from YouTube. Replace the YouTube ID with your course content.</div>
        </div>
      )}

      {!hasAccess && (
        <>
          <div className="mb-5 rounded-2xl border border-neutral-200/70 bg-white p-5 text-sm text-neutral-800">
            <div className="mb-2 font-medium text-neutral-900">Unlock this course to watch full content</div>
            <div className="text-neutral-600">Purchase once to get permanent access on this account.</div>
            <div className="mt-4">
              {!isLoggedIn ? (
                <div className="space-x-2">
                  <a className="rounded-full bg-neutral-900 px-4 py-2 text-white hover:bg-black" href="/login">Log in</a>
                  <a className="rounded-full border border-neutral-300/80 px-4 py-2 text-neutral-900 hover:bg-neutral-50" href="/signup">Sign up</a>
                </div>
              ) : !isVerified ? (
                <div>
                  <p className="mb-2">Please verify your email before purchasing.</p>
                  <button className="rounded-full bg-neutral-900 px-4 py-2 text-white hover:bg-black" onClick={() => void sendVerificationEmail()}>
                    Send verification email
                  </button>
                </div>
              ) : (
                <button
                  className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black"
                  onClick={() => setShowPaymentModal(true)}
                >
                  Purchase course
                </button>
              )}
            </div>
          </div>
          {showPaymentModal && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" onClick={() => setShowPaymentModal(false)}>
              <div className="w-full max-w-sm rounded-2xl border border-neutral-200/70 bg-white/90 p-4 text-sm text-neutral-800 shadow-[0_40px_80px_rgba(0,0,0,0.35)] glass" onClick={e => e.stopPropagation()}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-semibold text-neutral-900">Choose payment</div>
                  <button className="rounded-full px-2 py-1 text-neutral-500 hover:bg-neutral-100" onClick={() => setShowPaymentModal(false)}>Close</button>
                </div>
                <div className="space-y-2">
                  <button 
                    className="w-full rounded-xl border-2 border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-300 hover:bg-neutral-50" 
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/checkout/course', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ uid: user?.uid, email: user?.email, courseId: params.id }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.error || 'Failed to start checkout');
                        if (data?.url) window.location.href = data.url as string;
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-neutral-900">Credit/Debit Card</div>
                        <div className="mt-0.5 text-xs text-neutral-600">Pay with Stripe</div>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                  <button 
                    className="w-full rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-100" 
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/checkout/vnpay', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            uid: user?.uid, 
                            email: user?.email,
                            product: 'course',
                            courseId: params.id,
                            amount: 20000,
                          }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.error || 'Failed to start VNPay checkout');
                        if (data?.url) window.location.href = data.url as string;
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-blue-900">VNPay QR</div>
                        <div className="mt-0.5 text-xs text-blue-700">Scan QR code to pay</div>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                  <a 
                    className="flex w-full items-center justify-between rounded-xl border-2 border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-300 hover:bg-neutral-50" 
                    href="/purchase/manual"
                  >
                    <div>
                      <div className="font-semibold text-neutral-900">Manual Bank Transfer</div>
                      <div className="mt-0.5 text-xs text-neutral-600">Bank QR code</div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white">
          <div className="relative h-40 w-full">
            <Image src={`/meals/${Math.min(course.coverIdx, 5)}.jpg`} alt={course.title} fill className="object-cover" />
          </div>
          <div className="p-4 text-sm text-neutral-700">
            This is a sample lesson embedded from YouTube. Replace the YouTube ID with your course content.
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-4 text-sm text-neutral-700">
          <div className="mb-2 font-medium text-neutral-900">What you'll learn</div>
          <ul className="list-disc pl-5">
            <li>Core techniques explained clearly</li>
            <li>Hands-on, actionable lessons</li>
            <li>Downloadable notes and recipes</li>
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <a className="rounded-full border border-neutral-300/80 px-4 py-2 text-neutral-900 hover:bg-neutral-50" href="/courses">Back to courses</a>
      </div>
    </div>
  );
}


