// app/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  HeartPulse, Stethoscope, Pill, Users, Leaf,
  ArrowRight, Phone, Mail, MapPin, Menu, X,
  ShieldCheck, Clock, Star, ChevronRight, Quote,
  FlaskConical, Activity, Bed,
} from "lucide-react";

const SERVICES = [
  {
    icon: Bed,
    title: "Long-term Care",
    description: "Personalized support and medical oversight for residents requiring ongoing care.",
    accent: "#3B82F6",
    bg: "#EFF6FF",
  },
  {
    icon: HeartPulse,
    title: "Skilled Nursing",
    description: "24/7 professional nursing care for complex health needs by certified staff.",
    accent: "#0EA5E9",
    bg: "#F0F9FF",
  },
  {
    icon: Activity,
    title: "Rehabilitation",
    description: "Comprehensive physical & occupational therapy to restore independence.",
    accent: "#14B8A6",
    bg: "#F0FDFA",
  },
  {
    icon: Stethoscope,
    title: "Memory Care",
    description: "Specialized, compassionate programs for Alzheimer's and dementia residents.",
    accent: "#8B5CF6",
    bg: "#F5F3FF",
  },
  {
    icon: FlaskConical,
    title: "Diagnostics",
    description: "On-site lab services and diagnostics for prompt, accurate clinical decisions.",
    accent: "#F59E0B",
    bg: "#FFFBEB",
  },
  {
    icon: Users,
    title: "Social & Community",
    description: "Engaging programs that nurture connection, purpose, and daily joy.",
    accent: "#10B981",
    bg: "#ECFDF5",
  },
];

const STATS = [
  { value: "10+", label: "Years of Care" },
  { value: "200+", label: "Patients Served" },
  { value: "50+", label: "Comfortable Suites" },
  { value: "24/7", label: "Professional Support" },
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
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  }, []);

  return (
    <main className="relative overflow-x-hidden" style={{ background: "#F8FAFF", fontFamily: "'Nunito', system-ui, sans-serif" }}>

      {/* ── Navbar ─────────────────────────────────── */}
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-6xl transition-all duration-300`}>
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all ${
          scrolled
            ? "bg-white/95 backdrop-blur-lg shadow-lg shadow-slate-900/5 border border-slate-100"
            : "bg-white/70 backdrop-blur-md border border-white/60 shadow-md shadow-slate-900/5"
        }`}>

          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="Najbel Clinic" className="w-9 h-9 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
            <div className="leading-none">
              <p className="text-[15px] font-black text-slate-900 tracking-tight">Najbel</p>
              <p className="text-[10px] font-semibold text-blue-500 tracking-wider uppercase">Nursing Home</p>
            </div>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {["services", "about", "contact"].map(item => (
              <button key={item} onClick={() => scrollTo(item)} className="text-[13px] font-semibold text-slate-500 hover:text-blue-600 transition-colors capitalize tracking-wide">
                {item}
              </button>
            ))}
            <Link href="/login" className="text-[13px] font-bold text-slate-700 hover:text-blue-600 transition-colors">
              Staff Login
            </Link>
            <button onClick={() => scrollTo("contact")} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[13px] font-bold shadow-md shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
              Get in Touch
            </button>
          </div>

          {/* Mobile toggle */}
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
              <Link href="/login" className="py-3 text-center font-bold text-slate-600 border border-slate-200 rounded-xl">Staff Login</Link>
              <button onClick={() => scrollTo("contact")} className="py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md">Get in Touch →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative pt-36 pb-20 md:pt-48 md:pb-28 overflow-hidden">
        {/* Bg blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-10%] left-[-5%] w-[55%] h-[55%] rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />
          <div className="absolute top-[5%] right-[-5%] w-[45%] h-[45%] rounded-full" style={{ background: "radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)" }} />
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Trusted Clinical Care Since 2015
          </div>

          {/* Logo mark in hero */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-blue-200 ring-4 ring-white">
                <img src="/logo.png" alt="Najbel Logo" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md">
                <ShieldCheck size={14} className="text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.08] mb-6">
            Dignity, Comfort &{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">Exceptional Care</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none">
                <path d="M0 5 Q50 0 100 5 Q150 0 200 5" stroke="url(#g)" strokeWidth="2.5" fill="none" />
                <defs><linearGradient id="g" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#3B82F6"/><stop offset="1" stopColor="#0EA5E9"/></linearGradient></defs>
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
            A sanctuary of professional medical support and compassionate community for those you love most. Your peace of mind starts here.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={() => scrollTo("contact")} className="group w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all hover:-translate-y-0.5 active:scale-95">
              Schedule a Visit <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => scrollTo("services")} className="w-full sm:w-auto bg-white border border-slate-200 px-8 py-4 rounded-2xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-blue-200 transition-all flex items-center justify-center gap-2 text-[15px] shadow-sm">
              Explore Services <ChevronRight size={17} />
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-12">
            {[
              { icon: ShieldCheck, label: "Certified Facility", color: "text-blue-500" },
              { icon: Clock, label: "24/7 Support", color: "text-amber-500" },
              { icon: Star, label: "Top-Rated Care", color: "text-emerald-500" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white border border-slate-100 shadow-sm rounded-full px-3.5 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                <Icon size={12} className={color} />{label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl md:text-5xl font-black text-blue-600 tracking-tight mb-1">{s.value}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ──────────────────────────────── */}
      <section id="services" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-blue-500 text-xs font-bold tracking-widest uppercase mb-3 block">What We Offer</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Dedicated care for every resident
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
              From complex medical needs to everyday well-being, our expert team covers every dimension of care.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s, i) => (
              <div key={i} className="group bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110" style={{ background: s.bg }}>
                  <s.icon size={22} style={{ color: s.accent }} strokeWidth={1.8} />
                </div>
                <h3 className="text-[17px] font-black text-slate-800 mb-2">{s.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{s.description}</p>
                <div className="mt-5 flex items-center gap-1.5 text-[12px] font-bold" style={{ color: s.accent }}>
                  Learn more <ChevronRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About / Insights ─────────────────────── */}
      <section id="about" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <span className="text-blue-500 text-xs font-bold tracking-widest uppercase block mb-4">Our Story</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-5 leading-tight">
                Founded on love, <br />dedication & professionalism
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6 text-[15px]">
                Najbel Nursing Home is more than a medical facility — it's a community built on genuine compassion. Our multidisciplinary team works in perfect harmony to provide residents with the highest standard of clinical and emotional support.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { icon: ShieldCheck, title: "Certified & accredited", desc: "Meeting all national healthcare standards" },
                  { icon: Stethoscope, title: "Expert medical team", desc: "Physicians, nurses, therapists — on call" },
                  { icon: Leaf, title: "Holistic wellbeing", desc: "Mind, body, and spirit all cared for" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon size={17} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800">{title}</p>
                      <p className="text-[12px] text-slate-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Testimonials */}
            <div className="space-y-4">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`relative bg-white rounded-3xl p-7 border transition-all duration-300 cursor-pointer ${
                    activeTestimonial === i
                      ? "border-blue-200 shadow-xl shadow-blue-50 ring-2 ring-blue-100"
                      : "border-slate-100 shadow-sm hover:shadow-md"
                  }`}
                >
                  <Quote size={24} className="text-blue-100 absolute top-5 right-6" />
                  <p className="text-[14px] italic text-slate-600 leading-relaxed mb-5">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white text-xs font-black">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-slate-800">{t.name}</p>
                      <p className="text-[11px] text-slate-400">{t.role}</p>
                    </div>
                    {activeTestimonial === i && (
                      <div className="ml-auto">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => <Star key={s} size={11} className="text-amber-400 fill-amber-400" />)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Staff portal CTA */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <img src="/logo.png" alt="Najbel" className="w-9 h-9 rounded-xl object-cover" />
                  <div>
                    <p className="text-[13px] font-black">Clinical Staff Portal</p>
                    <p className="text-[11px] text-slate-400">Secure access for medical team</p>
                  </div>
                </div>
                <p className="text-[12px] text-slate-400 mb-4 leading-relaxed">
                  Doctors, nurses, and admins can access patient records, appointments, and more in our secure system.
                </p>
                <Link href="/login" className="inline-flex items-center gap-2 bg-blue-600 text-white text-[12px] font-bold px-4 py-2.5 rounded-xl hover:bg-blue-500 transition-all shadow-md shadow-blue-900/30">
                  Staff Login <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────── */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl text-center" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1e4d8c 50%, #1a6db3 100%)" }}>
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)" }} />

          <div className="relative py-16 md:py-20 px-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-xl">
                <img src="/logo.png" alt="Najbel" className="w-full h-full object-cover" />
              </div>
            </div>

            <span className="inline-block text-blue-300 text-[11px] font-bold tracking-widest uppercase mb-4 border border-blue-400/30 rounded-full px-4 py-1 bg-blue-500/10">
              Begin the journey
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-5 leading-tight">
              Ready for better care?
            </h2>
            <p className="text-blue-100/80 text-base max-w-xl mx-auto mb-10 leading-relaxed">
              Reach out today to schedule a visit, ask questions, or learn more about our care programmes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a href="tel:+2347087577535" className="group bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-blue-50 transition shadow-xl active:scale-95">
                <Phone size={16} /> Call Us Now
              </a>
              <a href="mailto:info@najbelgroups.com" className="border border-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-[15px] hover:bg-white/10 transition flex items-center justify-center gap-2">
                <Mail size={16} /> Send a Message
              </a>
            </div>

            {/* Contact details */}
            <div className="flex flex-wrap justify-center gap-8 text-blue-200/70 text-[13px]">
              <div className="flex items-center gap-2"><Phone size={14} /> +234 708 757 7535</div>
              <div className="flex items-center gap-2"><Mail size={14} /> info@najbelgroups.com</div>
              <div className="flex items-center gap-2"><MapPin size={14} /> Nigeria</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Najbel" className="w-9 h-9 rounded-xl object-cover" />
            <div>
              <p className="text-[15px] font-black text-slate-900 leading-tight">Najbel Nursing Home</p>
              <p className="text-[11px] text-slate-400">© 2026 · All rights reserved</p>
            </div>
          </div>

          <div className="flex gap-8 text-[13px] text-slate-400">
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