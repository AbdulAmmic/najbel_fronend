// app/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  HeartPulse, Stethoscope, Leaf,
  ArrowRight, Phone, Mail, MapPin, Menu, X,
  ShieldCheck, Clock, Star, ChevronRight, Quote,
  FlaskConical, Activity, Bed, Users,
} from "lucide-react";

const SERVICES = [
  { icon: Bed, title: "Long-term Care", description: "Personalized support and medical oversight for residents requiring ongoing care.", accent: "#3B82F6", bg: "#EFF6FF" },
  { icon: HeartPulse, title: "Skilled Nursing", description: "24/7 professional nursing care for complex health needs by certified staff.", accent: "#0EA5E9", bg: "#F0F9FF" },
  { icon: Activity, title: "Rehabilitation", description: "Comprehensive physical & occupational therapy to restore independence.", accent: "#14B8A6", bg: "#F0FDFA" },
  { icon: Stethoscope, title: "Memory Care", description: "Specialized, compassionate programs for Alzheimer's and dementia residents.", accent: "#8B5CF6", bg: "#F5F3FF" },
  { icon: FlaskConical, title: "Diagnostics", description: "On-site lab services and diagnostics for prompt, accurate clinical decisions.", accent: "#F59E0B", bg: "#FFFBEB" },
  { icon: Users, title: "Social & Community", description: "Engaging programs that nurture connection, purpose, and daily joy.", accent: "#10B981", bg: "#ECFDF5" },
];

const STATS = [
  { value: "10+", label: "Years of Care" },
  { value: "200+", label: "Patients Served" },
  { value: "50+", label: "Comfortable Suites" },
  { value: "24/7", label: "Professional Support" },
];

const HERO_SLIDES = [
  {
    image: "/hero1.png",
    label: "Skilled Nursing",
    caption: "Around-the-clock professional care with warmth and dignity",
  },
  {
    image: "/hero2.png",
    label: "Expert Doctors",
    caption: "A dedicated team of physicians and specialists at your side",
  },
  {
    image: "/hero3.png",
    label: "Community & Comfort",
    caption: "A home-like environment where residents truly belong",
  },
];

const TESTIMONIALS = [
  {
    text: "The care at Najbel is exceptional. Every staff member treats our mother with dignity and warmth. It truly feels like a second home.",
    name: "Adaeze Okafor",
    role: "Family Member",
    initials: "AO",
  },
  {
    text: "As a referring physician, I trust Najbel completely. Their clinical standards and response time are top-tier.",
    name: "Dr. Emeka Nwosu",
    role: "Consultant Physician",
    initials: "EN",
  },
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  }, []);

  return (
    <main className="relative overflow-x-hidden" style={{ background: "#F8FAFF", fontFamily: "'Nunito', system-ui, sans-serif" }}>

      {/* ── Navbar ─────────────────────────────── */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-6xl transition-all duration-300">
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all ${
          scrolled
            ? "bg-white/95 backdrop-blur-lg border border-slate-100"
            : "bg-white/70 backdrop-blur-md border border-white/60"
        }`}>

          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5 group">
            <Image src="/logo.png" alt="Najbel Clinic" width={36} height={36} className="rounded-xl object-cover group-hover:scale-105 transition-transform" priority />
            <div className="leading-none">
              <p className="text-[15px] font-black text-slate-900 tracking-tight">Najbel</p>
              <p className="text-[10px] font-semibold text-blue-500 tracking-wider uppercase">Nursing Home</p>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-7">
            {["services", "about", "contact"].map(item => (
              <button key={item} onClick={() => scrollTo(item)} className="text-[13px] font-semibold text-slate-500 hover:text-blue-600 transition-colors capitalize tracking-wide">
                {item}
              </button>
            ))}
            <Link href="/login" className="text-[13px] font-bold text-slate-700 hover:text-blue-600 transition-colors">
              Login
            </Link>
            <Link href="/register" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[13px] font-bold hover:bg-blue-700 transition-all active:scale-95">
              Join Now
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-9 h-9 flex items-center justify-center text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white/98 backdrop-blur-xl pt-24 px-7 md:hidden">
          <div className="flex flex-col gap-1">
            {["services", "about", "contact"].map(item => (
              <button key={item} onClick={() => scrollTo(item)} className="py-4 border-b border-slate-100 text-left text-base font-bold text-slate-700 capitalize">
                {item}
              </button>
            ))}
            <div className="pt-6 flex flex-col gap-3">
              <Link href="/login" className="py-3 text-center font-bold text-slate-600 border border-slate-200 rounded-xl">Login</Link>
              <Link href="/register" className="py-3 bg-blue-600 text-white rounded-xl font-bold text-center">Join Now →</Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ────────────────────────────────── */}
      <section className="relative pt-28 pb-0 md:pt-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center min-h-[80vh] md:min-h-[82vh]">

            {/* Left — Text */}
            <div className="py-10 md:py-16 z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] mb-5">
                Dignity, Comfort &{" "}
                <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                  Exceptional Care
                </span>
              </h1>

              <p className="text-[16px] text-slate-500 leading-relaxed mb-8 max-w-md font-medium">
                A sanctuary of professional medical support and compassionate community for those you love most. Your peace of mind starts here.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/register" className="group bg-blue-600 text-white px-7 py-3.5 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95">
                  Join Now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button onClick={() => scrollTo("services")} className="bg-white border border-slate-200 px-7 py-3.5 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-blue-200 transition-all flex items-center justify-center gap-2 text-[15px]">
                  Our Services <ChevronRight size={16} />
                </button>
              </div>

              {/* Trust pills */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  { icon: ShieldCheck, label: "Certified Facility", color: "text-blue-500" },
                  { icon: Clock, label: "24/7 Support", color: "text-amber-500" },
                  { icon: Star, label: "Top-Rated Care", color: "text-emerald-500" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-full px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    <Icon size={11} className={color} />{label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Image Slider */}
            <div className="relative h-[340px] md:h-[580px] rounded-3xl overflow-hidden">
              {HERO_SLIDES.map((s, i) => (
                <div
                  key={i}
                  className="absolute inset-0 transition-opacity duration-1000"
                  style={{ opacity: slide === i ? 1 : 0, pointerEvents: slide === i ? 'auto' : 'none' }}
                >
                  <Image
                    src={s.image}
                    alt={s.label}
                    fill
                    className="object-cover"
                    priority={i === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                  {/* Caption */}
                  <div className="absolute bottom-5 left-5 right-5">
                    <span className="inline-block text-[10px] font-black text-white/80 uppercase tracking-widest bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-2">
                      {s.label}
                    </span>
                    <p className="text-white font-bold text-[14px] leading-snug">{s.caption}</p>
                  </div>
                </div>
              ))}

              {/* Dot indicators */}
              <div className="absolute top-4 right-4 flex gap-1.5 z-10">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className={`rounded-full transition-all duration-300 ${
                      slide === i ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-10 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-7 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl font-black text-blue-600 tracking-tight mb-1">{s.value}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ──────────────────────────── */}
      <section id="services" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-blue-500 text-[11px] font-bold tracking-widest uppercase mb-3 block">What We Offer</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
              Dedicated care for every resident
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto text-[15px] leading-relaxed">
              From complex medical needs to everyday well-being, our expert team covers every dimension of care.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map((s, i) => (
              <div key={i} className="group bg-white rounded-2xl border border-slate-100 p-6 hover:-translate-y-1 transition-all duration-300 cursor-default">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: s.bg }}>
                  <s.icon size={20} style={{ color: s.accent }} strokeWidth={1.8} />
                </div>
                <h3 className="text-[16px] font-black text-slate-800 mb-2">{s.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{s.description}</p>
                <div className="mt-4 flex items-center gap-1 text-[12px] font-bold" style={{ color: s.accent }}>
                  Learn more <ChevronRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ─────────────────────────────── */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-blue-500 text-[11px] font-bold tracking-widest uppercase block mb-4">Our Story</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-5 leading-tight">
                Founded on love, <br />dedication & professionalism
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6 text-[15px]">
                Najbel Nursing Home is more than a medical facility — it's a community built on genuine compassion. Our multidisciplinary team works in perfect harmony to provide residents with the highest standard of clinical and emotional support.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: ShieldCheck, title: "Certified & accredited", desc: "Meeting all national healthcare standards" },
                  { icon: Stethoscope, title: "Expert medical team", desc: "Physicians, nurses, therapists — on call" },
                  { icon: Leaf, title: "Holistic wellbeing", desc: "Mind, body, and spirit all cared for" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800">{title}</p>
                      <p className="text-[12px] text-slate-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`relative bg-white rounded-2xl p-6 border transition-all duration-300 cursor-pointer ${
                    activeTestimonial === i
                      ? "border-blue-200 ring-1 ring-blue-100"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <Quote size={22} className="text-blue-100 absolute top-5 right-5" />
                  <p className="text-[13px] italic text-slate-600 leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white text-xs font-black">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-slate-800">{t.name}</p>
                      <p className="text-[11px] text-slate-400">{t.role}</p>
                    </div>
                    {activeTestimonial === i && (
                      <div className="ml-auto flex gap-0.5">
                        {[1,2,3,4,5].map(s => <Star key={s} size={10} className="text-amber-400 fill-amber-400" />)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Portal card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <Image src="/logo.png" alt="Najbel" width={36} height={36} className="rounded-xl object-cover" />
                  <div>
                    <p className="text-[13px] font-black">Najbel Portal</p>
                    <p className="text-[11px] text-slate-400">Secure access for all users</p>
                  </div>
                </div>
                <p className="text-[12px] text-slate-400 mb-4 leading-relaxed">
                  Doctors, nurses, admins and patients can securely access records, appointments and more.
                </p>
                <div className="flex gap-2">
                  <Link href="/login" className="inline-flex items-center gap-1.5 bg-white/10 text-white text-[12px] font-bold px-4 py-2.5 rounded-xl hover:bg-white/20 transition-all border border-white/10">
                    Login
                  </Link>
                  <Link href="/register" className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[12px] font-bold px-4 py-2.5 rounded-xl hover:bg-blue-500 transition-all">
                    Join Now <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────── */}
      <section id="contact" className="py-16 px-6">
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl text-center" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1a6db3 100%)" }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)" }} />

          <div className="relative py-16 md:py-20 px-8">
            <div className="flex justify-center mb-7">
              <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-white/20">
                <Image src="/logo.png" alt="Najbel" width={56} height={56} className="w-full h-full object-cover" />
              </div>
            </div>

            <span className="inline-block text-blue-300 text-[10px] font-bold tracking-widest uppercase mb-4 border border-blue-400/30 rounded-full px-4 py-1 bg-blue-500/10">
              Begin the journey
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4 leading-tight">
              Ready for better care?
            </h2>
            <p className="text-blue-100/80 text-[15px] max-w-md mx-auto mb-9 leading-relaxed">
              Reach out today to schedule a visit, ask questions, or learn more about our care programmes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Link href="/register" className="group bg-white text-slate-900 px-8 py-3.5 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-blue-50 transition active:scale-95">
                Join Now <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="mailto:info@najbelgroups.com" className="border border-white/20 text-white px-8 py-3.5 rounded-xl font-semibold text-[15px] hover:bg-white/10 transition flex items-center justify-center gap-2">
                <Mail size={15} /> Contact Us
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-blue-200/70 text-[13px]">
              <div className="flex items-center gap-2"><Phone size={13} /> +234 708 757 7535</div>
              <div className="flex items-center gap-2"><Mail size={13} /> info@najbelgroups.com</div>
              <div className="flex items-center gap-2"><MapPin size={13} /> Nigeria</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────── */}
      <footer className="bg-white border-t border-slate-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-5">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Najbel" width={32} height={32} className="rounded-xl object-cover" />
            <div>
              <p className="text-[14px] font-black text-slate-900 leading-tight">Najbel Nursing Home</p>
              <p className="text-[11px] text-slate-400">© 2026 · All rights reserved</p>
            </div>
          </div>

          <div className="flex gap-7 text-[13px] text-slate-400">
            {["Privacy", "Security", "Services"].map(l => (
              <button key={l} className="hover:text-blue-500 font-medium transition-colors">{l}</button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[12px] text-slate-400 font-medium">Serving patients daily</span>
          </div>
        </div>
      </footer>
    </main>
  );
}