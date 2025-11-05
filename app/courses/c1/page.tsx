'use client';

import Image from 'next/image';
import YouTubePlayer from '@/components/YouTubePlayer';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CourseC1Page() {
  const title = 'Healthy Cooking 101';
  const about = 'Master fundamentals of healthy, tasty cooking.';
  const youtubeId = 'dQw4w9WgXcQ';
  const coverIdx = 1;
  const { user, purchases, setPurchased } = useAuth();
  const hasAccess = !!purchases.courses || !!purchases['course_c1'];
  const params = useSearchParams();
  const [appliedFromQuery, setAppliedFromQuery] = useState(false);

  useEffect(() => {
    if (appliedFromQuery) return;
    if (!user) return;
    const product = params.get('product');
    if (product === 'course') {
      (async () => {
        try {
          await setPurchased('course_c1' as any, true);
          setAppliedFromQuery(true);
        } catch {}
      })();
    }
  }, [params, user, setPurchased, appliedFromQuery]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        <p className="mt-1 text-sm text-neutral-600">{about}</p>
      </div>

      {hasAccess ? (
        <div className="relative mb-5 overflow-hidden rounded-2xl border border-neutral-200/70 bg-black shadow-[0_12px_40px_rgba(0,0,0,0.2)] elev-2">
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <div className="absolute left-0 top-0 h-full w-full">
              <YouTubePlayer videoId={youtubeId} playerVars={{ playsinline: 1 }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-5 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white">
          <div className="relative h-40 w-full">
            <Image src={`/meals/${Math.min(coverIdx, 5)}.jpg`} alt={title} fill className="object-cover" />
          </div>
          <div className="p-4 text-sm text-neutral-700">This is a sample lesson embedded from YouTube. Replace the YouTube ID with your course content.</div>
        </div>
      )}

      {!hasAccess && (
        <div className="mb-5 rounded-2xl border border-neutral-200/70 bg-white p-5 text-sm text-neutral-800">
          <div className="mb-2 font-medium text-neutral-900">Unlock this course to watch full content</div>
          <div className="text-neutral-600">Purchase once to get permanent access on this account.</div>
          <div className="mt-4">
            <button
              className="rounded-full bg-neutral-900 px-4 py-2 text-white hover:bg-black"
              onClick={async () => {
                try {
                  const res = await fetch('/api/checkout/course', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: user?.uid, email: user?.email, courseId: 'c1' }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.error || 'Failed to start checkout');
                  if (data?.url) window.location.href = data.url as string;
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              Purchase course
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white">
          <div className="relative h-40 w-full">
            <Image src={`/meals/${Math.min(coverIdx, 5)}.jpg`} alt={title} fill className="object-cover" />
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


