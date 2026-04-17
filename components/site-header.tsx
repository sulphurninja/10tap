import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/10tap.png" alt="10tap" className="h-8" />
        </Link>
        <nav className="hidden gap-8 md:flex">
          <Link
            href="/#services"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
          >
            Services
          </Link>
          <Link
            href="/#countries"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
          >
            Countries
          </Link>
          <Link
            href="/#how"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
          >
            How It Works
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
          >
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="text-slate-600">
              Log in
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button
              size="sm"
              className="bg-sky-600 text-white shadow-sm hover:bg-sky-700"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
