import { LEGAL_PAGES, LEGAL_SUPPORT_EMAIL } from "@/lib/constants/legal";

/** Public marketing / chrome navigation — every href must resolve. */
export const PUBLIC_NAV_LINKS = [
  { label: "About", href: "/#about" },
  { label: "How it works", href: "/#features" },
  { label: "Get started", href: "/#cta" },
] as const;

export const PUBLIC_QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "How it works", href: "/#features" },
  { label: "Get started", href: "/auth/sign-up" },
] as const;

export const PUBLIC_SUPPORT_LINKS = [
  { label: "Candidate sign in", href: "/auth/sign-in?role=candidate" },
  { label: "Employer sign in", href: "/auth/sign-in?role=employer" },
  { label: "Create account", href: "/auth/sign-up" },
  { label: "Contact support", href: `mailto:${LEGAL_SUPPORT_EMAIL}` },
] as const;

export { LEGAL_PAGES as PUBLIC_LEGAL_LINKS };
