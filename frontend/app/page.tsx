"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Users,
  CheckCircle2,
  Star,
  Play,
  ChevronRight,
  Sparkles,
  Target,
  Clock,
  FileCheck,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroGeometric } from "@/components/ui/hero-geometric";
import { cn } from "@/lib/utils";

// Navigation component
function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight">ContentAI</Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Testimonials
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/app" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Log in
          </Link>
          <Button asChild>
            <Link href="https://github.com/divyanshu12-fullstack/enterprise-content-ai" target="_blank" rel="noopener noreferrer">
              View on GitHub
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <button
          className="md:hidden transition-transform duration-200 active:scale-90"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="#features" className="text-sm text-muted-foreground">Features</Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground">How It Works</Link>
            <Link href="#testimonials" className="text-sm text-muted-foreground">Testimonials</Link>
            <Link href="#pricing" className="text-sm text-muted-foreground">Pricing</Link>
            <hr className="border-border" />
            <Link href="/app" className="text-sm text-muted-foreground">Log in</Link>
            <Button asChild className="w-full">
              <Link href="/app">Get Started Free</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

// Hero Section
function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Geometric shader background */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <HeroGeometric
          className="min-h-full! h-full w-full bg-transparent!"
          color1="#081a2d"
          color2="#27d3ff"
          speed={0.9}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">AI-Powered Multi-Agent System</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1 variants={itemVariants} className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            <span className="text-primary">Automate Your Marketing</span>
            <br />
            <span className="text-foreground">With AI That Understands</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p variants={itemVariants} className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Generate compliant, on-brand content for LinkedIn and Twitter in seconds.
            Our multi-agent AI system researches, writes, reviews, and creates visuals automatically.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="h-12 px-8 text-base">
              <Link href="/app">
                Start Creating Content
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
              <Link href="https://drive.google.com/file/d/1_mAg23JtNLbKyg-0YwVc9lu4P42TdO3K/view?usp=sharing" target="_blank" rel="noopener noreferrer">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div variants={itemVariants} className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>GDPR compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>SOC 2 certified</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-8 border-t border-border pt-10 md:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {[
            { value: "10K+", label: "Posts Generated", company: "Enterprise clients" },
            { value: "94%", label: "Compliance Rate", company: "Brand safety" },
            { value: "6x", label: "Faster Creation", company: "vs. manual process" },
            { value: "300%", label: "Engagement Boost", company: "Avg. improvement" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-foreground md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground/60">{stat.company}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Target,
      title: "Smart Research Agent",
      description: "Our AI researcher scrapes the web for latest trends, data, and news relevant to your topic, providing source URLs for credibility.",
      highlight: "Real-time data"
    },
    {
      icon: FileCheck,
      title: "Compliant Content Writer",
      description: "Generate professional LinkedIn posts and punchy tweets that meet brand guidelines with clear CTAs and no hype language.",
      highlight: "Brand-safe"
    },
    {
      icon: Shield,
      title: "Brand Governance",
      description: "Ruthless compliance review catches prohibited words and ensures every piece of content meets your company policies.",
      highlight: "Auto-review"
    },
    {
      icon: Sparkles,
      title: "Visual Art Director",
      description: "Automatically converts approved copy into detailed image prompts with composition guidance for stunning visuals.",
      highlight: "AI imagery"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate complete multi-platform content packages in under 15 seconds, saving hours of manual work.",
      highlight: "15s average"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track pass rates, rejection reasons, and time savings with comprehensive analytics and reporting.",
      highlight: "Full visibility"
    }
  ];

  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-sm">
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Powerful Features</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            For teams managing complex content at scale
          </h2>
          <p className="text-lg text-muted-foreground">
            Our multi-agent system combines advanced AI with enterprise-grade compliance to deliver content that converts.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex flex-col h-full rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-card/80"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {feature.highlight}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground flex-1">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Define Your Campaign",
      description: "Enter your topic, target audience, and upload your company's brand guidelines and compliance policies.",
      visual: "input"
    },
    {
      step: "02",
      title: "AI Agents Get to Work",
      description: "Our 4-agent system researches trends, writes content, reviews compliance, and generates visual prompts.",
      visual: "process"
    },
    {
      step: "03",
      title: "Review & Approve",
      description: "See side-by-side previews of LinkedIn and Twitter content with compliance status and AI-generated imagery.",
      visual: "review"
    },
    {
      step: "04",
      title: "Publish & Track",
      description: "Deploy content to your channels with one click and track engagement through our analytics dashboard.",
      visual: "publish"
    }
  ];

  return (
    <section id="how-it-works" className="bg-secondary/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm">
            <Play className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">How It Works</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            From idea to published content in minutes
          </h2>
          <p className="text-lg text-muted-foreground">
            Our streamlined workflow makes content creation effortless while maintaining brand consistency.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              {i < steps.length - 1 && (
                <div className="absolute top-8 left-full hidden h-px w-full bg-linear-to-r from-border to-transparent lg:block" />
              )}
              <div className="relative flex flex-col h-full rounded-xl border border-border bg-card p-6">
                <div className="mb-4 text-4xl font-bold text-primary/20">{step.step}</div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    {
      quote: "We can have a marketing campaign ready and live within hours instead of days. That speed is critical for staying competitive in our market.",
      author: "Sarah Chen",
      role: "VP of Marketing",
      company: "TechScale Inc",
      avatar: "SC"
    },
    {
      quote: "The compliance automation alone saved us from potential brand violations. It catches things our team would have missed.",
      author: "Michael Rodriguez",
      role: "Chief Brand Officer",
      company: "DataFlow Systems",
      avatar: "MR"
    },
    {
      quote: "ContentAI transformed our content operations. We went from 2 posts per week to 10+ while maintaining quality and brand consistency.",
      author: "Emily Watson",
      role: "Content Director",
      company: "CloudVentures",
      avatar: "EW"
    }
  ];

  return (
    <section id="testimonials" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-sm">
            <Star className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Customer Stories</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Loved by marketing teams everywhere
          </h2>
          <p className="text-lg text-muted-foreground">
            See how leading companies are transforming their content operations with ContentAI.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="flex flex-col h-full rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <blockquote className="mb-6 flex-1 text-pretty leading-relaxed text-foreground">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3 mt-auto">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-medium">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}, {testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Case study highlight */}
        <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-8 md:p-12">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="flex-1">
              <div className="mb-2 text-sm font-medium text-primary">CASE STUDY</div>
              <h3 className="mb-4 text-2xl font-bold">How GlobalCorp grew revenue by 35% and completely eliminated off-brand messaging</h3>
              <p className="mb-6 text-muted-foreground">
                Learn how using an AI multi-agent workflow secured the brand against costly compliance violations, avoiding potential PR disasters, while driving faster content velocity that directly improved the bottom line.
              </p>
              <Button variant="outline" asChild>
                <Link href="https://www.sec.gov/Archives/edgar/vprr/1300/13003428.pdf" target="_blank" rel="noopener noreferrer">
                  Read the case study
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="flex shrink-0 flex-col gap-4 sm:flex-row md:flex-col lg:flex-row">
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-border bg-card p-6 min-w-36">
                <div className="text-4xl font-bold text-primary">100%</div>
                <div className="mt-2 text-sm text-center text-muted-foreground">Compliance Incidents<br />Prevented</div>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-border bg-card p-6 min-w-36">
                <div className="text-4xl font-bold text-success">35%</div>
                <div className="mt-2 text-sm text-center text-muted-foreground">Increase in<br />Campaign Revenue</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Pricing Section
function PricingSection() {
  const plans = [
    {
      name: "Open Source",
      price: "₹0",
      description: "Completely free and open-source forever. Perfect for developers and self-hosting.",
      features: [
        "Unlimited content generations",
        "LinkedIn & Twitter support",
        "Basic compliance checks",
        "Community support"
      ],
      cta: "View on GitHub",
      url: "https://github.com/divyanshu12-fullstack/enterprise-content-ai",
      popular: true
    },
    {
      name: "Pro (Coming Soon)",
      price: "₹999",
      description: "Hosted solution for growing teams that need more power and customization.",
      features: [
        "Everything in Open Source",
        "Custom compliance rules",
        "Brand voice training",
        "API access",
        "Priority support",
        "Analytics dashboard"
      ],
      cta: "Check Announcements",
      url: "https://www.linkedin.com/in/divyanshu-dwivedi-4963282b9/", // Update this with your actual LinkedIn profile
      popular: false
    },
    {
      name: "Enterprise (Coming Soon)",
      price: "₹2999",
      description: "For large organizations with advanced needs and custom deployments.",
      features: [
        "Everything in Pro",
        "Custom AI model training",
        "SSO & SAML",
        "Dedicated success manager",
        "SLA guarantee",
        "On-premise deployment"
      ],
      cta: "Contact Sales",
      url: "mailto:divyanshudwivedi1290@gmail.com", // Update this with your actual LinkedIn profile
      popular: false
    }
  ];

  return (
    <section id="pricing" className="bg-secondary/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm">
            <Users className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Pricing</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Free and Open Source First
          </h2>
          <p className="text-lg text-muted-foreground">
            The project is currently completely free and open-source. Future expansion plans include managed hosting and premium features.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-8",
                plan.popular ? "border-primary shadow-lg shadow-primary/10" : "border-border"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground text-nowrap">
                  Completely Free
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && plan.price !== "₹0" && <span className="text-muted-foreground">/month</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-auto"
                variant={plan.popular ? "default" : "outline"}
                asChild
              >
                <Link href={plan.url} target="_blank" rel="noopener noreferrer">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact Section
function ContactSection() {
  return (
    <section id="contact" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-2xl border border-border bg-linear-to-br from-primary/10 via-card to-card p-8 md:p-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Ready to transform your content marketing?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of marketers who are already creating better content faster.
              Start Automating Your Marketing with ContentAI today.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="h-12 px-8">
                <Link href="/app">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8">
                <Link href="mailto:divyanshudwivedi1290@gmail.com">
                  Talk to Sales
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required. Completely free and open-source.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30 py-6">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            2026 ContentAI. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="https://x.com/DivyanshuD1290" className="text-muted-foreground hover:text-foreground">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </Link>
            <Link href="https://www.linkedin.com/in/divyanshu-dwivedi-4963282b9/" className="text-muted-foreground hover:text-foreground">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </Link>
            <Link href="https://github.com/divyanshu12-fullstack" className="text-muted-foreground hover:text-foreground">
              <span className="sr-only">GitHub</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
