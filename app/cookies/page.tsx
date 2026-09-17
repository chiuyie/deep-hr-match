import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPageShell, LegalSection } from "@/components/legal/legal-page-shell";
import {
  LEGAL_COMPANY_NAME,
  LEGAL_DPO_EMAIL,
  LEGAL_GOVERNING_LAW,
  LEGAL_JURISDICTION,
  LEGAL_SUPPORT_EMAIL,
} from "@/lib/constants/legal";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `How ${LEGAL_COMPANY_NAME} uses cookies under Singapore’s PDPA.`,
};

export default function CookiePolicyPage() {
  return (
    <LegalPageShell
      title="Cookie Policy"
      description={`This Cookie Policy explains how ${LEGAL_COMPANY_NAME} uses cookies and similar technologies on our website and application, in line with Singapore’s Personal Data Protection Act 2012 (“PDPA”) and PDPC guidance on online tracking.`}
    >
      <LegalSection id="what-are-cookies" title="1. What are cookies?">
        <p>
          Cookies are small text files stored on your device when you visit a site. Similar
          technologies include local storage, session storage, and pixels. They help sites remember
          preferences, keep you signed in, and understand usage. Where cookie data can identify an
          individual (alone or with other data), it is treated as personal data under the PDPA.
        </p>
      </LegalSection>

      <LegalSection id="legal-basis" title="2. Consent under Singapore law">
        <p>
          Under the PDPA, we generally need your consent to collect, use, or disclose personal data
          via cookies, unless an exception applies. We distinguish:
        </p>
        <LegalList
          items={[
            "Strictly necessary cookies — required to provide a service you request (for example authentication, security, load balancing, or remembering essential session state). These may be used without separate opt-in consent because they are necessary for the service.",
            "Non-necessary cookies — for analytics, advertising, or optional preferences. We will only set these with your consent where required, and you may withdraw consent.",
          ]}
        />
        <p>
          Continuing to use the signed-in product after notice of this Policy constitutes consent to
          necessary cookies and to any optional cookies you enable. You can control cookies through
          your browser settings (see Section 6).
        </p>
      </LegalSection>

      <LegalSection id="how-we-use" title="3. How we use cookies">
        <p>We use cookies and similar technologies to:</p>
        <LegalList
          items={[
            "Keep you authenticated across pages (session / auth cookies)",
            "Remember UI preferences such as theme where applicable",
            "Protect against abuse and support security controls",
            "Maintain draft job-form answers on your device when that feature is enabled",
            "Measure basic reliability and troubleshoot errors",
          ]}
        />
      </LegalSection>

      <LegalSection id="types" title="4. Types of cookies we use">
        <p>
          <strong className="text-slate-900 dark:text-white">Strictly necessary.</strong>{" "}
          Authentication and session cookies from our application and auth provider (for example
          Supabase Auth). Without these, you cannot sign in or use protected pages securely.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-white">Functional / preference.</strong>{" "}
          Optional settings such as colour theme or local draft storage for multi-step forms. These
          improve usability but are not required for core account creation.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-white">Analytics / performance.</strong> We may
          use limited first-party or vendor analytics to understand page performance and errors. If
          we introduce advertising or third-party marketing cookies, we will update this Policy and
          obtain consent where required under the PDPA.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-white">Payment-related.</strong> Stripe may set
          cookies or similar technologies on checkout pages it hosts, subject to Stripe’s own
          policies.
        </p>
      </LegalSection>

      <LegalSection id="duration" title="5. Duration">
        <LegalList
          items={[
            "Session cookies expire when you close your browser or when the session ends",
            "Persistent cookies remain until they expire or you delete them",
            "Local storage used for drafts persists until cleared by you or the application",
          ]}
        />
      </LegalSection>

      <LegalSection id="control" title="6. How to control cookies">
        <p>
          Most browsers let you block or delete cookies via settings. Blocking strictly necessary
          cookies may prevent sign-in or break core features. You can also clear site data for{" "}
          {LEGAL_COMPANY_NAME} domains to remove local storage drafts.
        </p>
        <p>
          For PDPA-related cookie or tracking requests, contact{" "}
          <a
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href={`mailto:${LEGAL_DPO_EMAIL}`}
          >
            {LEGAL_DPO_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="7. Third parties">
        <p>
          Some cookies are set by service providers acting for us (authentication, hosting,
          payments). Those providers process data under their agreements with us and, where
          applicable, their own privacy notices. We do not allow third parties to use our site for
          independent behavioural advertising without updating this Policy and obtaining required
          consent.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="8. Transfers outside Singapore">
        <p>
          Cookie and technical data may be processed on servers outside {LEGAL_JURISDICTION}. Where
          such data is personal data, we take steps consistent with the PDPA’s transfer limitation
          obligation, as described in our Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="9. Changes">
        <p>
          We may update this Cookie Policy from time to time. The effective date at the top of this
          page will change when we do. Material changes to non-necessary tracking will be
          accompanied by renewed consent where the PDPA requires it.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" title="10. Governing law">
        <p>
          This Cookie Policy is governed by {LEGAL_GOVERNING_LAW} and should be read together with
          our{" "}
          <Link
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href="/privacy"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="contact" title="11. Contact">
        <p>
          {LEGAL_COMPANY_NAME} · Support:{" "}
          <a
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href={`mailto:${LEGAL_SUPPORT_EMAIL}`}
          >
            {LEGAL_SUPPORT_EMAIL}
          </a>{" "}
          · Data protection:{" "}
          <a
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href={`mailto:${LEGAL_DPO_EMAIL}`}
          >
            {LEGAL_DPO_EMAIL}
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
