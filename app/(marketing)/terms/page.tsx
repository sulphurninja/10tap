import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions — 10tap",
  description:
    "The rules and conditions that govern your use of 10tap, a Syntix product.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="April 17, 2026">
      <p>
        These Terms &amp; Conditions (“Terms”) form a binding agreement between
        you and <strong>Syntix</strong> (“Syntix”, “we”, “us”, “our”),
        governing your access to and use of the <strong>10tap</strong> website,
        dashboard and APIs (collectively, the “Service”). By creating an
        account or using the Service you agree to be bound by these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        10tap resells access to short-term and long-term virtual phone numbers
        supplied by third-party mobile operators and aggregators. You can use
        the Service to receive one-time passwords (OTPs) and SMS messages on
        assigned virtual numbers for legitimate account-verification,
        development, testing and privacy-protection purposes.
      </p>

      <h2>2. Eligibility &amp; accounts</h2>
      <ul>
        <li>You must be at least 18 years old to use the Service.</li>
        <li>
          You agree to provide accurate information and to keep it up to date.
        </li>
        <li>
          You are responsible for safeguarding your credentials and for all
          activity under your account.
        </li>
        <li>
          We may suspend or terminate accounts that violate these Terms or that
          we reasonably suspect to be involved in fraud or abuse.
        </li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree <strong>not</strong> to use 10tap to:</p>
      <ul>
        <li>
          Engage in fraud, identity theft, impersonation or to create accounts
          in another person&apos;s name without authorisation.
        </li>
        <li>
          Send spam, unsolicited messages or any form of mass unsolicited
          communication.
        </li>
        <li>
          Violate the terms of service of any third-party platform on which
          accounts are being verified.
        </li>
        <li>
          Distribute malware, phishing content, child sexual abuse material or
          any content that is unlawful in your jurisdiction or ours.
        </li>
        <li>
          Bypass rate limits, scrape, reverse-engineer or otherwise interfere
          with the Service.
        </li>
      </ul>

      <h2>4. Wallet, pricing &amp; payments</h2>
      <ul>
        <li>
          10tap operates on a pre-paid wallet system. Top-ups are processed
          through <strong>Razorpay</strong> (cards, UPI, net-banking) and{" "}
          <strong>CloudPaya</strong> (cryptocurrencies). All wallet balances are
          recorded in <strong>Indian Rupees (INR)</strong>.
        </li>
        <li>
          Prices shown in the dashboard are final and include our service
          margin over the upstream provider cost.
        </li>
        <li>
          Wallet balance is non-transferable and has no cash value outside of
          the Service.
        </li>
        <li>
          Taxes, where applicable, are your responsibility and may be added at
          checkout.
        </li>
      </ul>

      <h2>5. OTP delivery &amp; availability</h2>
      <p>
        Virtual numbers and OTPs are supplied by third-party networks outside
        our control. While we strive for high reliability, we do{" "}
        <strong>not guarantee</strong> that every number will successfully
        receive an OTP for every service. If no OTP is received within the
        product timeout, you will be automatically refunded to your wallet
        according to our <a href="/refund">Refund Policy</a>.
      </p>

      <h2>6. Rentals</h2>
      <p>
        Long-term number rentals are sold on an as-available basis for a fixed
        period. Once a rental is active and has received at least one message,
        it is generally non-refundable. Renewals, extensions and cancellations
        are subject to the availability of the upstream provider.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        All content, trademarks (including “10tap” and “Syntix”), code,
        designs and data on the Service are owned by Syntix or its licensors
        and are protected by applicable intellectual-property laws. You are
        granted a limited, non-exclusive, non-transferable licence to use the
        Service in accordance with these Terms.
      </p>

      <h2>8. Privacy</h2>
      <p>
        Your use of the Service is also governed by our{" "}
        <a href="/privacy">Privacy Policy</a>, which describes how we collect
        and process personal data.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The Service is provided on an <strong>“as is”</strong> and{" "}
        <strong>“as available”</strong> basis without warranties of any kind,
        express or implied. Syntix disclaims all implied warranties of
        merchantability, fitness for a particular purpose and non-infringement
        to the fullest extent permitted by law.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Syntix&apos;s aggregate
        liability to you for any claim arising out of or relating to the
        Service shall not exceed the amount you paid to us in the{" "}
        <strong>30 days preceding</strong> the event giving rise to the claim.
        We shall not be liable for any indirect, incidental, special,
        consequential or punitive damages.
      </p>

      <h2>11. Indemnification</h2>
      <p>
        You agree to defend and indemnify Syntix and its affiliates against any
        claims, losses, liabilities and expenses (including reasonable
        attorneys&apos; fees) arising out of your violation of these Terms or
        your misuse of the Service.
      </p>

      <h2>12. Suspension &amp; termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time, with
        or without notice, for any reason, including suspected fraud, abuse or
        non-compliance with these Terms. Upon termination, the sections of
        these Terms that by their nature should survive will survive.
      </p>

      <h2>13. Governing law &amp; disputes</h2>
      <p>
        These Terms are governed by the laws of India, without regard to its
        conflict-of-law rules. The courts at our registered office shall have
        exclusive jurisdiction over any dispute arising out of or in connection
        with these Terms, subject to applicable mandatory consumer-protection
        laws.
      </p>

      <h2>14. Changes</h2>
      <p>
        We may revise these Terms from time to time. The updated version will
        be posted on this page with a new “Last updated” date. Continued use of
        the Service after changes become effective constitutes acceptance of
        the revised Terms.
      </p>

      <h2>15. Contact</h2>
      <p>
        Questions? Write to{" "}
        <a href="mailto:support@10tap.io">support@10tap.io</a> or visit our{" "}
        <a href="/contact">contact page</a>.
      </p>
    </LegalPage>
  );
}
