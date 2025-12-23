"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  CheckSquare,
  Bot,
  Calendar,
  ArrowRight,
  Check,
  Clock,
  Zap,
  Lock,
  ChevronDown,
  Sparkles,
} from "lucide-react";

// Optimized Intersection Observer hook for scroll animations
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Animated feature section
function FeatureSection({
  children,
  delay = 0
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const { ref, isInView } = useInView(0.2);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  // Use CSS animations for initial load - no mounted state needed

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 -right-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Image
              src="/VeriMedrix Logo.png"
              alt="VeriMedrix"
              width={160}
              height={36}
              className="h-9 w-auto"
            />
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                FAQ
              </a>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-105">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-sm font-medium mb-8 animate-fade-in-up"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              Built for South African Healthcare
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6 animate-fade-in-up animation-delay-100"
            >
              OHSC Compliance,{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Made Simple
              </span>
            </h1>
            <p
              className="text-lg lg:text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto animate-fade-in-up animation-delay-200"
            >
              Track all 41+ mandatory documents, automate reminders, manage tasks,
              and stay inspection-ready with the all-in-one compliance platform.
            </p>
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-300"
            >
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 px-8 text-base shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 group">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base border-slate-300 hover:border-blue-300 hover:bg-blue-50 transition-all hover:scale-105 group">
                  See Features
                  <ChevronDown className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-1" />
                </Button>
              </a>
            </div>
            <div
              className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-slate-500 animate-fade-in animation-delay-400"
            >
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                14-day free trial
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Cancel anytime
              </span>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div
            className="mt-16 lg:mt-20 animate-fade-in-up animation-delay-500"
          >
            <div className="relative max-w-5xl mx-auto group">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-200/50 bg-white transition-transform duration-500 group-hover:scale-[1.02]">
                <Image
                  src="/Dashboard Screenshot.png"
                  alt="VeriMedrix Dashboard"
                  width={1200}
                  height={675}
                  className="w-full"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 bg-white/50 backdrop-blur-sm border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {[
              { icon: Lock, label: "256-bit Encryption", color: "blue" },
              { icon: Zap, label: "99.9% Uptime", color: "amber" },
              { icon: Clock, label: "Daily Backups", color: "purple" },
            ].map((item, i) => (
              <div
                key={item.label}
                className="flex items-center gap-3 text-slate-600 group cursor-default"
              >
                <div className={`w-10 h-10 rounded-lg bg-${item.color}-100 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                  <item.icon className={`h-5 w-5 text-${item.color}-600`} />
                </div>
                <span className="font-medium group-hover:text-slate-900 transition-colors">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FeatureSection>
            <div className="text-center mb-16 lg:mb-20">
              <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 uppercase tracking-wide mb-3">
                Features
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Everything You Need for Compliance
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                From document management to AI-powered assistance, VeriMedrix has all the tools your practice needs.
              </p>
            </div>
          </FeatureSection>

          {/* Feature 1: AI Assistant */}
          <FeatureSection delay={100}>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24 lg:mb-32">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium mb-6">
                  <Bot className="h-4 w-4" />
                  AI Assistant
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                  Your 24/7 Compliance Expert
                </h3>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Get instant answers to compliance questions, generate document templates, and receive guidance on OHSC requirements - all powered by AI.
                </p>
                <ul className="space-y-4">
                  {["Instant OHSC compliance answers", "Document template generation", "Inspection preparation guidance", "Policy drafting assistance"].map((item, i) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 group"
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 group-hover:bg-purple-200 group-hover:scale-110">
                        <Check className="h-3.5 w-3.5 text-purple-600" />
                      </div>
                      <span className="text-slate-700 group-hover:text-slate-900 transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  Professional Plan Only
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                  <div className="relative rounded-xl overflow-hidden shadow-xl border border-slate-200 transition-transform duration-500 group-hover:scale-[1.02]">
                    <Image
                      src="/AI Assistant Recording.gif"
                      alt="AI Compliance Assistant"
                      width={600}
                      height={400}
                      className="w-full"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </div>
          </FeatureSection>

          {/* Feature 2: Document Management */}
          <FeatureSection delay={100}>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24 lg:mb-32">
              <div>
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                  <div className="relative rounded-xl overflow-hidden shadow-xl border border-slate-200 transition-transform duration-500 group-hover:scale-[1.02]">
                    <Image
                      src="/OHSC Documents Screenshot.png"
                      alt="Document Management"
                      width={600}
                      height={400}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-sm font-medium mb-6">
                  <FileText className="h-4 w-4" />
                  Document Management
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                  All 41+ Mandatory Documents in One Place
                </h3>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Organize, track, and manage all your OHSC compliance documents. Get automatic expiry alerts at 90, 60, 30, 14, and 7 days before renewal.
                </p>
                <ul className="space-y-4">
                  {["Pre-loaded OHSC document templates", "Automatic expiry tracking & alerts", "Version history & audit trail", "Secure cloud storage"].map((item) => (
                    <li key={item} className="flex items-start gap-3 group">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 group-hover:bg-blue-200 group-hover:scale-110">
                        <Check className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <span className="text-slate-700 group-hover:text-slate-900 transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FeatureSection>

          {/* Feature 3: Calendar & Scheduling */}
          <FeatureSection delay={100}>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24 lg:mb-32">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-sm font-medium mb-6">
                  <Calendar className="h-4 w-4" />
                  Calendar & Scheduling
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                  See Everything at a Glance
                </h3>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  View all your tasks, document expiries, and important dates in one unified calendar. Never be caught off guard by an upcoming deadline.
                </p>
                <ul className="space-y-4">
                  {["Unified task & document calendar", "Color-coded event categories", "Upcoming deadline sidebar", "Monthly navigation"].map((item) => (
                    <li key={item} className="flex items-start gap-3 group">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 group-hover:bg-amber-200 group-hover:scale-110">
                        <Check className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <span className="text-slate-700 group-hover:text-slate-900 transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                  <div className="relative rounded-xl overflow-hidden shadow-xl border border-slate-200 transition-transform duration-500 group-hover:scale-[1.02]">
                    <Image
                      src="/Calendar Recording.gif"
                      alt="Calendar & Scheduling"
                      width={600}
                      height={400}
                      className="w-full"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </div>
          </FeatureSection>

          {/* Feature 4: Task Management */}
          <FeatureSection delay={100}>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                  <div className="relative rounded-xl overflow-hidden shadow-xl border border-slate-200 transition-transform duration-500 group-hover:scale-[1.02]">
                    <Image
                      src="/Tasks Screenshot.png"
                      alt="Task Management"
                      width={600}
                      height={400}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-sm font-medium mb-6">
                  <CheckSquare className="h-4 w-4" />
                  Task Management
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                  Never Miss a Compliance Task Again
                </h3>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Create, assign, and track daily logs, equipment checks, and audits. Keep your team accountable with task assignments and evidence collection.
                </p>
                <ul className="space-y-4">
                  {["Daily/weekly/monthly task templates", "Assign tasks to team members", "Evidence collection & photo uploads", "Overdue task alerts"].map((item) => (
                    <li key={item} className="flex items-start gap-3 group">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 group-hover:bg-green-200 group-hover:scale-110">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <span className="text-slate-700 group-hover:text-slate-900 transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FeatureSection>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FeatureSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 uppercase tracking-wide mb-3">
                How It Works
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Get Compliant in 3 Simple Steps
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Setting up VeriMedrix takes less than 10 minutes. No complicated setup required.
              </p>
            </div>
          </FeatureSection>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Sign Up & Setup",
                description: "Create your account and set up your practice profile. Our onboarding wizard guides you through every step.",
                color: "blue",
                icon: "/Sign Up & Setup.gif",
              },
              {
                step: "02",
                title: "Upload Documents",
                description: "Upload your existing compliance documents. We'll automatically track expiry dates and set up reminders.",
                color: "indigo",
                icon: "/Upload Documents.gif",
              },
              {
                step: "03",
                title: "Stay Compliant",
                description: "Receive automatic reminders, complete tasks, and maintain inspection-ready status at all times.",
                color: "purple",
                icon: "/Stay Compliant.gif",
              },
            ].map((item, i) => (
              <FeatureSection key={i} delay={i * 150}>
                <div className="relative group cursor-default">
                  <div className={`absolute inset-0 bg-gradient-to-r from-${item.color}-100 to-${item.color}-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-4`} />
                  <div className="relative text-center">
                    <div className="mb-4 flex justify-center">
                      <Image
                        src={item.icon}
                        alt={item.title}
                        width={120}
                        height={120}
                        className="transition-transform duration-300 group-hover:scale-110"
                        unoptimized
                      />
                    </div>
                    <div className={`text-5xl font-bold bg-gradient-to-r from-${item.color}-600 to-${item.color}-400 bg-clip-text text-transparent mb-4 transition-transform duration-300 group-hover:scale-110`}>
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </FeatureSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FeatureSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 uppercase tracking-wide mb-3">
                Pricing
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Choose the plan that fits your practice. No hidden fees, cancel anytime.
              </p>
            </div>
          </FeatureSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Essentials */}
            <FeatureSection delay={100}>
              <Card className="relative border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Essentials</h3>
                  <p className="text-slate-500 mb-6">Perfect for small practices</p>
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-slate-900">R1,999</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {[
                      "Up to 6 users",
                      "OHSC Document Management",
                      "Task Management",
                      "Calendar & Scheduling",
                      "Employee Management",
                      "Leave Management",
                      "Email Support",
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-3 group">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-125" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/sign-up" className="block">
                    <Button variant="outline" className="w-full h-12 text-base border-slate-300 hover:border-blue-300 hover:bg-blue-50 transition-all">
                      Start Free Trial
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </FeatureSection>

            {/* Professional */}
            <FeatureSection delay={200}>
              <Card className="relative border-2 border-blue-500 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full overflow-visible">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-10 blur-2xl" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-full shadow-lg whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
                <CardContent className="p-8 relative pt-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Professional</h3>
                  <p className="text-slate-500 mb-6">For growing practices</p>
                  <div className="mb-8">
                    <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">R3,999</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {[
                      "Unlimited users",
                      "Everything in Essentials",
                      "AI Compliance Assistant",
                      "Locum Management",
                      "Payroll Management",
                      "Training Management",
                      "Priority Support",
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-3 group">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-125" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/sign-up" className="block">
                    <Button className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 group">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </FeatureSection>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-32 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FeatureSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 uppercase tracking-wide mb-3">
                FAQ
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Got questions? We&apos;ve got answers.
              </p>
            </div>
          </FeatureSection>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "What is OHSC compliance and why does my practice need it?",
                a: "OHSC (Office of Health Standards Compliance) is the regulatory body that ensures healthcare facilities meet national standards. All healthcare practices in South Africa must maintain compliance to operate legally and provide safe patient care.",
              },
              {
                q: "How long does it take to set up VeriMedrix?",
                a: "Most practices are up and running within 10-15 minutes. Our onboarding wizard guides you through the setup process, and you can upload your existing documents right away.",
              },
              {
                q: "Can I import my existing documents?",
                a: "Yes! You can upload PDFs, images, and other document formats. We'll automatically extract key information like expiry dates and set up reminders for you.",
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. We use 256-bit SSL encryption, and all data is stored in secure data centers. Your data is backed up every 24 hours.",
              },
              {
                q: "What happens after my free trial ends?",
                a: "After your 14-day trial, you can choose to subscribe to continue using VeriMedrix. If you decide not to continue, you can export all your data before your account is deactivated.",
              },
              {
                q: "Can I change plans later?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
              },
            ].map((faq, i) => (
              <FeatureSection key={i} delay={i * 50}>
                <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-default group">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{faq.q}</h3>
                  <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              </FeatureSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FeatureSection>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-8 py-16 lg:px-16 lg:py-24">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
              <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
              <div className="relative text-center max-w-2xl mx-auto">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                  Ready to Simplify Your Compliance?
                </h2>
                <p className="text-lg text-blue-100 mb-10 leading-relaxed">
                  Join healthcare practices across South Africa who trust VeriMedrix to keep them inspection-ready.
                </p>
                <Link href="/sign-up">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 h-12 px-8 text-base font-semibold shadow-xl transition-all hover:scale-105 group">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <p className="text-sm text-blue-200 mt-6">
                  14-day free trial • No credit card required
                </p>
              </div>
            </div>
          </FeatureSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-violet-950 via-indigo-900 to-purple-900 py-16 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <Image
                src="/VeriMedrix Dark Mode Logo.png"
                alt="VeriMedrix"
                width={140}
                height={32}
                className="h-8 w-auto mb-4"
              />
              <p className="text-violet-200/80 text-sm leading-relaxed">
                The complete compliance management system for South African healthcare practices.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-violet-200/70 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-violet-200/70 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" className="text-violet-200/70 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-violet-200/70 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-violet-200/70 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-violet-200/70 hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-violet-200/70 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-violet-200/70 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-violet-500/30 pt-8">
            <p className="text-center text-sm text-violet-300/60">
              © 2025 VeriMedrix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-blob {
          animation: blob 8s infinite ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.7s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.7s ease-out forwards;
        }
        .animation-delay-100 {
          animation-delay: 0.1s;
          opacity: 0;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
