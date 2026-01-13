"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FaHospital,
  FaUserMd,
  FaHeartbeat,
  FaCalendarCheck,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaShieldAlt,
  FaFlask,
  FaBriefcaseMedical,
  FaAmbulance,
  FaUniversity,
  FaLaptopMedical,
  FaChevronRight,
  FaStar,
  FaHandsHelping,
} from "react-icons/fa";
import { HiBars3BottomRight, HiXMark } from "react-icons/hi2";
import { motion, useAnimation, useInView, AnimatePresence } from "framer-motion";

export default function NajbelLandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50/30 overflow-x-hidden"> {/* Fix overflow-x */}
      {/* ... Background ... */}

      {/* Header */}
      <header className={`fixed top-4 md:top-6 inset-x-4 md:inset-x-6 max-w-7xl mx-auto z-50 py-2 md:py-4 px-5 md:px-6 transition-all duration-300 ${scrolled || mobileMenuOpen
        ? 'bg-white/90 backdrop-blur-xl border border-blue-100 shadow-xl'
        : 'bg-blue-900/10 backdrop-blur-xl border border-white/20'
        } rounded-3xl md:rounded-full shadow-lg`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer z-50 relative"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">NAJBEL</h1>
              <p className="text-xs text-gray-500 font-medium">GROUP</p>
            </div>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8">
            {["Services", "About", "Partners", "Careers", "Contact"].map((item, idx) => (
              <motion.a
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                href="#"
                className="font-medium text-gray-700 hover:text-blue-600 transition-all hover:scale-105 relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex gap-3">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/login")}
              className="px-6 py-2.5 rounded-full text-blue-700 font-semibold hover:bg-white/50 transition-all duration-300 border border-blue-100 hover:border-blue-200 hover:shadow-md"
            >
              Sign In
            </motion.button>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/register")}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-semibold hover:shadow-xl transition-all duration-300 group"
            >
              <span className="flex items-center gap-2">
                Get Started
                <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2.5 text-gray-700 hover:text-blue-600 bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-full hover:bg-blue-50 transition-all duration-300 z-50 relative shadow-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <HiXMark size={24} /> : <HiBars3BottomRight size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-white/50 backdrop-blur-sm border-t border-gray-100 mt-4 rounded-2xl"
            >
              <div className="flex flex-col p-4 space-y-4">
                {["Services", "About", "Partners", "Careers", "Contact"].map((item) => (
                  <a key={item} href="#" className="text-lg font-medium text-gray-800 py-2 border-b border-gray-100/50">
                    {item}
                  </a>
                ))}
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full py-3 rounded-xl border border-blue-200 text-blue-700 font-semibold"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push("/register")}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 relative">
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block mb-6"
            >
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                Trusted Nationwide
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Unified Excellence in
              <span className="block mt-4">
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Healthcare & Education
                </span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              A comprehensive ecosystem of medical services, educational institutions,
              and innovative solutions for a healthier, smarter future.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row justify-center gap-4 mb-20"
            >
              <button
                onClick={() => router.push("/register")}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <span>Start Free Trial</span>
                <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push("/login")}
                className="px-8 py-4 bg-white/90 backdrop-blur-sm text-gray-800 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/60 hover:border-blue-200"
              >
                Book a Demo
              </button>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              <GlassStatCard
                icon={<FaUserMd />}
                value="500+"
                label="Medical Professionals"
                delay={0}
              />
              <GlassStatCard
                icon={<FaGraduationCap />}
                value="10+"
                label="Educational Institutions"
                delay={0.1}
              />
              <GlassStatCard
                icon={<FaHeartbeat />}
                value="50K+"
                label="Patients Served"
                delay={0.2}
              />
              <GlassStatCard
                icon={<FaShieldAlt />}
                value="100%"
                label="Accreditation"
                delay={0.3}
              />
            </motion.div>
          </div>

          {/* Services */}
          <div className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Our <span className="text-blue-600">Divisions</span>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Comprehensive services spanning healthcare, education, and innovation
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <ServiceCard key={index} index={index} {...service} />
              ))}
            </div>
          </div>

          {/* Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative mb-20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-cyan-600/10 rounded-3xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 md:p-12 border border-blue-100/50 shadow-lg">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Why Choose <span className="text-blue-600">Najbel</span>?
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  We combine excellence with compassion to deliver unparalleled services
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {valueProps.map((prop, index) => (
                  <ValueProp key={index} index={index} {...prop} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Contact */}
      <section className="py-20 px-6 relative">
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 md:p-12 shadow-2xl border border-blue-100/50"
          >
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Connect With <span className="text-blue-600">Us</span>
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Reach out to learn more about our services, partnerships, or career opportunities.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mb-10">
              {contactInfo.map((item, index) => (
                <ContactItem key={index} index={index} {...item} />
              ))}
            </div>

            <div className="text-center">
              <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <span className="flex items-center justify-center gap-2">
                  Schedule a Consultation
                  <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 bg-gradient-to-br from-gray-900 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">NAJBEL GROUP</h3>
                  <p className="text-blue-200">
                    Healthcare • Education • Innovation
                  </p>
                </div>
              </div>
              <p className="text-blue-300/80 max-w-md">
                Transforming lives through integrated healthcare and education solutions.
              </p>
            </div>

            <div className="text-center md:text-right">
              <div className="flex items-center gap-2 justify-center md:justify-end mb-4">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="text-yellow-400" />
                ))}
                <span className="ml-2 text-blue-200">Rated 4.9/5</span>
              </div>
              <p className="text-blue-300 mb-2">
                © {new Date().getFullYear()} Najbel Group
              </p>
              <p className="text-sm text-blue-400">
                Powered by AmmicX Systems
              </p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/10 text-center text-blue-300">
            <p>All rights reserved. Committed to excellence in service delivery.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function GlassStatCard({
  icon,
  value,
  label,
  delay = 0,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
      <div className="relative bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 group-hover:border-blue-200/50 transition-all duration-300">
        <div className="text-blue-600 mb-4 text-3xl flex justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="text-3xl font-bold text-gray-900 text-center group-hover:text-blue-700 transition-colors">
          {value}
        </div>
        <div className="text-sm text-gray-600 text-center mt-2 group-hover:text-gray-800">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

type ServiceColor = "blue" | "green" | "purple" | "red" | "cyan" | "orange";

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: ServiceColor;
  index: number;
}

const services: Omit<ServiceCardProps, 'index'>[] = [
  {
    icon: <FaHospital />,
    title: "Healthcare Services",
    description: "Hospitals, clinics, and specialized medical centers providing comprehensive care.",
    color: "blue"
  },
  {
    icon: <FaUniversity />,
    title: "Education",
    description: "Schools, colleges, and training institutes fostering academic excellence.",
    color: "green"
  },
  {
    icon: <FaFlask />,
    title: "Research & Innovation",
    description: "Medical research facilities and innovation hubs driving healthcare advancement.",
    color: "purple"
  },
  {
    icon: <FaAmbulance />,
    title: "Emergency Services",
    description: "24/7 emergency response and ambulance services across regions.",
    color: "red"
  },
  {
    icon: <FaLaptopMedical />,
    title: "Digital Health",
    description: "Telemedicine, health records, and digital healthcare solutions.",
    color: "cyan"
  },
  {
    icon: <FaBriefcaseMedical />,
    title: "Medical Training",
    description: "Professional development and continuous medical education programs.",
    color: "orange"
  },
];

function ServiceCard({ icon, title, description, color = "blue", index }: ServiceCardProps) {
  const colorClasses: Record<ServiceColor, string> = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    purple: "from-purple-500 to-pink-500",
    red: "from-red-500 to-orange-500",
    cyan: "from-cyan-500 to-blue-500",
    orange: "from-orange-500 to-yellow-500",
  };

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { delay: index * 0.1 }
        }
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      <div className="relative bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group-hover:border-blue-100">
        <div className="relative">
          <div className={`absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl opacity-10 group-hover:opacity-20 transition-opacity`} />
          <div className={`text-4xl mb-6 bg-gradient-to-br ${colorClasses[color]} bg-clip-text text-transparent`}>
            {icon}
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 group-hover:text-gray-800 transition-colors">
          {description}
        </p>
        <div className="mt-6 flex items-center text-blue-600 font-medium group-hover:text-blue-700">
          <span>Learn more</span>
          <FaChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

const valueProps = [
  {
    title: "Integrated Ecosystem",
    description: "Seamless coordination between healthcare, education, and research divisions.",
    icon: <FaHandsHelping />
  },
  {
    title: "Quality Assurance",
    description: "Highest standards of medical care and educational excellence.",
    icon: <FaShieldAlt />
  },
  {
    title: "Innovation Driven",
    description: "Continuous adoption of cutting-edge technologies and methodologies.",
    icon: <FaFlask />
  },
];

function ValueProp({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      className="text-center p-6 rounded-2xl hover:bg-white/50 transition-all duration-300 group"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="font-bold text-gray-900 mb-3 text-lg group-hover:text-blue-700">
        {title}
      </h4>
      <p className="text-gray-600 text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

const contactInfo = [
  {
    icon: <FaPhoneAlt />,
    text: "+234 7087 577 535",
    subtitle: "General Inquiries"
  },
  {
    icon: <FaEnvelope />,
    text: "info@najbelgroup.com",
    subtitle: "Email Support"
  },
  {
    icon: <FaMapMarkerAlt />,
    text: "Headquarters: Kano",
    subtitle: "Multiple Locations Nationwide"
  },
];

function ContactItem({
  icon,
  text,
  subtitle,
  index,
}: {
  icon: React.ReactNode;
  text: string;
  subtitle?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 min-w-[220px]"
    >
      <div className="text-blue-600 text-2xl mb-4 p-3 bg-blue-50 rounded-full">
        {icon}
      </div>
      <span className="font-bold text-gray-900 text-lg mb-2 text-center">
        {text}
      </span>
      {subtitle && (
        <span className="text-sm text-gray-500 text-center">
          {subtitle}
        </span>
      )}
    </motion.div>
  );
}