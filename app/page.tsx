import Link from "next/link";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FRAMEWORK, FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { BrainCircuit, Sparkles, Users } from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    iconBg: "bg-blue-600/10",
    iconColor: "text-blue-500",
    title: `The ${FRAMEWORK} Matching Language`,
    description: `Our unique ${FRAMEWORK} framework provides a holistic understanding of every candidate. This goes beyond the surface level, ensuring a match that lasts.`,
  },
  {
    icon: Sparkles,
    iconBg: "bg-green-600/10",
    iconColor: "text-green-500",
    title: "AI-Powered Matching",
    description: `Our advanced AI algorithm processes the complex data from the ${FRAMEWORK} framework to identify the best candidates for each role, saving you time and resources.`,
  },
  {
    icon: Users,
    iconBg: "bg-purple-600/10",
    iconColor: "text-purple-500",
    title: "For Employers & Candidates",
    description:
      "Whether you are an employer looking for the perfect fit or a candidate seeking a truly fulfilling role, Deep HR Match is your ideal partner.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 dark:bg-slate-950 dark:text-white">
      <PublicNav />

      {/* Hero */}
      <section className="bg-slate-50 px-4 py-24 dark:bg-[#0F172A] md:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Find Your Perfect Fit.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400 md:text-xl">
            Harnessing the power of AI and our {FRAMEWORK_MATCHING_LANGUAGE} to
            connect exceptional talent with forward-thinking companies.
          </p>
          <Button
            size="lg"
            className="mt-10 rounded-full bg-blue-600 px-8 py-6 text-base font-semibold hover:bg-blue-700"
            asChild
          >
            <Link href="/auth/sign-up">Explore Opportunities</Link>
          </Button>
        </div>
      </section>

      {/* Features intro */}
      <section id="about" className="px-4 py-20 md:py-28">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            The Future of Recruitment is Here
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-slate-600 dark:text-slate-400">
            Our platform is built on a foundation of deep character analysis and
            intelligent matching to ensure the best fit for everyone.
          </p>
        </div>
      </section>

      {/* Feature cards */}
      <section id="features" className="px-4 pb-24">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-slate-200 bg-white transition-all duration-300 hover:-translate-y-2 dark:border-slate-800 dark:bg-slate-900"
            >
              <CardContent className="p-8">
                <div
                  className={`mb-4 inline-flex rounded-lg p-3 ${feature.iconBg}`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-100 px-4 py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to find your perfect match?
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Join Deep HR Match today and experience the future of recruitment.
          </p>
          <Button
            size="lg"
            className="mt-8 rounded-full bg-blue-600 px-8 hover:bg-blue-700"
            asChild
          >
            <Link href="/auth/sign-up">Get Started Now</Link>
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
