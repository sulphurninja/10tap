import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Shield, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us — 10tap",
  description:
    "10tap is a Syntix product that helps developers and businesses verify accounts without exposing personal phone numbers.",
};

const values = [
  {
    icon: Shield,
    title: "Privacy first",
    desc: "One-time virtual numbers mean your personal SIM never leaves your pocket.",
  },
  {
    icon: Zap,
    title: "Built for scale",
    desc: "A pre-paid wallet, REST API and webhooks designed for automation and bulk verification.",
  },
  {
    icon: Globe,
    title: "Truly global",
    desc: "Numbers from 150+ countries, covering 300+ services developers actually use.",
  },
  {
    icon: Sparkles,
    title: "Honest pricing",
    desc: "Pay-as-you-go, no hidden fees, automatic wallet refunds for undelivered OTPs.",
  },
];

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-linear-to-b from-sky-50/70 via-white to-white"
        aria-hidden
      />

      <section className="mx-auto max-w-4xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
          About us
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
          Verification that respects your privacy.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
          10tap is a product by <strong className="text-slate-700">Syntix</strong>.
          We make it simple to receive OTPs and SMS on virtual phone numbers
          from 150+ countries — for developers, QA teams, privacy-conscious
          users and anyone who would rather not hand out their real number.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="space-y-6 text-[15px] leading-7 text-slate-600">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Our story
          </h2>
          <p>
            Syntix was started by a small team of engineers who kept running
            into the same wall: every new app, every testing environment, every
            throwaway account wanted one more thing — your phone number. We
            built 10tap because the existing options were either shady,
            overpriced, or didn&apos;t work outside a single country.
          </p>
          <p>
            Today 10tap aggregates capacity from several tier-1 SMS operators
            to deliver OTPs quickly and reliably, wrapped in a modern
            dashboard, a clean API and a pre-paid wallet that refunds
            automatically when a message doesn&apos;t show up.
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            What we build
          </h2>
          <ul className="my-4 list-disc space-y-2 pl-6">
            <li>
              <strong className="text-slate-800">Instant OTPs</strong> for 300+
              services across WhatsApp, Telegram, Google, Instagram, Discord,
              TikTok and many more.
            </li>
            <li>
              <strong className="text-slate-800">Number rentals</strong> for
              longer-term access to a single phone number.
            </li>
            <li>
              <strong className="text-slate-800">Developer-friendly APIs</strong>{" "}
              and webhooks for automated verification workflows.
            </li>
            <li>
              <strong className="text-slate-800">Flexible payments</strong> —
              top up with cards, UPI and net-banking via Razorpay, or with 50+
              cryptocurrencies via CloudPaya.
            </li>
          </ul>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            The company
          </h2>
          <p>
            10tap is owned and operated by <strong>Syntix</strong>, a software
            company headquartered in India. We work with regulated payment
            partners and audited SMS providers and follow Indian data
            protection norms. For any enquiry — commercial, security or press —
            reach us at{" "}
            <a href="mailto:support@10tap.io" className="text-sky-600 hover:underline">
              support@10tap.io
            </a>
            .
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-8 text-center">
          <h3 className="text-xl font-semibold text-slate-900">
            Ready to try 10tap?
          </h3>
          <p className="max-w-md text-sm text-slate-500">
            Create a free account, top up your wallet and get your first OTP in
            under a minute.
          </p>
          <Link href="/auth/register">
            <Button className="mt-2 h-11 bg-sky-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">
              Get started
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
