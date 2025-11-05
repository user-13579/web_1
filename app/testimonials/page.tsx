'use client';

export default function TestimonialsPage() {
	const TESTIMONIALS = [
		{
			name: 'Alex Nguyen',
			role: 'Product Designer',
			quote:
				'The mentorship program helped me cut months off my learning curve. Practical, clear, and motivating.',
		},
		{
			name: 'Mai Tran',
			role: 'Nutrition Coach',
			quote:
				'The meals and courses are top-notch. I gained confidence and my clients love the results.',
		},
		{
			name: 'David Pham',
			role: 'Engineer',
			quote:
				"Simple steps, big impact. The structured guidance made it easy to stay consistent.",
		},
	];

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Testimonials</h1>
				<p className="mt-1 text-sm text-neutral-600">What learners say about the program</p>
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{TESTIMONIALS.map((t, i) => (
					<div
						key={i}
						className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
					>
						<div className="mb-3 flex items-center gap-3">
							<div className="grid h-10 w-10 place-items-center rounded-full bg-neutral-900 text-sm font-medium text-white">
								{t.name.charAt(0)}
							</div>
							<div>
								<div className="text-sm font-semibold text-neutral-900">{t.name}</div>
								<div className="text-xs text-neutral-600">{t.role}</div>
							</div>
						</div>
						<p className="text-[0.95rem] leading-relaxed text-neutral-800">“{t.quote}”</p>
					</div>
				))}
			</div>
		</div>
	);
}


