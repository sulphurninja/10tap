"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Copy, Globe, MessageSquare, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Data ─── */

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

const rotatingServices = [
  { name: "WhatsApp", slug: "whatsapp", otp: "847-291", number: "+1 (332) 555-0147", country: "United States", flag: "us" },
  { name: "Telegram", slug: "telegram", otp: "530-618", number: "+44 7911 12-XXXX", country: "United Kingdom", flag: "gb" },
  { name: "Google", slug: "google", otp: "G-924871", number: "+49 176 555-XXXX", country: "Germany", flag: "de" },
  { name: "Instagram", slug: "instagram", otp: "718 403", number: "+91 98765-XXXXX", country: "India", flag: "in" },
  { name: "Discord", slug: "discord", otp: "295-047", number: "+1 (647) 555-XXXX", country: "Canada", flag: "ca" },
  { name: "TikTok", slug: "tiktok", otp: "461-832", number: "+55 11 9555-XXXX", country: "Brazil", flag: "br" },
];

const heroServiceGrid = [
  { name: "WhatsApp", slug: "whatsapp" },
  { name: "Telegram", slug: "telegram" },
  { name: "Google", slug: "google" },
  { name: "Instagram", slug: "instagram" },
  { name: "Discord", slug: "discord" },
  { name: "TikTok", slug: "tiktok" },
];

const notifCycle = [
  { service: "Telegram", time: "2s ago" },
  { service: "Google", time: "5s ago" },
  { service: "WhatsApp", time: "1s ago" },
  { service: "Instagram", time: "3s ago" },
  { service: "Discord", time: "4s ago" },
];

/* ─── Hooks ─── */

function useRotatingIndex(length: number, intervalMs: number) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % length), intervalMs);
    return () => clearInterval(id);
  }, [length, intervalMs]);
  return idx;
}

function useTypewriter(text: string, speed = 80, pause = 1800) {
  const [display, setDisplay] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplay("");
    setDone(false);
    let i = 0;
    const typing = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typing);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(typing);
  }, [text, speed]);

  return { display, done };
}

function useLiveCounter(start: number, increment: number, intervalMs: number) {
  const [count, setCount] = useState(start);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * increment) + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [increment, intervalMs]);
  return count;
}

/* ─── Components ─── */

function RotatingWord({ words, activeIdx }: { words: string[]; activeIdx: number }) {
  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b), "");
  return (
    <span className="relative inline-block overflow-hidden align-bottom" style={{ lineHeight: "1.15em", height: "1.15em" }}>
      <span className="invisible whitespace-nowrap">{longest}</span>
      {words.map((w, i) => (
        <span
          key={w}
          className="absolute inset-x-0 top-0 whitespace-nowrap bg-linear-to-r from-sky-600 via-cyan-500 to-sky-600 bg-clip-text text-transparent bg-size-[200%_auto] transition-all duration-500 ease-out"
          style={{
            transform: i === activeIdx ? "translateY(0)" : "translateY(110%)",
            opacity: i === activeIdx ? 1 : 0,
            animation: "gradient-shift 4s ease infinite",
          }}
        >
          {w}
        </span>
      ))}
    </span>
  );
}

function OtpDigits({ code, typed }: { code: string; typed: string }) {
  return (
    <span className="inline-flex gap-0.5">
      {code.split("").map((ch, i) => {
        const revealed = i < typed.length;
        const isSep = ch === "-" || ch === " ";
        if (isSep) return <span key={i} className="w-1" />;
        return (
          <span
            key={i}
            className="inline-flex h-7 w-5 items-center justify-center rounded font-mono text-sm font-bold transition-all duration-200"
            style={{
              background: revealed ? "#d1fae5" : "#f1f5f9",
              color: revealed ? "#047857" : "#cbd5e1",
              transform: revealed ? "scale(1)" : "scale(0.85)",
            }}
          >
            {revealed ? typed[i] : "·"}
          </span>
        );
      })}
    </span>
  );
}

function PhoneMockup({ serviceIdx }: { serviceIdx: number }) {
  const svc = rotatingServices[serviceIdx];
  const { display: typedOtp, done: otpDone } = useTypewriter(svc.otp, 100, 2000);
  const [copied, setCopied] = useState(false);
  const notifIdx = useRotatingIndex(notifCycle.length, 3000);
  const notif = notifCycle[notifIdx];

  useEffect(() => { setCopied(false); }, [serviceIdx]);

  const handleCopy = useCallback(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  return (
    <div className="relative flex justify-center lg:justify-end">
      <div className="absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/15 blur-3xl" />

      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/50">
          {/* Top bar */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100">
                <MessageSquare className="size-4 text-sky-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">10tap Inbox</p>
                <p className="text-[10px] text-slate-400">Listening for OTP…</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-medium text-emerald-600">Live</span>
            </div>
          </div>

          {/* Number card — transitions on service change */}
          <div className="mb-3 rounded-xl bg-linear-to-br from-sky-50 to-cyan-50 p-4 ring-1 ring-sky-100 transition-all duration-500">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={svc.flag}
                src={`https://flagcdn.com/${svc.flag}.svg`}
                alt={svc.country}
                width={22} height={16}
                className="rounded-sm transition-opacity duration-300"
              />
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-slate-800 transition-all duration-300">{svc.number}</p>
                <p className="text-[10px] text-slate-400">{svc.country} · Active</p>
              </div>
            </div>
          </div>

          {/* OTP message with typewriter */}
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 transition-all duration-500">
            <div className="flex items-start gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={svc.slug}
                src={`https://cdn.simpleicons.org/${svc.slug}`}
                alt=""
                width={28} height={28}
                className="mt-0.5 rounded-lg bg-white p-1 ring-1 ring-slate-200/60"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">{svc.name}</p>
                  <span className="text-[10px] text-slate-400">Just now</span>
                </div>
                <p className="mt-2 text-[13px] text-slate-600">Your code is</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <OtpDigits code={svc.otp} typed={typedOtp} />
                  {otpDone && (
                    <button
                      onClick={handleCopy}
                      className="flex size-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 transition-all hover:bg-emerald-200 active:scale-90"
                    >
                      {copied ? <CheckCircle2 className="size-3" /> : <Copy className="size-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar between rotations */}
          <div className="mb-3 h-0.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-sky-400 transition-none"
              style={{ animation: "hero-progress 4s linear infinite" }}
            />
          </div>

          {/* Service grid */}
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Popular services</p>
          <div className="grid grid-cols-3 gap-2">
            {heroServiceGrid.map((s) => {
              const isActive = s.slug === svc.slug;
              return (
                <div
                  key={s.slug}
                  className="flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all duration-300"
                  style={{
                    borderColor: isActive ? "#bae6fd" : "#f1f5f9",
                    background: isActive ? "#f0f9ff" : "#ffffff",
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://cdn.simpleicons.org/${s.slug}`} alt="" width={20} height={20} style={{ opacity: isActive ? 1 : 0.6 }} />
                  <span className="text-[10px] font-medium" style={{ color: isActive ? "#0369a1" : "#64748b" }}>{s.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating notification — cycles */}
        <div className="absolute -left-4 top-12 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-slate-200/40 transition-all duration-500 sm:-left-8">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-700">OTP Received</p>
              <p key={notif.service} className="text-[9px] text-slate-400">{notif.service} · {notif.time}</p>
            </div>
          </div>
        </div>

        {/* Countries float */}
        <div className="absolute -right-3 bottom-20 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-slate-200/40 sm:-right-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center -space-x-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://flagcdn.com/in.svg" alt="" width={18} height={13} className="rounded-sm ring-2 ring-white" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://flagcdn.com/gb.svg" alt="" width={18} height={13} className="rounded-sm ring-2 ring-white" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://flagcdn.com/de.svg" alt="" width={18} height={13} className="rounded-sm ring-2 ring-white" />
            </div>
            <p className="text-[10px] font-semibold text-slate-700">150+ countries</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function HomePage() {
  const svcIdx = useRotatingIndex(rotatingServices.length, 4000);
  const liveCount = useLiveCounter(12847, 3, 2200);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Keyframe for progress bar */}
      <style>{`@keyframes hero-progress{0%{width:0}100%{width:100%}}`}</style>

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
            <a href="#how" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">How It Works</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login"><Button variant="ghost" size="sm" className="text-slate-600">Log in</Button></Link>
            <Link href="/auth/register"><Button size="sm" className="bg-sky-600 text-white hover:bg-sky-700 shadow-sm">Get Started</Button></Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-40 left-1/2 h-200 w-300 -translate-x-1/2 rounded-full bg-linear-to-br from-sky-100/80 via-cyan-50/60 to-blue-100/40 blur-3xl" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
          </div>
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.3]" style={{ backgroundImage: "radial-gradient(circle, #94a3b8 0.7px, transparent 0.7px)", backgroundSize: "28px 28px" }} />

          <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 md:pb-28 lg:pt-28">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left — Copy */}
              <div className="max-w-xl">
                {/* Live counter badge */}
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50/80 px-4 py-1.5 text-xs font-semibold text-sky-700 backdrop-blur-sm">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-500 opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-sky-600" />
                  </span>
                  <span className="tabular-nums">{liveCount.toLocaleString()}</span> OTPs delivered today
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
                  Instant OTP for
                  <br />
                  <RotatingWord words={rotatingServices.map((s) => s.name)} activeIdx={svcIdx} />
                  <br />
                  <span className="relative whitespace-nowrap text-slate-900">
                    from{" "}
                    <span className="relative">
                      <span className="absolute -bottom-1 left-0 right-0 h-3 rounded bg-sky-200/50" />
                      <span className="relative">any country.</span>
                    </span>
                  </span>
                </h1>

                <p className="mt-6 text-lg leading-relaxed text-slate-500">
                  Pick a virtual number from <strong className="text-slate-700">150+ countries</strong>,
                  get your verification code in seconds, and move on.
                  No SIM cards. No personal number exposed. Just <strong className="text-slate-700">300+ services</strong> at your fingertips.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/auth/register">
                    <Button
                      size="lg"
                      className="group h-13 min-w-52 bg-sky-600 text-base font-semibold text-white shadow-lg shadow-sky-200/60 hover:bg-sky-700 hover:shadow-sky-300/60 active:scale-[0.97] transition-all"
                    >
                      Start Receiving OTPs
                      <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <p className="text-sm text-slate-400 sm:ml-1">
                    Free to sign up · Pay per use · No commitments
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-slate-500">
                  <span className="flex items-center gap-1.5"><Zap className="size-3.5 text-amber-500" />OTP in under 30s</span>
                  <span className="flex items-center gap-1.5"><Shield className="size-3.5 text-emerald-500" />Private & disposable</span>
                  <span className="flex items-center gap-1.5"><Globe className="size-3.5 text-sky-500" />150+ countries</span>
                </div>
              </div>

              {/* Right — Interactive phone mockup */}
              <PhoneMockup serviceIdx={svcIdx} />
            </div>

            {/* Trust bar */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-10 lg:mt-20">
              {[
                { val: "150+", lbl: "Countries" },
                { val: "300+", lbl: "Services" },
                { val: "10K+", lbl: "Users" },
                { val: "<30s", lbl: "Avg delivery" },
                { val: "99.9%", lbl: "Uptime" },
              ].map(({ val, lbl }) => (
                <div key={lbl} className="flex items-baseline gap-1.5 px-3">
                  <span className="text-2xl font-extrabold tracking-tight text-sky-600">{val}</span>
                  <span className="text-xs font-medium text-slate-400">{lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Supported Services */}
        <section id="services" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/60 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">300+ Supported Services</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Get OTPs for any platform</h2>
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
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Numbers from around the world</h2>
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
        <section id="how" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/60 px-4 py-16 sm:px-6 sm:py-20">
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
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-lg font-bold text-white shadow-lg shadow-sky-200">{n}</div>
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

      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <Link href="/">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/10tap.png" alt="10tap" className="h-7" />
              </Link>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-500">
                Virtual phone numbers & OTP verification for 300+ services across 150+ countries. A product by Syntix.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><a href="#services" className="transition-colors hover:text-slate-800">Services</a></li>
                <li><a href="#countries" className="transition-colors hover:text-slate-800">Countries</a></li>
                <li><a href="#how" className="transition-colors hover:text-slate-800">How it works</a></li>
                <li><Link href="/auth/register" className="transition-colors hover:text-slate-800">Sign up</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">Company</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><Link href="/about" className="transition-colors hover:text-slate-800">About us</Link></li>
                <li><Link href="/contact" className="transition-colors hover:text-slate-800">Contact</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">Legal</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><Link href="/terms" className="transition-colors hover:text-slate-800">Terms &amp; Conditions</Link></li>
                <li><Link href="/privacy" className="transition-colors hover:text-slate-800">Privacy Policy</Link></li>
                <li><Link href="/refund" className="transition-colors hover:text-slate-800">Refund &amp; Cancellation</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Syntix. All rights reserved. 10tap is a Syntix product.</p>
            <p>Made for developers & businesses.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
