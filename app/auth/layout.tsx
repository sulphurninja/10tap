import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-125 w-175 rounded-full bg-linear-to-br from-sky-50 to-cyan-50 opacity-60 blur-3xl" />
      </div>
      <Link href="/" className="mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/10tap.png" alt="10tap" className="h-10" />
      </Link>
      {children}
    </div>
  );
}
