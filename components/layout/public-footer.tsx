import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import {
  PUBLIC_LEGAL_LINKS,
  PUBLIC_QUICK_LINKS,
  PUBLIC_SUPPORT_LINKS,
} from "@/lib/constants/public-nav";
import { LEGAL_SUPPORT_EMAIL } from "@/lib/constants/legal";

export function PublicFooter() {
  return (
    <footer className="relative z-20 border-t border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <BrandLogo />
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              A recruitment platform connecting the right talent with the right
              opportunities through structured matching.
            </p>
            <p className="mt-4 text-sm">
              <a
                href={`mailto:${LEGAL_SUPPORT_EMAIL}`}
                className="font-medium text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
              >
                {LEGAL_SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              {PUBLIC_QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {link.label}
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
              {PUBLIC_SUPPORT_LINKS.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  {link.href.startsWith("mailto:") ? (
                    <a
                      href={link.href}
                      className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
              Legal
            </h3>
            <ul className="relative z-20 space-y-2 text-sm">
              {PUBLIC_LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  {/* Native anchors: full navigation, no soft-nav quirks */}
                  <a
                    href={link.href}
                    className="cursor-pointer text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-400 dark:border-slate-800">
          © {new Date().getFullYear()} Deep HR Match. All rights reserved.{" "}
          <a href="/privacy" className="underline-offset-2 hover:underline">
            Privacy
          </a>
          {" · "}
          <a href="/terms" className="underline-offset-2 hover:underline">
            Terms
          </a>
          {" · "}
          <a href="/cookies" className="underline-offset-2 hover:underline">
            Cookies
          </a>
        </div>
      </div>
    </footer>
  );
}
