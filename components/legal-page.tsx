import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-linear-to-b from-sky-50/60 via-white to-white"
        aria-hidden
      />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
          Syntix · 10tap
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          {title}
        </h1>
        {updated ? (
          <p className="mt-3 text-sm text-slate-400">
            Last updated: {updated}
          </p>
        ) : null}
        <div className="prose prose-slate mt-10 max-w-none text-[15px] leading-7 text-slate-600 [&_a]:text-sky-600 [&_a:hover]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 [&_li]:my-1 [&_p]:my-4 [&_strong]:text-slate-800 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
      </div>
    </div>
  );
}
