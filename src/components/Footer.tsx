'use client';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-neutral-200/70 bg-white/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-neutral-600">
        © {year} Your Company. All rights reserved.
      </div>
    </footer>
  );
}
