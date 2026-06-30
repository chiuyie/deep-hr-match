import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/layout/public-nav";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Grid3X3,
  Shield,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";

const faqs = [
  {
    q: "Do candidates apply for jobs on this platform?",
    a: "No. Candidates build their profile and wait for employers to contact them after a successful match unlock.",
  },
  {
    q: "Is job posting free?",
    a: "Yes. Employers can create unlimited jobs and generate matching results for free.",
  },
  {
    q: "When do employers pay?",
    a: "Payment is only required when unlocking selected candidate profiles to view contact details and CV.",
  },
  {
    q: "Is the matching algorithm final?",
    a: "Phase 1 uses placeholder demo scores. The proprietary 7×7 Matching Language framework structure is in place for the final algorithm.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <section className="border-b bg-gradient-to-b from-slate-50 to-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <Badge className="mb-4 bg-[#1e40af]/10 text-[#1e40af] hover:bg-[#1e40af]/10">
            AI-Ready Candidate-Job Matching
          </Badge>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Precision Hiring Through the{" "}
            <span className="text-[#1e40af]">7×7 Matching Language</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Deep HR Match connects employers with pre-qualified candidates through a
            proprietary matching framework — without the noise of traditional job boards.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-[#1e40af] hover:bg-[#1e3a8a]" asChild>
              <Link href="/auth/sign-up?role=candidate">
                Join as Candidate <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/sign-up?role=employer">
                Join as Employer <Building2 className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold">How It Works</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
            A reverse marketplace where quality matches replace application overload.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: UserCheck, title: "Candidates Build Profiles", desc: "Complete profile, upload CV, and fill the 7×7 form." },
              { icon: Grid3X3, title: "Employers Define Jobs", desc: "Post jobs free, upload JD, and complete job-specific 7×7 answers." },
              { icon: Sparkles, title: "Match & Unlock", desc: "View ranked anonymous results free. Pay only to unlock selected candidates." },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <item.icon className="h-8 w-8 text-[#1e40af]" />
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="candidates" className="border-y bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold">Candidate Journey</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              "Sign up & create profile",
              "Upload CV",
              "Complete 7×7 Matching Language form",
              "Wait for employer contact outside platform",
            ].map((step, i) => (
              <li key={step} className="flex gap-3 rounded-lg border bg-background p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e40af] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="employers" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold">Employer Journey</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              "Create company profile & unlimited free jobs",
              "Upload JD & complete job 7×7 form",
              "Generate free matching results",
              "Review anonymous ranked candidates",
              "Pay to unlock selected profiles",
              "Contact candidates directly",
            ].map((step, i) => (
              <li key={step} className="flex gap-3 rounded-lg border p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1e40af]" />
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y bg-slate-900 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold">7×7 Matching Language Framework</h2>
          <p className="mt-4 max-w-3xl text-slate-300">
            Our proprietary framework captures multi-dimensional fit across categories
            defined by your organization. Phase 1 implements the dynamic form system and
            matching engine structure — final scoring weights will be configured when the
            algorithm is confirmed.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Work Style", "Values Alignment", "Skills Depth", "Growth Mindset"].map(
              (cat) => (
                <div key={cat} className="rounded-lg border border-slate-700 p-4">
                  <Grid3X3 className="mb-2 h-5 w-5 text-blue-400" />
                  <p className="font-medium">{cat}</p>
                  <p className="mt-1 text-xs text-slate-400">Category placeholder</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold">Benefits & Features</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Shield, title: "Privacy First", desc: "Candidate PII hidden until paid unlock." },
              { icon: Users, title: "Quality Over Volume", desc: "No application spam — curated matches only." },
              { icon: Building2, title: "Free Job Posting", desc: "Unlimited jobs and matching generation at no cost." },
            ].map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <f.icon className="h-6 w-6 text-[#1e40af]" />
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold">FAQ</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.q}>
                <CardHeader>
                  <CardTitle className="text-base">{faq.q}</CardTitle>
                  <CardDescription>{faq.a}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl bg-[#1e40af] px-8 py-12 text-center text-white">
          <h2 className="text-3xl font-bold">Ready to Transform Your Hiring?</h2>
          <p className="mt-2 text-blue-100">Start building your profile or posting jobs today.</p>
          <Button size="lg" variant="secondary" className="mt-6" asChild>
            <Link href="/auth/sign-up">Get Started Free</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Deep HR Match. All rights reserved.
      </footer>
    </div>
  );
}
