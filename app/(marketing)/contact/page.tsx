import type { Metadata } from "next";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact — 10tap",
  description:
    "Get in touch with the Syntix / 10tap team. Support, billing, partnerships and press.",
};

const channels = [
  {
    icon: Mail,
    title: "General & support",
    detail: "support@10tap.io",
    href: "mailto:support@10tap.io",
    note: "Usual response within one business day.",
  },
  {
    icon: ShieldCheck,
    title: "Security & abuse",
    detail: "security@10tap.io",
    href: "mailto:security@10tap.io",
    note: "Responsible-disclosure reports are welcome.",
  },
  {
    icon: MessageCircle,
    title: "Business & partnerships",
    detail: "hello@syntix.io",
    href: "mailto:hello@syntix.io",
    note: "Volume pricing, API partnerships, integrations.",
  },
];

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-linear-to-b from-sky-50/70 via-white to-white"
        aria-hidden
      />

      <div className="mx-auto max-w-5xl px-4 pb-20 pt-16 sm:px-6 sm:pt-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
            Contact
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Talk to the team.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-500">
            Questions about your wallet, a failed OTP, pricing for your volume
            or anything else — we usually respond within a business day.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2">
            {channels.map(({ icon: Icon, title, detail, href, note }) => (
              <a
                key={title}
                href={href}
                className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {title}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-sm text-sky-600 group-hover:underline">
                      {detail}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      {note}
                    </p>
                  </div>
                </div>
              </a>
            ))}

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Registered entity
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Syntix
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Product: 10tap — Virtual numbers &amp; OTP verification.
                <br />
                For correspondence, please use the email addresses on this page.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900">
                Send us a message
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fill in the form and we&apos;ll get back to you over email.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
