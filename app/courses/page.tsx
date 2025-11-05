'use client';

import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

const COURSES = [
	{ id: 'c1', title: 'Healthy Cooking 101', about: 'Master fundamentals of healthy, tasty cooking.', lessons: ['Basics', 'Meal Prep', 'Seasoning'] },
	{ id: 'c2', title: 'Advanced Nutrition', about: 'Deep-dive into macros, micros, and hydration strategies.', lessons: ['Macros', 'Micros', 'Hydration'] },
	{ id: 'c3', title: 'Quick Weeknight Dinners', about: 'Fast, flavorful dinners using minimal tools.', lessons: ['15-min Meals', 'One-Pot', 'Freezer Tricks'] },
	{ id: 'c4', title: 'Global Flavors', about: 'Explore techniques and spices from cuisines worldwide.', lessons: ['Spices', 'Sauces', 'Regional Classics'] },
	{ id: 'c5', title: 'Plant-Based Mastery', about: 'Build balanced, protein-rich plant-centric meals.', lessons: ['Proteins', 'Greens', 'Balanced Plates'] },
	{ id: 'c6', title: 'Baking Essentials', about: 'Foundational methods for breads, cakes, and pastries.', lessons: ['Doughs', 'Cakes', 'Pastries'] },
];

export default function CoursesPage() {
    const { purchases } = useAuth();
    const hasAccess = !!purchases.courses;

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Courses</h1>
				<p className="mt-1 text-sm text-neutral-600">Learn with curated lessons and structured paths.</p>
			</div>
            <div className="overflow-x-auto pb-2 no-scrollbar scroll-touch smooth-scroll scroll-fade-x">
                <div className="flex snap-x snap-mandatory gap-4">
                {COURSES.map((c, idx) => (
                    <a key={c.id} href={`/courses/${c.id}`} className="min-w-[300px] snap-center overflow-hidden rounded-2xl border border-neutral-200/70 bg-white text-left shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                        <div className="relative h-56 w-full">
                            <Image
                                src={`/meals/${Math.min(idx + 1, 5)}.jpg`}
                                alt={c.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-neutral-900">{c.title}</h2>
                            <p className="mt-2 line-clamp-3 text-sm text-neutral-600">{c.about}</p>
                            {!hasAccess && <div className="mt-3 text-xs text-neutral-500">Sample preview available</div>}
                        </div>
                    </a>
                ))}
                </div>
            </div>
		</div>
	);
}
 

