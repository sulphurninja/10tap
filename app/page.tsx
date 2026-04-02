"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const topServices = [
  "WhatsApp", "Telegram", "Google", "Instagram", "Discord", "Twitter",
  "TikTok", "Netflix", "Amazon", "OpenAI", "Apple", "PayPal",
  "Snapchat", "LinkedIn", "Facebook", "Uber", "Steam", "Binance",
];

const countries = [
  { name: "United States", code: "us" }, { name: "India", code: "in" },
  { name: "United Kingdom", code: "gb" }, { name: "Russia", code: "ru" },
  { name: "Germany", code: "de" }, { name: "Brazil", code: "br" },
  { name: "Indonesia", code: "id" }, { name: "France", code: "fr" },
  { name: "Canada", code: "ca" }, { name: "Netherlands", code: "nl" },
  { name: "Philippines", code: "ph" }, { name: "Ukraine", code: "ua" },
];

const useCases = [
  {
    title: "Account Verification",
    desc: "Create and verify accounts on any platform without using your personal number. Perfect for testing, dev environments, and bulk operations.",
    points: ["WhatsApp, Telegram, Instagram sign-ups", "Google & Apple ID verification", "Social media account creation"],
  },
  {
    title: "Privacy Protection",
    desc: "Keep your real number private when signing up for new services. One-time use numbers that disappear after verification.",
    points: ["No spam to your personal phone", "Disposable numbers for each service", "Zero data retained after OTP delivery"],
  },
  {
    title: "Business & Automation",
    desc: "Scale your operations with API access and bulk number purchasing. Built for developers and businesses that need reliable verification at scale.",
    points: ["REST API for automated workflows", "Bulk purchase discounts", "Real-time webhook notifications"],
  },
];

const plans = [
  {
    name: "Pay as you go",
    price: "₹0",
    sub: "to start",
    perks: ["No minimum deposit", "150+ countries", "300+ services", "Dashboard access", "Email support"],
    pop: false,
  },
  {
    name: "Pro",
    price: "₹499",
    sub: "/month",
    perks: ["Everything in free", "Priority number routing", "API access", "Faster OTP delivery", "Priority support", "Bulk pricing"],
    pop: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    sub: "",
    perks: ["Everything in Pro", "Dedicated account manager", "Custom SLA", "White-label option", "Volume discounts", "99.99% uptime guarantee"],
    pop: false,
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/10tap.png" alt="10tap" className="h-8" />
          </Link>
          <nav className="hidden gap-8 md:flex">
            <a href="#services" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Services</a>
            <a href="#countries" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Countries</a>
            <a href="#pricing" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login"><Button variant="ghost" size="sm" className="text-slate-600">Log in</Button></Link>
            <Link href="/auth/register"><Button size="sm" className="bg-sky-600 text-white hover:bg-sky-700 shadow-sm">Get Started</Button></Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 sm:pt-28 md:pb-24">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-1/2 h-150 w-225 -translate-x-1/2 rounded-full bg-linear-to-br from-sky-50 via-cyan-50 to-blue-50 opacity-80 blur-3xl" />
          </div>
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-xs font-semibold text-sky-700">
              Trusted by 10,000+ users worldwide
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl md:leading-[1.08]">
              Virtual numbers for
              <br />
              <span className="bg-linear-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">
                SMS verification
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
              Receive OTP codes for WhatsApp, Telegram, Google, and 300+ services.
              Numbers from 150+ countries. Instant activation. Starting at ₹5 per number.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/register">
                <Button size="lg" className="h-12 min-w-50 bg-sky-600 text-base font-semibold text-white shadow-lg shadow-sky-200 hover:bg-sky-700 active:scale-[0.98] transition-all">
                  Get Your First Number <ArrowRight className="ml-1 size-4" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button variant="outline" size="lg" className="h-12 min-w-50 border-slate-200 text-base text-slate-600 hover:bg-slate-50">
                  View Pricing
                </Button>
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-500" />No personal number needed</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-500" />OTP in under 30 seconds</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-500" />Pay only when you use</span>
            </div>
          </div>
        </section>

        {/* Supported Services */}
        <section id="services" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/60 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">300+ Supported Services</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Get OTPs for any platform
            </h2>
            <p className="mt-3 text-slate-500">Receive verification codes from all major platforms. New services added weekly.</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
              {topServices.map(s => (
                <span key={s} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-sky-200 hover:text-sky-700">{s}</span>
              ))}
              <span className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">+280 more</span>
            </div>
          </div>
        </section>

        {/* Countries */}
        <section id="countries" className="scroll-mt-20 border-t border-slate-100 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">150+ Countries</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Numbers from around the world
            </h2>
            <p className="mt-3 text-slate-500">USA, India, UK, Germany, Russia, Brazil and 140+ more countries available.</p>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {countries.map(c => (
                <div key={c.code} className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://flagcdn.com/${c.code}.svg`} alt={c.name} width={24} height={18} className="inline-block rounded-sm" />
                  <span className="truncate text-sm font-medium text-slate-700">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-slate-100 bg-slate-50/60 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Three steps. Under a minute.</h2>
            <div className="mt-14 grid gap-8 sm:grid-cols-3">
              {[
                { n: "1", title: "Choose country & service", desc: "Pick from 150+ countries and 300+ services like WhatsApp, Telegram, Google." },
                { n: "2", title: "Get a virtual number", desc: "A temporary phone number is assigned to you instantly. Funds deducted from wallet." },
                { n: "3", title: "Receive your OTP", desc: "The verification code appears on your dashboard within seconds. Copy and paste." },
              ].map(({ n, title, desc }) => (
                <div key={n}>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-lg font-bold text-white">{n}</div>
                  <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="border-t border-slate-100 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">Use Cases</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Built for real needs</h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {useCases.map(({ title, desc, points }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-sky-200">
                  <h3 className="text-base font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
                  <ul className="mt-4 space-y-2">
                    {points.map(p => (
                      <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-sky-500" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-t border-slate-100 bg-slate-50/60 px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-4">
            {[
              { val: "150+", lbl: "Countries" }, { val: "300+", lbl: "Services" },
              { val: "10K+", lbl: "Users" }, { val: "99.9%", lbl: "Uptime" },
            ].map(({ val, lbl }) => (
              <div key={lbl} className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-3xl font-extrabold tracking-tight text-sky-600">{val}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{lbl}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 border-t border-slate-100 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">Pricing</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">No subscriptions required</h2>
              <p className="mt-3 text-slate-500">Top up your wallet and pay per number. Prices vary by country and service.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {plans.map(({ name, price, sub, perks, pop }) => (
                <div key={name} className={cn(
                  "flex flex-col rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg",
                  pop ? "border-sky-300 bg-white shadow-md ring-2 ring-sky-500" : "border-slate-200 bg-white shadow-sm"
                )}>
                  {pop && <span className="mb-3 w-fit rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white">Recommended</span>}
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{name}</p>
                  <p className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">{price}{sub && <span className="text-base font-normal text-slate-400"> {sub}</span>}</p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {perks.map(p => (
                      <li key={p} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="size-4 shrink-0 text-sky-500" />{p}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/register" className="mt-8">
                    <Button className={cn("w-full", pop ? "bg-sky-600 text-white hover:bg-sky-700" : "")} variant={pop ? "default" : "outline"}>
                      {price === "Custom" ? "Contact us" : "Get started"}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-3xl bg-linear-to-br from-sky-600 to-cyan-600 p-10 text-center shadow-xl sm:p-14">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Get your first OTP in under a minute</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-sky-100">Sign up free, top up your wallet, and start receiving verification codes instantly.</p>
            <Link href="/auth/register">
              <Button size="lg" className="mt-8 h-12 bg-white px-8 text-base font-semibold text-sky-700 shadow-lg hover:bg-sky-50">
                Create Free Account <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <div className="text-center sm:text-left">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/10tap.png" alt="10tap" className="h-6" />
            </Link>
            <p className="mt-2 text-xs text-slate-400">© {new Date().getFullYear()} 10tap.io · Virtual numbers & OTP verification.</p>
          </div>
          <div className="flex gap-6 text-xs text-slate-400">
            <a href="#services" className="hover:text-slate-600 transition-colors">Services</a>
            <a href="#countries" className="hover:text-slate-600 transition-colors">Countries</a>
            <a href="#pricing" className="hover:text-slate-600 transition-colors">Pricing</a>
            <Link href="/auth/login" className="hover:text-slate-600 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
