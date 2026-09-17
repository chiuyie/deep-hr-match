import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPageShell, LegalSection } from "@/components/legal/legal-page-shell";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import {
  LEGAL_COMPANY_NAME,
  LEGAL_DPO_EMAIL,
  LEGAL_GOVERNING_LAW,
  LEGAL_JURISDICTION,
  LEGAL_SUPPORT_EMAIL,
} from "@/lib/constants/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `${LEGAL_COMPANY_NAME} Privacy Policy under Singapore’s Personal Data Protection Act (PDPA).`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      description={`This Privacy Policy explains how ${LEGAL_COMPANY_NAME} (“we”, “us”, or “our”) collects, uses, discloses, and protects personal data in accordance with Singapore’s Personal Data Protection Act 2012 (“PDPA”) and related regulations and advisory guidelines issued by the Personal Data Protection Commission (“PDPC”).`}
    >
      <LegalSection id="who-we-are" title="1. Who we are / data controller">
        <p>
          {LEGAL_COMPANY_NAME} operates a recruitment matching platform for candidates, employers,
          and platform administrators in {LEGAL_JURISDICTION}. For PDPA purposes, we are the
          organisation that determines the purposes and means of processing personal data described
          in this Policy (commonly referred to as a data controller / organisation).
        </p>
        <p>
          Matching uses structured profile data, job criteria, and the {FRAMEWORK_MATCHING_LANGUAGE}
          — not open-ended automated résumé “AI scoring”.
        </p>
        <p>
          General support:{" "}
          <a
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href={`mailto:${LEGAL_SUPPORT_EMAIL}`}
          >
            {LEGAL_SUPPORT_EMAIL}
          </a>
          . Data protection / PDPA requests:{" "}
          <a
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href={`mailto:${LEGAL_DPO_EMAIL}`}
          >
            {LEGAL_DPO_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="scope" title="2. Scope">
        <p>This Policy applies to personal data we collect when you:</p>
        <LegalList
          items={[
            "Create or use a candidate, employer, or admin account",
            "Visit our public website or authentication pages",
            "Complete profiles, upload CVs, answer questionnaires, post jobs, run matching, unlock profiles, or make payments",
            "Contact us for support",
            "Interact with cookies and similar technologies (see our Cookie Policy)",
          ]}
        />
        <p>
          “Personal data” has the meaning under the PDPA — data about an individual who can be
          identified from that data, or from that data and other information we have or are likely
          to have access to.
        </p>
      </LegalSection>

      <LegalSection id="pdpa-principles" title="3. How we comply with the PDPA">
        <p>We design our practices around the PDPA’s key obligations, including:</p>
        <LegalList
          items={[
            "Consent — we collect, use, or disclose personal data with your consent, or where an exception under the PDPA applies (for example certain legitimate interests, investigations, or legal requirements)",
            "Purpose limitation — we use personal data only for purposes you have been informed of (or that are otherwise permitted)",
            "Notification — we notify you of the purposes of collection, use, and disclosure (including through this Policy and in-product notices)",
            "Access & correction — you may request access to or correction of your personal data",
            "Accuracy — we take reasonable steps so that personal data we use is accurate and complete",
            "Protection — we implement reasonable security arrangements",
            "Retention — we do not retain personal data longer than needed for business or legal purposes",
            "Transfer limitation — if personal data is transferred outside Singapore, we take steps to ensure a comparable standard of protection",
            "Accountability — we maintain policies and can demonstrate our PDPA compliance approach",
          ]}
        />
      </LegalSection>

      <LegalSection id="data-we-collect" title="4. Personal data we collect">
        <p>
          <strong className="text-slate-900 dark:text-white">Account & identity.</strong> Name,
          email address, password (hashed by our authentication provider), account role (candidate /
          employer / admin), and phone number if provided.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-white">Candidate profile.</strong> Contact
          and location details, job title, experience, education, skills, certifications, languages,
          salary expectations, work preferences, optional matching attributes (for example age
          range, work pass / eligibility, nationality, and other attributes you choose to provide),
          role-requirement Yes/No answers, CV / résumé files, and {FRAMEWORK_MATCHING_LANGUAGE}{" "}
          answers.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-white">Employer profile & jobs.</strong>{" "}
          Organisation details, contact persons, job descriptions, filters, preferred selection
          criteria, uploaded job description files, and employer {FRAMEWORK_MATCHING_LANGUAGE}{" "}
          answers.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-white">Matching & unlocks.</strong> Match
          scores and snapshots, unlock records, and — after a paid unlock — employer access to
          fuller candidate profile and CV content for that job.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-white">Payments.</strong> Payment status,
          amounts, currency, and Stripe session identifiers. Card data is processed by Stripe; we
          do not store full payment card numbers.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-white">Technical data.</strong> Logs,
          device/browser information, IP-derived metadata, cookies/session tokens, and security
          events needed to operate and protect the service.
        </p>
        <p>
          Some matching fields may be considered more sensitive in an employment context (for
          example ethnicity, religion, gender, or health-adjacent attributes such as height/weight
          where collected). Provide these only if you choose to, and employers should use such
          filters only where they have a lawful basis under Singapore employment and anti-discrimination
          laws.
        </p>
      </LegalSection>

      <LegalSection id="purposes" title="5. Purposes of collection, use, and disclosure">
        <p>We collect, use, and disclose personal data for these purposes:</p>
        <LegalList
          items={[
            "Creating and securing accounts; authenticating sessions",
            "Providing profile, CV, job, matrix, matching, unlock, and payment features",
            "Applying hard filters and structured matching between jobs and candidates",
            "Processing unlock payments and maintaining payment/unlock records",
            "Communicating service notices (onboarding, security, transactional messages)",
            "Preventing fraud/abuse, debugging incidents, and improving reliability and security",
            "Complying with Singapore law, PDPC or other regulator requests, and enforcing our Terms",
            "Establishing, exercising, or defending legal claims",
          ]}
        />
        <p>
          If we need to use personal data for a new purpose not covered here or reasonably related
          to the original purpose, we will notify you and obtain consent where required by the PDPA.
        </p>
      </LegalSection>

      <LegalSection id="consent" title="6. Consent and withdrawal">
        <p>
          By creating an account, submitting profile or job information, uploading a CV, completing
          questionnaires, marking yourself ready for matching, or proceeding with an unlock payment,
          you consent to the collection, use, and disclosure of personal data for the purposes in
          this Policy, subject to the PDPA.
        </p>
        <p>
          You may withdraw consent by contacting{" "}
          <a
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href={`mailto:${LEGAL_DPO_EMAIL}`}
          >
            {LEGAL_DPO_EMAIL}
          </a>{" "}
          or using in-product controls (for example turning off matching readiness). Withdrawal
          does not affect processing already lawfully completed. If consent is required for core
          features, withdrawal may mean we cannot continue providing those features (for example
          matching or unlocks).
        </p>
        <p>
          Where the PDPA provides an exception to consent (for example certain legitimate interests
          assessments, investigations, or legal obligations), we may rely on that exception and
          will do so only as permitted.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="7. Disclosure of personal data">
        <p>We may disclose personal data to:</p>
        <LegalList
          items={[
            <>
              <strong className="text-slate-900 dark:text-white">Employers</strong> — limited or
              anonymised match previews until unlock; after unlock, fuller profile/CV for that job
              as described in-product
            </>,
            <>
              <strong className="text-slate-900 dark:text-white">Service providers</strong> —
              hosting/database (for example Supabase), payment processing (Stripe), email and
              infrastructure vendors acting on our instructions
            </>,
            <>
              <strong className="text-slate-900 dark:text-white">Platform administrators</strong> —
              authorised operators who configure forms/matrix and monitor operations
            </>,
            <>
              <strong className="text-slate-900 dark:text-white">Authorities / advisers</strong> —
              where required or allowed by Singapore law, or to professional advisers under
              confidentiality
            </>,
          ]}
        />
        <p>We do not sell personal data.</p>
      </LegalSection>

      <LegalSection id="transfers" title="8. Transfers outside Singapore">
        <p>
          Our service providers may process personal data in countries outside Singapore. Where we
          transfer personal data outside Singapore, we take appropriate steps to ensure that the
          recipient provides a standard of protection comparable to the PDPA (for example
          contractual clauses, vendor due diligence, and provider safeguards), as required under
          the PDPA’s transfer limitation obligation.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="9. Retention">
        <p>
          We retain personal data only as long as needed for the purposes stated above, or as
          required/allowed by Singapore law (for example accounting, dispute resolution, or fraud
          prevention). When personal data is no longer needed, we will cease to retain it, or
          remove the means by which it can be associated with particular individuals, as far as
          reasonably practicable.
        </p>
      </LegalSection>

      <LegalSection id="security" title="10. Protection of personal data">
        <p>
          We implement reasonable security arrangements to protect personal data against
          unauthorised access, collection, use, disclosure, copying, modification, disposal, or
          similar risks. Measures include encrypted transport (HTTPS), hashed credentials via our
          auth provider, role-based access controls, and operational monitoring. No method of
          transmission or storage is completely secure; please use a strong unique password and
          protect your login.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="11. Access, correction, and other requests">
        <p>Under the PDPA, you may request to:</p>
        <LegalList
          items={[
            "Access personal data we hold about you, and information about how it has been used or disclosed (subject to PDPA exceptions)",
            "Correct an error or omission in your personal data",
          ]}
        />
        <p>
          You can also update much of your profile information directly in your account. Send PDPA
          access/correction or other data protection requests to{" "}
          <a
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href={`mailto:${LEGAL_DPO_EMAIL}`}
          >
            {LEGAL_DPO_EMAIL}
          </a>
          . We may need to verify your identity and may respond within the timelines expected under
          PDPC guidance (generally as soon as reasonably possible).
        </p>
        <p>
          If you are not satisfied with our response, you may contact the PDPC (
          <a
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href="https://www.pdpc.gov.sg"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.pdpc.gov.sg
          </a>
          ).
        </p>
      </LegalSection>

      <LegalSection id="accuracy" title="12. Accuracy">
        <p>
          Please ensure personal data you provide is accurate and complete. This is especially
          important for employment matching, work eligibility, and contact details. We rely on you
          to keep your profile and CV up to date.
        </p>
      </LegalSection>

      <LegalSection id="children" title="13. Minors">
        <p>
          The platform is intended for individuals who can lawfully enter employment relationships
          and contracts under Singapore law. We do not knowingly collect personal data from children
          for platform accounts. Contact us if you believe a minor has provided personal data.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="14. Cookies">
        <p>
          We use cookies and similar technologies as described in our{" "}
          <Link
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href="/cookies"
          >
            Cookie Policy
          </Link>
          . Where cookies are not strictly necessary, we will obtain consent where required.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="15. Changes to this Policy">
        <p>
          We may update this Policy from time to time. Material changes will be indicated by
          updating the effective date on this page and, where appropriate, additional notice in the
          product or by email.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" title="16. Governing law">
        <p>
          This Privacy Policy is governed by {LEGAL_GOVERNING_LAW}. Nothing in this Policy limits
          any non-waivable rights you may have under the PDPA.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="17. Contact">
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
        <p>
          Related documents:{" "}
          <Link
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href="/terms"
          >
            Terms of Service
          </Link>{" "}
          ·{" "}
          <Link
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href="/cookies"
          >
            Cookie Policy
          </Link>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
