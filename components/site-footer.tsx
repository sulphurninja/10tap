import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/10tap.png" alt="10tap" className="h-7" />
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-500">
              Virtual phone numbers & OTP verification for 300+ services across
              150+ countries. A product by Syntix.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Product
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>
                <Link
                  href="/#services"
                  className="transition-colors hover:text-slate-800"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/#countries"
                  className="transition-colors hover:text-slate-800"
                >
                  Countries
                </Link>
              </li>
              <li>
                <Link
                  href="/#how"
                  className="transition-colors hover:text-slate-800"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="transition-colors hover:text-slate-800"
                >
                  Sign up
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Company
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-slate-800"
                >
                  About us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-slate-800"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Legal
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-slate-800"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-slate-800"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="transition-colors hover:text-slate-800"
                >
                  Refund &amp; Cancellation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>© {year} Syntix. All rights reserved. 10tap is a Syntix product.</p>
          <p>Made for developers & businesses.</p>
        </div>
      </div>
    </footer>
  );
}
