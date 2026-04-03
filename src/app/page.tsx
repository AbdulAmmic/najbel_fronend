// app/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Hospital,
  HeartPulse,
  Monitor,
  Ambulance,
  GraduationCap,
  FlaskConical,
  Briefcase,
  ArrowRight,
  ChevronRight,
  Phone,
  Mail,
  ShieldCheck,
  Zap,
  Globe,
  Quote,
  MapPin,
  Play,
  Menu,
  X,
} from "lucide-react";

type ServiceColor = "indigo" | "sky" | "rose" | "teal" | "violet" | "amber";

interface Service {
  icon: React.ElementType;
  title: string;
  description: string;
  color: ServiceColor;
}

interface Stat {
  value: string;
  label: string;
}

const SERVICES: Service[] = [
  {
    icon: Hospital,
    title: "Long-term Care",
    description: "Personalized support and medical oversight for residents who require ongoing assistance.",
    color: "rose",
  },
  {
    icon: HeartPulse,
    title: "Skilled Nursing",
    description: "24/7 medical care by professional nurses for complex health needs.",
    color: "sky",
  },
  {
    icon: Zap,
    title: "Memory Care",
    description: "Specially designed programs for individuals living with Alzheimer's or dementia.",
    color: "amber",
  },
  {
    icon: HeartPulse,
    title: "Rehabilitation",
    description: "Comprehensive physical therapy to help residents regain strength and independence.",
    color: "teal",
  },
  {
    icon: FlaskConical,
    title: "Dietary Services",
    description: "Chef-prepared, nutritious meals tailored to individual dietary requirements.",
    color: "violet",
  },
  {
    icon: MapPin,
    title: "Social Community",
    description: "Engaging social activities and events to foster a sense of belonging.",
    color: "indigo",
  },
];

const STATS: Stat[] = [
  { value: "10+", label: "Years of Care" },
  { value: "100%", label: "Caregiver Presence" },
  { value: "50+", label: "Comfortable Suites" },
  { value: "24/7", label: "Professional Support" },
];

const COLOR_MAP: Record<ServiceColor, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  sky: "bg-sky-50 text-sky-600",
  rose: "bg-rose-50 text-rose-500",
  teal: "bg-teal-50 text-teal-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
};

export default function HomePage() {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  }, []);

  return (
    <main className="relative overflow-x-hidden bg-[#FCFCFD]">
      {/* Navigation */}
      <nav
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-6xl transition-all duration-300 ${scrolled ? "shadow-md" : ""
          }`}
      >
        <div
          className={`bg-white/80 backdrop-blur-md rounded-2xl border px-5 py-3 md:px-7 md:py-4 flex items-center justify-between transition-all ${scrolled ? "border-slate-200/80 shadow-sm" : "border-white/40 shadow-sm"
            }`}
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <HeartPulse size={16} strokeWidth={1.5} />
            </div>
            <span className="font-semibold text-xl tracking-tight text-slate-800">
              Najbel<span className="font-light text-indigo-500"> Nursing Home</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {["services", "insights", "contact"].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors capitalize"
              >
                {item}
              </button>
            ))}
            <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition">
              Login
            </Link>
            <button className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-medium shadow-md hover:bg-indigo-600 transition-all duration-200 active:scale-95">
              Join Now
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-600"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl pt-28 px-8 transition-all md:hidden">
          <div className="flex flex-col gap-7 text-lg">
            {["services", "insights", "contact"].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="border-b border-slate-100 py-2 text-slate-700 font-medium text-left capitalize"
              >
                {item}
              </button>
            ))}
            <div className="pt-4 flex flex-col gap-4">
              <Link href="/login" className="text-slate-600 font-medium text-left">Login</Link>
              <button className="bg-slate-900 text-white py-3 rounded-full font-medium text-center">
                Join Now →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 md:pt-56 md:pb-40 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/30 rounded-full blur-[140px] -z-10" />
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-sky-100/20 rounded-full blur-[140px] -z-10" />
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] bg-indigo-50/40 rounded-full blur-[120px] -z-10" />

        <div className="max-w-6xl mx-auto px-6 text-center">


          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6 max-w-4xl mx-auto">
            Dignity, comfort &{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
              exceptional care
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-light mb-10">
            Providing a sanctuary of professional medical support and compassionate community 
            for the ones you love most. Your peace of mind starts at Najbel.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <button className="group w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-medium text-lg flex items-center justify-center gap-2 transition-all hover:bg-indigo-700 hover:shadow-xl shadow-lg hover:-translate-y-1">
              Schedule a Visit <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto bg-white border border-slate-200 px-8 py-4 rounded-2xl font-medium text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 hover:shadow-md">
              <Play size={18} /> Explore Our Community
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-16 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
              <ShieldCheck size={14} className="text-indigo-400" /> Trust & Safety Verified
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
              <Zap size={14} className="text-amber-400" /> 24/7 Rapid Care
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
              <Globe size={14} className="text-sky-400" /> Standard Excellence
            </span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-slate-100 py-12">
          {STATS.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-4xl md:text-5xl font-light text-slate-800 mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-xl">
              <span className="text-indigo-500 text-sm font-semibold tracking-wider uppercase">
                Our Services
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mt-2">
                Dedicated care for every resident
              </h2>
            </div>
            <button className="text-indigo-600 font-medium text-sm flex items-center gap-1 border-b border-indigo-200 pb-1 hover:border-indigo-600 transition-all">
              Explore all <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((service, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-3xl border border-slate-100 p-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${COLOR_MAP[service.color]} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}
                >
                  <service.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">{service.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insights / Testimonial Section */}
      <section id="insights" className="py-24 bg-gradient-to-b from-white to-slate-50/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <span className="text-indigo-500 text-sm font-semibold tracking-wide">
                Trusted by healthcare leaders
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mt-4 mb-6">
                Founded on love, dedication & professionalism
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                Najbel Nursing Home provides a unified workspace for caregivers, staff, and administrators, 
                ensuring a high standard of resident well-being.
              </p>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex -space-x-2">
                  {["JD", "MK", "RT"].map((initials, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-700 text-xs font-bold"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <span className="text-slate-500 font-light">Join 200+ forward-thinking clinics</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-md border border-slate-100 relative">
              <Quote size={32} className="text-indigo-200 absolute top-6 right-6" />
              <p className="text-lg italic font-light text-slate-600 leading-relaxed">
                "The experience at Najbel was seamless. The staff is attentive, and the 
                environment is truly professional and caring. It's not just a nursing home, it's a home."
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700">
                  DM
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Dr. Meera Lopez</p>
                  <p className="text-xs text-slate-400">Chief Medical Officer, Nova Health</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-6xl mx-auto relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />

          <div className="relative py-20 md:py-28 px-8 text-center">
            <span className="inline-block text-indigo-300 text-sm font-semibold tracking-wider mb-4 border border-indigo-400/30 rounded-full px-4 py-1 bg-indigo-500/10 backdrop-blur-sm">
              Your home away from home
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
              Ready to experience <br /> better care?
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-12 font-light">
              Join the community at Najbel Nursing Home and discover a higher standard 
              of luxury care and compassion.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-50 transition shadow-lg">
                Request demo <ArrowRight size={18} />
              </button>
              <button className="border border-slate-600 text-white px-8 py-4 rounded-2xl font-medium hover:bg-white/5 transition">
                Contact sales
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 mt-16 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Phone size={16} /> +234 708 757 7535
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} /> info@najbelgroups.com
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} /> Global · Remote-first
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-lg flex items-center justify-center text-white">
              <HeartPulse size={14} />
            </div>
            <span className="font-semibold text-slate-800 text-lg tracking-tight">
              Najbel<span className="font-light text-indigo-500"> Nursing Home</span>
            </span>
            <span className="text-xs text-slate-400 ml-2 hidden sm:inline">© 2026</span>
          </div>

          <div className="flex gap-8 text-sm text-slate-400">
            <button className="hover:text-indigo-500 transition">Privacy</button>
            <button className="hover:text-indigo-500 transition">Security</button>
            <button className="hover:text-indigo-500 transition">Status</button>
            <button className="hover:text-indigo-500 transition">LinkedIn</button>
          </div>

          <div className="text-xs text-slate-400 font-light">Designed for human-centric healthcare</div>
        </div>
      </footer>
    </main>
  );
}