"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Hospital, UserRound, HeartPulse, Phone, Mail, MapPin,
  GraduationCap, ShieldCheck, FlaskConical, Briefcase,
  Ambulance, Landmark, Monitor, ChevronRight, Star,
  HandHelping, Microscope, Building2, TrendingUp, Menu, X
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Color = "blue" | "green" | "purple" | "red" | "cyan" | "orange";

// ─── Data ─────────────────────────────────────────────────────────────────────
const SERVICES = [
  { icon: Hospital, title: "Healthcare Services", description: "Hospitals, clinics, and specialised medical centres providing comprehensive care.", color: "blue" as Color },
  { icon: Landmark, title: "Education", description: "Schools, colleges, and training institutes fostering academic excellence.", color: "green" as Color },
  { icon: FlaskConical, title: "Research & Innovation", description: "Medical research facilities and innovation hubs driving healthcare advancement.", color: "purple" as Color },
  { icon: Ambulance, title: "Emergency Services", description: "24/7 emergency response and ambulance services across regions.", color: "red" as Color },
  { icon: Monitor, title: "Digital Health", description: "Telemedicine, health records, and digital healthcare solutions.", color: "cyan" as Color },
  { icon: Briefcase, title: "Medical Training", description: "Professional development and continuous medical education programmes.", color: "orange" as Color },
];

const VALUE_PROPS = [
  { icon: HandHelping, title: "Integrated Ecosystem", description: "Seamless coordination between healthcare, education, and research divisions." },
  { icon: ShieldCheck, title: "Quality Assurance", description: "Highest standards of medical care and educational excellence." },
  { icon: Microscope, title: "Innovation Driven", description: "Continuous adoption of cutting-edge technologies and methodologies." },
];

const CONTACT_INFO = [
  { icon: Phone, text: "+234 7087 577 535", sub: "General Inquiries" },
  { icon: Mail, text: "info@najbelgroups.com", sub: "Email Support" },
  { icon: MapPin, text: "Headquarters: Kano", sub: "Multiple Locations" },
];

const NAV_ITEMS = ["Services", "About", "Partners", "Careers", "Contact"];

const COLOR_MAP: Record<Color, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  green: { bg: "bg-green-50", text: "text-green-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  red: { bg: "bg-red-50", text: "text-red-600" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-600" },
  orange: { bg: "bg-orange-50", text: "text-orange-600" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NajbelLandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-700 overflow-x-hidden antialiased" style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>

      {/* ── Header ────────────────────────────────── */}
      <header className={`fixed top-3 left-3 right-3 md:top-4 md:left-6 md:right-6 max-w-7xl mx-auto z-50 transition-all duration-300 rounded-2xl md:rounded-full px-5 py-2 ${scrolled || menuOpen ? "bg-white/90 backdrop-blur-lg border border-gray-100 shadow-md" : "bg-white/80 backdrop-blur-sm border border-gray-50/50 shadow-sm"
        }`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-sky-500 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <div className="text-left">
              <p className="text-base font-semibold tracking-tight text-gray-800 leading-tight">NAJBEL</p>
              <p className="text-[9px] text-gray-400 -mt-0.5 tracking-wide">GROUP</p>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-6">
            {NAV_ITEMS.map(item => (
              <a key={item} href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors relative group py-1">
                {item}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex gap-2">
            <button onClick={() => router.push("/login")} className="px-5 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-full transition-all">Sign In</button>
            <button onClick={() => router.push("/register")} className="px-5 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm transition-all flex items-center gap-1">
              Get Started <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMenuOpen(v => !v)} className="md:hidden p-1.5 text-gray-600 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden overflow-hidden mt-3">
            <div className="flex flex-col space-y-2 py-3 border-t border-gray-100">
              {NAV_ITEMS.map(item => (
                <a key={item} href="#" onClick={() => setMenuOpen(false)} className="text-gray-700 py-1.5 text-sm font-medium hover:text-blue-600 transition-colors">{item}</a>
              ))}
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={() => { router.push("/login"); setMenuOpen(false); }} className="w-full py-2 text-center border border-gray-200 rounded-xl text-blue-700 font-medium text-sm">Sign In</button>
                <button onClick={() => { router.push("/register"); setMenuOpen(false); }} className="w-full py-2 text-center bg-blue-600 text-white rounded-xl font-medium text-sm shadow-sm">Get Started</button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Main ──────────────────────────────────── */}
      <main className="pt-24 pb-16 px-5">
        <div className="max-w-6xl mx-auto">

          {/* Hero */}
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium tracking-wide mb-4">Trusted Nationwide</span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[1.2]">
              Unified Excellence in<br />
              <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">Healthcare &amp; Education</span>
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto mt-4 text-base">
              A complete ecosystem of medical services, academic institutions, and breakthrough innovation.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
              <button onClick={() => router.push("/register")} className="px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex items-center justify-center gap-1.5">
                Start Free Trial <ChevronRight className="w-3 h-3" />
              </button>
              <button onClick={() => router.push("/login")} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-blue-300 hover:text-blue-600 transition-all">
                Book a Demo
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-16">
            {[
              { icon: UserRound, value: "500+", label: "Medical Professionals" },
              { icon: GraduationCap, value: "10+", label: "Institutions" },
              { icon: HeartPulse, value: "50K+", label: "Patients Served" },
              { icon: ShieldCheck, value: "100%", label: "Accredited" },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <s.icon className="w-5 h-5 text-blue-500 mx-auto mb-3" />
                <div className="text-2xl font-semibold text-gray-800">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Services */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-800">Our <span className="text-blue-600">Divisions</span></h2>
              <p className="text-gray-500 text-sm mt-1">Comprehensive solutions across sectors</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICES.map((s, i) => {
                const cc = COLOR_MAP[s.color];
                return (
                  <div key={i} className="group bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex flex-col">
                    <div className={`w-12 h-12 rounded-xl ${cc.bg} ${cc.text} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300`}>
                      <s.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed flex-1">{s.description}</p>
                    <div className="mt-5 flex items-center text-sm font-medium text-blue-600 gap-0.5 group-hover:gap-1.5 transition-all">
                      <span>Learn more</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Value Props */}
          <div className="mb-16">
            <div className="bg-gray-50/60 rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="text-center mb-7">
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Why <span className="text-blue-600">Najbel</span>?</h3>
                <p className="text-gray-500 text-sm mt-1">Excellence meets compassion, innovation meets reliability</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {VALUE_PROPS.map((v, i) => (
                  <div key={i} className="text-center p-5 rounded-xl hover:bg-white transition-all duration-300 hover:-translate-y-1">
                    <div className="inline-flex items-center justify-center w-11 h-11 bg-blue-50 text-blue-600 rounded-xl mb-4">
                      <v.icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">{v.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{v.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="text-center mb-6">
              <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Connect With <span className="text-blue-600">Us</span></h3>
              <p className="text-gray-500 text-sm mt-1">Reach out to learn more about our services</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {CONTACT_INFO.map((c, i) => (
                <div key={i} className="flex flex-col items-center p-4 min-w-[180px] hover:-translate-y-0.5 transition-transform">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                    <c.icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-gray-800 text-sm text-center">{c.text}</span>
                  <span className="text-xs text-gray-400 mt-1 text-center">{c.sub}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <button className="px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 inline-flex items-center gap-1.5">
                Schedule a Consultation <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────── */}
      <footer className="bg-gray-900 text-white py-10 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
                <div className="h-9 w-9 bg-gradient-to-br from-blue-400 to-sky-400 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">NAJBEL GROUP</h3>
                  <p className="text-gray-400 text-xs">Healthcare • Education • Innovation</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm max-w-xs">Transforming lives through integrated healthcare and education solutions.</p>
            </div>
            <div className="text-center md:text-right">
              <div className="flex items-center gap-1 justify-center md:justify-end mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />)}
                <span className="text-gray-400 text-xs ml-2">Rated 4.9/5</span>
              </div>
              <p className="text-gray-400 text-xs">© {new Date().getFullYear()} Najbel Group</p>
              <p className="text-gray-500 text-[10px] mt-1">Powered by Electron Co. Ltd</p>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-gray-800 text-center text-gray-500 text-xs">
            All rights reserved. Committed to excellence in service delivery.
          </div>
        </div>
      </footer>
    </div>
  );
}