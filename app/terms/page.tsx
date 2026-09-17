import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPageShell, LegalSection } from "@/components/legal/legal-page-shell";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import {
  LEGAL_COMPANY_NAME,
  LEGAL_DISPUTE_FORUM,
  LEGAL_GOVERNING_LAW,
  LEGAL_JURISDICTION,
  LEGAL_SUPPORT_EMAIL,
} from "@/lib/constants/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${LEGAL_COMPANY_NAME}, governed by the laws of Singapore.`,
};

export default function TermsOfServicePage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      description={`These Terms of Service (“Terms”) govern access to and use of ${LEGAL_COMPANY_NAME} in ${LEGAL_JURISDICTION}. By creating an account or using the platform, you agree to these Terms.`}
    >
      <LegalSection id="agreement" title="1. Agreement and electronic acceptance">
        <p>
          These Terms form a legally binding agreement between you and {LEGAL_COMPANY_NAME}. If you
          use the platform on behalf of a company or other organisation, you represent that you have
          authority to bind that organisation, and “you” includes that organisation.
        </p>
        <p>
          By clicking to accept, creating an account, or using the service, you agree to these Terms
          electronically under the Electronic Transactions Act 2010 of Singapore.
        </p>
        <p>
          Related policies (incorporated by reference):{" "}
          <Link
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href="/privacy"
          >
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href="/cookies"
          >
            Cookie Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="service" title="2. The service">
        <p>
          {LEGAL_COMPANY_NAME} is a recruitment matching platform. We help employers define job
          criteria and candidates complete structured profiles, including the{" "}
          {FRAMEWORK_MATCHING_LANGUAGE}. Matching is based on configured filters and structured
          inputs — not a guarantee of hire, interview, or suitability.
        </p>
        <p>
          We are a technology platform, not an employment agency under the Employment Agencies Act
          unless we separately hold and notify you of any required licence. We do not employ
          candidates on your behalf and do not make hiring decisions for employers.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="3. Eligibility and accounts">
        <LegalList
          items={[
            "You must be able to enter a binding contract under Singapore law",
            "You must provide accurate registration information and keep it updated",
            "You are responsible for safeguarding login credentials and activity under your account",
            "One person or organisation should not maintain misleading duplicate accounts to evade limits or fees",
            "We may suspend or terminate accounts that breach these Terms or create security/legal risk",
          ]}
        />
      </LegalSection>

      <LegalSection id="roles" title="4. Candidate and employer responsibilities">
        <p>
          <strong className="text-slate-900 dark:text-white">Candidates</strong> must provide
          truthful profile and CV information, only upload documents they have the right to share,
          and use matching readiness / consent controls honestly. Misrepresentation may lead to
          removal from matching.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-white">Employers</strong> must post genuine
          roles, comply with Singapore employment laws (including the Employment Act where
          applicable, work pass rules, and fair employment practices expected by the Tripartite
          Alliance for Fair & Progressive Employment Practices / TAFEP), and use candidate data only
          for recruiting for the relevant job. Do not use unlocks or downloaded CVs for unrelated
          marketing, resale, or discriminatory screening prohibited by law.
        </p>
        <p>
          Employers remain solely responsible for shortlisting, interviews, offers, and employment
          contracts. Match scores are decision-support tools only.
        </p>
      </LegalSection>

      <LegalSection id="payments" title="5. Payments and unlocks">
        <p>
          Certain features (including unlocking fuller candidate profiles) require payment via our
          payment provider (Stripe). Prices, currency, and taxes (including GST where applicable)
          are shown at checkout. Payments are generally non-refundable once an unlock is completed,
          except where required by Singapore law or where we determine a technical failure prevented
          delivery of the paid feature.
        </p>
        <p>
          You authorise us and Stripe to charge the payment method you provide. Chargebacks made in
          bad faith after a successful unlock may result in account suspension.
        </p>
      </LegalSection>

      <LegalSection id="ip" title="6. Intellectual property and licence">
        <p>
          The platform, branding, software, and documentation are owned by {LEGAL_COMPANY_NAME} or
          its licensors. We grant you a limited, non-exclusive, non-transferable licence to use the
          service for its intended recruiting/matching purposes during your subscription or account
          term.
        </p>
        <p>
          You retain ownership of content you upload (profiles, CVs, job descriptions). You grant us
          a worldwide, non-exclusive licence to host, process, display, and transmit that content as
          needed to operate matching, unlocks, and administration, consistent with the Privacy
          Policy and PDPA.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="7. Acceptable use">
        <p>You must not:</p>
        <LegalList
          items={[
            "Scrape, harvest, or bulk-export personal data beyond what the product UI permits for your role",
            "Circumvent unlocks, paywalls, or access controls",
            "Upload malware, infringing material, or unlawful content",
            "Harass users, discriminate unlawfully, or misuse candidate contact details",
            "Reverse engineer the service except to the extent permitted by Singapore law",
            "Use the platform for any purpose that violates Singapore law or the rights of others",
          ]}
        />
      </LegalSection>

      <LegalSection id="privacy" title="8. Personal data">
        <p>
          Processing of personal data is described in our{" "}
          <Link
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href="/privacy"
          >
            Privacy Policy
          </Link>
          . Each party must comply with the PDPA in relation to personal data it controls or
          processes through the platform. Employers must have a valid basis to receive and use
          unlocked candidate data for recruitment.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="9. Disclaimers">
        <p>
          The service is provided on an “as is” and “as available” basis. To the fullest extent
          permitted under Singapore law (including the Unfair Contract Terms Act 1977 where it
          applies), we disclaim warranties of merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that matching will produce any particular hire outcome,
          score accuracy for every role, or uninterrupted availability.
        </p>
        <p>
          Nothing in these Terms excludes or limits liability for death or personal injury caused by
          negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be
          excluded under Singapore law.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="10. Limitation of liability">
        <p>
          Subject to Section 9, our total aggregate liability arising out of or relating to these
          Terms or the service in any twelve-month period is limited to the greater of (a) the fees
          you paid us for the service in that period, or (b) SGD 100.
        </p>
        <p>
          We are not liable for indirect, incidental, special, consequential, or punitive damages,
          or loss of profits, data, goodwill, or business opportunity, whether based on contract,
          tort (including negligence), or otherwise — except to the extent such exclusion is not
          permitted by Singapore law.
        </p>
      </LegalSection>

      <LegalSection id="indemnity" title="11. Indemnity">
        <p>
          You agree to indemnify and hold harmless {LEGAL_COMPANY_NAME} and its officers, employees,
          and agents from claims, losses, and expenses (including reasonable legal fees) arising from
          your content, your misuse of the platform, your breach of these Terms, or your violation
          of Singapore law or third-party rights — except to the extent caused by our fraud or
          wilful misconduct.
        </p>
      </LegalSection>

      <LegalSection id="suspension" title="12. Suspension and termination">
        <p>
          You may stop using the service at any time. We may suspend or terminate access if you
          breach these Terms, create legal or security risk, or if we discontinue the service. Upon
          termination, licences end; provisions that by nature should survive (including IP,
          disclaimers, liability limits, indemnity, and governing law) continue.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="13. Changes">
        <p>
          We may update these Terms by posting a revised version with a new effective date. Continued
          use after the effective date constitutes acceptance, except where Singapore law requires
          additional consent.
        </p>
      </LegalSection>

      <LegalSection id="general" title="14. General">
        <LegalList
          items={[
            "If any provision is unenforceable, the remainder stays in effect",
            "Failure to enforce a provision is not a waiver",
            "These Terms are the entire agreement regarding the service and supersede prior proposals on the same subject",
            "You may not assign these Terms without our consent; we may assign in connection with a merger, acquisition, or sale of assets",
          ]}
        />
      </LegalSection>

      <LegalSection id="governing-law" title="15. Governing law and disputes">
        <p>
          These Terms are governed by {LEGAL_GOVERNING_LAW}, without regard to conflict-of-law
          rules. Subject to any mandatory rights you may have as a consumer under Singapore law,
          the parties submit to the exclusive jurisdiction of {LEGAL_DISPUTE_FORUM}.
        </p>
        <p>
          Before commencing court proceedings, please contact{" "}
          <a
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href={`mailto:${LEGAL_SUPPORT_EMAIL}`}
          >
            {LEGAL_SUPPORT_EMAIL}
          </a>{" "}
          so we can attempt to resolve the dispute informally.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="16. Contact">
        <p>
          {LEGAL_COMPANY_NAME} ·{" "}
          <a
            className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            href={`mailto:${LEGAL_SUPPORT_EMAIL}`}
          >
            {LEGAL_SUPPORT_EMAIL}
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
