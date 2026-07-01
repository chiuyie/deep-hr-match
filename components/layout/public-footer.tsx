import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { Globe, Share2, Users } from "lucide-react";

const quickLinks = [
  "About Us",
  "How It Works",
  "Pricing",
  "Success Stories",
  "Blog",
];

const supportLinks = [
  "Help Center",
  "Contact Support",
  "FAQ",
  "API Documentation",
  "System Status",
];

const legalLinks = [
  "Privacy Policy",
  "Terms of Service",
  "Cookie Policy",
  "Sitemap",
];

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <BrandLogo />
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              AI-powered recruitment platform connecting the right talent with the
              right opportunities.
            </p>
            <div className="mt-4 flex gap-3">
              {[Share2, Globe, Users].map((Icon, i) => (
                <Link
                  key={i}
                  href="#"
                  className="text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link}>
                  <Link
                    href="#"
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
              Support
            </h3>
            <ul className="space-y-2 text-sm">
              {supportLinks.map((link) => (
                <li key={link}>
                  <Link
                    href="#"
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link}>
                  <Link
                    href="#"
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-400 dark:border-slate-800">
          © {new Date().getFullYear()} Deep HR Match. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
