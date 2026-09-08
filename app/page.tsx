import Link from "next/link";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LandingReveal } from "@/components/landing/landing-reveal";
import { LandingHeroMotion } from "@/components/landing/landing-hero-motion";
import { LandingHeadline } from "@/components/landing/landing-headline";
import { Button } from "@/components/ui/button";
import { FRAMEWORK, FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { cn } from "@/lib/utils";
import { Brain, Sparkles, Users } from "lucide-react";

const features = [
  {
    icon: Brain,
    accent: "from-sky-500/15 to-blue-600/5 text-sky-700 dark:text-sky-300",
    title: `The ${FRAMEWORK} Matching Language`,
    description: `Our unique ${FRAMEWORK} framework provides a holistic understanding of every candidate. This goes beyond the surface level, ensuring a match that lasts.`,
  },
  {
    icon: Sparkles,
    accent: "from-teal-500/15 to-emerald-600/5 text-teal-700 dark:text-teal-300",
    title: "Framework-Driven Matching",
    description: `Our matching process uses the structured data from the ${FRAMEWORK} framework to identify the best candidates for each role, saving you time and resources.`,
  },
  {
    icon: Users,
    accent: "from-blue-500/15 to-indigo-600/5 text-blue-700 dark:text-blue-300",
    title: "For Employers & Candidates",
    description:
      "Whether you are an employer looking for the perfect fit or a candidate seeking a truly fulfilling role, Deep HR Match is your ideal partner.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F8FC] font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50">
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .landing-rise,
          .landing-grid-frame,
          .landing-grid-ring,
          .landing-grid-ring-2,
          .landing-cell,
          .landing-orb,
          .landing-sheen,
          .landing-cta-glow,
          .landing-reveal,
          .landing-particle,
          .landing-scan-beam,
          .landing-link,
          .landing-word,
          .landing-float-mark,
          .landing-cta-aurora {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
            stroke-dashoffset: 0 !important;
          }
        }

        @keyframes landing-rise {
          from { opacity: 0; transform: translateY(32px) scale(0.98); filter: blur(12px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes landing-word {
          from { opacity: 0; transform: translateY(110%); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes landing-grid-frame {
          0% { transform: rotate(-8deg) scale(0.96); box-shadow: 0 0 0 0 rgba(56,189,248,0); }
          40% { transform: rotate(-2deg) scale(1.03); box-shadow: 0 0 48px 0 rgba(56,189,248,0.18); }
          100% { transform: rotate(-5deg) scale(1); box-shadow: 0 0 24px 0 rgba(56,189,248,0.08); }
        }
        @keyframes landing-grid-ring {
          from { transform: rotate(0deg) scale(1); opacity: 0.25; }
          to { transform: rotate(28deg) scale(1.04); opacity: 0.75; }
        }
        @keyframes landing-grid-ring-2 {
          from { transform: rotate(12deg) scale(1.02); opacity: 0.15; }
          to { transform: rotate(-16deg) scale(0.98); opacity: 0.45; }
        }
        @keyframes landing-cell {
          0%, 100% { opacity: 0.28; transform: scale(0.88); filter: brightness(0.9); }
          35% { opacity: 1; transform: scale(1.12); filter: brightness(1.25); }
          65% { opacity: 0.55; transform: scale(1); filter: brightness(1); }
        }
        @keyframes landing-cell-core {
          0%, 100% { box-shadow: 0 0 0 0 rgba(56,189,248,0.0); transform: scale(1); }
          50% { box-shadow: 0 0 22px 4px rgba(56,189,248,0.45); transform: scale(1.18); }
        }
        @keyframes landing-orb {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          33% { transform: translate3d(22px, -28px, 0) scale(1.14); }
          66% { transform: translate3d(-14px, 16px, 0) scale(0.96); }
        }
        @keyframes landing-sheen {
          0% { opacity: 0.28; background-position: 0% 0%; }
          50% { opacity: 0.7; background-position: 48% 22%; }
          100% { opacity: 0.35; background-position: 0% 0%; }
        }
        @keyframes landing-cta-glow {
          0%, 100% { opacity: 0.35; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.8; transform: scale(1.12) rotate(2deg); }
        }
        @keyframes landing-cta-aurora {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes landing-button-shine {
          0% { transform: translateX(-120%) skewX(-18deg); }
          100% { transform: translateX(220%) skewX(-18deg); }
        }
        @keyframes landing-particle {
          0%, 100% { opacity: 0.15; transform: translate3d(0, 0, 0) scale(0.7); }
          45% { opacity: 0.9; transform: translate3d(8px, -28px, 0) scale(1.4); }
          70% { opacity: 0.35; transform: translate3d(-6px, -12px, 0) scale(1); }
        }
        @keyframes landing-scan {
          0% { transform: translateY(-30%); opacity: 0; }
          15% { opacity: 0.9; }
          55% { opacity: 0.55; }
          100% { transform: translateY(220%); opacity: 0; }
        }
        @keyframes landing-link-draw {
          0% { stroke-dashoffset: 180; opacity: 0.1; }
          40% { opacity: 0.85; }
          100% { stroke-dashoffset: 0; opacity: 0.35; }
        }
        @keyframes landing-float-mark {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }

        .landing-rise {
          animation: landing-rise 1000ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .landing-rise-delay-1 { animation-delay: 140ms; }
        .landing-rise-delay-2 { animation-delay: 420ms; }
        .landing-rise-delay-3 { animation-delay: 620ms; }

        .landing-word {
          opacity: 0;
        }
        .landing-headline-ready .landing-word {
          animation: landing-word 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .landing-grid-frame {
          animation: landing-grid-frame 12s ease-in-out infinite;
          transform-origin: center;
        }
        .landing-grid-ring {
          animation: landing-grid-ring 18s linear infinite alternate;
        }
        .landing-grid-ring-2 {
          animation: landing-grid-ring-2 26s linear infinite alternate;
        }
        .landing-cell {
          animation: landing-cell 3.8s ease-in-out infinite;
        }
        .landing-cell-hot {
          animation-duration: 2.6s;
        }
        .landing-cell-core {
          animation: landing-cell-core 2.4s ease-in-out infinite;
        }
        .landing-orb {
          animation: landing-orb 10s ease-in-out infinite;
        }
        .landing-orb-b { animation-duration: 13s; animation-delay: -2.5s; }
        .landing-orb-c { animation-duration: 16s; animation-delay: -5s; }
        .landing-sheen {
          animation: landing-sheen 8s ease-in-out infinite;
          background-size: 140% 140%;
        }
        .landing-cta-glow {
          animation: landing-cta-glow 5s ease-in-out infinite;
        }
        .landing-cta-aurora {
          background-size: 220% 220%;
          animation: landing-cta-aurora 10s ease-in-out infinite;
        }
        .landing-particle {
          animation: landing-particle ease-in-out infinite;
        }
        .landing-scan-beam {
          animation: landing-scan 4.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .landing-link {
          fill: none;
          stroke: rgba(56, 189, 248, 0.7);
          stroke-width: 0.7;
          stroke-linecap: round;
          stroke-dasharray: 180;
          stroke-dashoffset: 180;
          animation: landing-link-draw 3.6s ease-in-out infinite alternate;
        }
        .landing-link-b {
          stroke: rgba(45, 212, 191, 0.65);
          animation-delay: 0.7s;
          animation-duration: 4.2s;
        }
        .landing-link-c {
          stroke: rgba(96, 165, 250, 0.55);
          animation-delay: 1.3s;
          animation-duration: 4.8s;
        }
        .landing-float-mark {
          animation: landing-float-mark 5s ease-in-out infinite;
        }

        .landing-reveal {
          opacity: 0;
          filter: blur(12px);
          transition:
            opacity 950ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 950ms cubic-bezier(0.16, 1, 0.3, 1),
            filter 950ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .landing-reveal-up { transform: translateY(44px) scale(0.97); }
        .landing-reveal-left { transform: translateX(-36px) scale(0.98); }
        .landing-reveal-right { transform: translateX(36px) scale(0.98); }
        .landing-reveal-scale { transform: scale(0.92); }
        .landing-reveal-blur { transform: translateY(18px); filter: blur(16px); }
        .landing-reveal-visible {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
          filter: blur(0);
        }

        .landing-cta-btn {
          position: relative;
          overflow: hidden;
          transition:
            transform 380ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 380ms ease,
            letter-spacing 380ms ease;
        }
        .landing-cta-btn::before {
          content: "";
          position: absolute;
          inset: -40%;
          background: conic-gradient(from 180deg, transparent, rgba(255,255,255,0.35), transparent 40%);
          opacity: 0;
          transition: opacity 350ms ease;
          animation: landing-cta-aurora 4s linear infinite;
        }
        .landing-cta-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 28%, rgba(255,255,255,0.55) 48%, transparent 64%);
          transform: translateX(-120%) skewX(-18deg);
          pointer-events: none;
        }
        .landing-cta-btn:hover {
          transform: translateY(-3px) scale(1.035);
          letter-spacing: 0.01em;
          box-shadow: 0 22px 48px -16px rgba(37, 99, 235, 0.65);
        }
        .landing-cta-btn:hover::before { opacity: 0.55; }
        .landing-cta-btn:hover::after {
          animation: landing-button-shine 850ms ease;
        }

        .landing-feature-panel {
          transition:
            background-color 450ms ease,
            transform 550ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 450ms ease;
        }
        .landing-feature-panel:hover {
          background: linear-gradient(180deg, rgba(37,99,235,0.05), transparent 72%);
          transform: translateY(-8px);
          box-shadow: 0 24px 40px -28px rgba(37, 99, 235, 0.45);
        }
        .dark .landing-feature-panel:hover {
          background: linear-gradient(180deg, rgba(56,189,248,0.1), transparent 72%);
        }
        .landing-feature-icon {
          position: relative;
        }
        .landing-feature-icon::after {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 1.1rem;
          border: 1px solid rgba(56, 189, 248, 0.35);
          opacity: 0;
          transform: scale(0.85);
          transition: opacity 400ms ease, transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .group:hover .landing-feature-icon::after {
          opacity: 1;
          transform: scale(1.08);
        }
      `}</style>

      <PublicNav />

      <section className="relative isolate overflow-hidden border-b border-sky-900/5 dark:border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_10%_0%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(90%_70%_at_90%_20%,rgba(37,99,235,0.16),transparent_50%),linear-gradient(180deg,#EEF5FF_0%,#F5F8FC_55%,#FFFFFF_100%)] dark:bg-[radial-gradient(120%_80%_at_10%_0%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(90%_70%_at_90%_20%,rgba(37,99,235,0.22),transparent_50%),linear-gradient(180deg,#020617_0%,#0B1220_60%,#020617_100%)]" />
        <div
          aria-hidden
          className="landing-sheen absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] [background-size:48px_48px] dark:[background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)]"
        />
        <LandingHeroMotion />

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <div className="max-w-2xl">
            <div className="landing-rise landing-float-mark">
              <BrandLogo className="[&_span]:text-3xl [&_span]:font-extrabold [&_span]:tracking-tight md:[&_span]:text-4xl [&_img]:h-11" />
            </div>
            <LandingHeadline text="Find Your Perfect Fit." />
            <p className="landing-rise landing-rise-delay-2 mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 md:text-xl">
              Our {FRAMEWORK_MATCHING_LANGUAGE} connects exceptional talent with
              forward-thinking companies.
            </p>
            <div className="landing-rise landing-rise-delay-3 mt-10">
              <Button
                size="lg"
                className="landing-cta-btn h-12 rounded-xl bg-[#2563EB] px-7 text-base font-semibold text-white shadow-[0_18px_40px_-18px_rgba(37,99,235,0.85)] hover:bg-[#1D4ED8]"
                asChild
              >
                <Link href="/auth/sign-up">Explore Opportunities</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="relative px-4 py-20 md:py-28">
        <LandingReveal className="mx-auto max-w-3xl text-center" variant="blur">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl md:leading-tight">
            The Future of Recruitment is Here
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
            Our platform is built on a foundation of deep character analysis and
            framework-driven matching to ensure the best fit for everyone.
          </p>
        </LandingReveal>
      </section>

      <section id="features" className="px-4 pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-0 border-y border-slate-200/80 dark:border-white/10 md:grid-cols-3">
            {features.map((feature, index) => (
              <LandingReveal
                key={feature.title}
                delayMs={index * 140}
                variant={index === 0 ? "left" : index === 2 ? "right" : "up"}
              >
                <article
                  className={cn(
                    "landing-feature-panel group relative px-1 py-10 md:px-8 md:py-12",
                    index > 0 &&
                      "border-t border-slate-200/80 dark:border-white/10 md:border-l md:border-t-0"
                  )}
                >
                  <div
                    className={cn(
                      "landing-feature-icon mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110",
                      feature.accent
                    )}
                  >
                    <feature.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-2xl">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:text-[15px]">
                    {feature.description}
                  </p>
                </article>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 py-20 md:py-28">
        <div className="landing-cta-aurora absolute inset-0 bg-[linear-gradient(135deg,#0B3B8C_0%,#1D4ED8_35%,#0E7490_70%,#2563EB_100%)]" />
        <div
          aria-hidden
          className="landing-cta-glow absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.4),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(45,212,191,0.4),transparent_40%)]"
        />
        <LandingReveal className="relative mx-auto max-w-3xl text-center text-white" variant="scale">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl md:leading-tight">
            Ready to find your perfect match?
          </h2>
          <p className="mt-5 text-base text-sky-50/90 md:text-lg">
            Join Deep HR Match today and experience the future of recruitment.
          </p>
          <Button
            size="lg"
            className="landing-cta-btn mt-10 h-12 rounded-xl bg-white px-7 text-base font-semibold text-slate-900 shadow-[0_18px_40px_-18px_rgba(255,255,255,0.75)] hover:bg-sky-50"
            asChild
          >
            <Link href="/auth/sign-up">Get Started Now</Link>
          </Button>
        </LandingReveal>
      </section>

      <PublicFooter />
    </div>
  );
}
