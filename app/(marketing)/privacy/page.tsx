import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — 10tap",
  description:
    "How Syntix collects, uses and safeguards personal information on 10tap.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="April 17, 2026">
      <p>
        This Privacy Policy explains how <strong>Syntix</strong> (“we”, “us”,
        “our”), the operator of the <strong>10tap</strong> service available at{" "}
        <a href="/">10tap.io</a> (the “Service”), collects, uses, discloses and
        protects information about you when you use the Service.
      </p>
      <p>
        By creating an account or using 10tap, you agree to the practices
        described in this Policy. If you do not agree, please do not use the
        Service.
      </p>

      <h2>1. Information we collect</h2>
      <h3>a. Information you provide</h3>
      <ul>
        <li>
          <strong>Account details:</strong> name, email address and password
          (stored as a salted hash).
        </li>
        <li>
          <strong>Billing details:</strong> when you top up your wallet, our
          payment partners (Razorpay, CloudPaya) collect payment instrument
          information on our behalf. We never receive or store full card
          numbers, UPI credentials or crypto private keys.
        </li>
        <li>
          <strong>Support correspondence:</strong> messages sent through our
          contact form, email or other support channels.
        </li>
      </ul>

      <h3>b. Information collected automatically</h3>
      <ul>
        <li>
          <strong>Usage data:</strong> IP address, browser type, device
          identifiers, referring URLs, pages visited and timestamps.
        </li>
        <li>
          <strong>Cookies &amp; local storage:</strong> we use a signed
          authentication cookie to keep you logged in, and local storage for
          functional preferences. We do not use third-party advertising
          trackers.
        </li>
      </ul>

      <h3>c. Service-related data</h3>
      <ul>
        <li>
          Virtual phone numbers assigned to you, OTP messages received on those
          numbers and the service they were intended for.
        </li>
        <li>
          Wallet transactions (top-ups, debits, refunds) along with the linked
          order or rental.
        </li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>To provide, operate and maintain the Service.</li>
        <li>
          To process wallet top-ups, OTP purchases and rental orders and to
          relay requests to our upstream SMS providers.
        </li>
        <li>
          To communicate with you about your account, transactions, updates and
          support requests.
        </li>
        <li>
          To prevent fraud, abuse and violations of our Terms &amp; Conditions.
        </li>
        <li>To comply with applicable laws and lawful government requests.</li>
      </ul>

      <h2>3. Sharing of information</h2>
      <p>
        We do <strong>not</strong> sell your personal information. We share
        limited information only with:
      </p>
      <ul>
        <li>
          <strong>Payment processors</strong> (Razorpay, CloudPaya) to process
          wallet top-ups. Their processing is governed by their respective
          privacy policies.
        </li>
        <li>
          <strong>SMS / rental providers</strong> that actually provision the
          virtual numbers used for OTPs.
        </li>
        <li>
          <strong>Infrastructure providers</strong> (hosting, database, email
          delivery) that operate under confidentiality obligations.
        </li>
        <li>
          <strong>Law enforcement</strong>, when we believe in good faith that
          disclosure is required by law or to protect rights, property or
          safety.
        </li>
      </ul>

      <h2>4. Data retention</h2>
      <p>
        We keep account information for as long as your account is active. OTP
        messages and temporary number assignments are retained only as long as
        needed to deliver the Service and for reasonable dispute resolution and
        legal record-keeping. You may request deletion of your account at any
        time by writing to us at{" "}
        <a href="mailto:support@10tap.io">support@10tap.io</a>; we will delete
        or anonymise personal data unless we are required to retain it by law.
      </p>

      <h2>5. Security</h2>
      <p>
        We use industry-standard safeguards including TLS in transit,
        access-controlled databases, salted password hashing and signed
        webhooks. No method of transmission or storage is 100% secure, and we
        cannot guarantee absolute security.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Subject to applicable law, you may request access to, correction of,
        portability of, or deletion of your personal information. You may also
        object to or restrict certain processing. To exercise any of these
        rights, contact us at{" "}
        <a href="mailto:support@10tap.io">support@10tap.io</a>.
      </p>

      <h2>7. Children</h2>
      <p>
        10tap is not directed to individuals under 18. We do not knowingly
        collect personal information from children. If you believe a child has
        provided us with personal data, please contact us and we will remove
        it.
      </p>

      <h2>8. International transfers</h2>
      <p>
        10tap is operated from India and its servers may be located in other
        jurisdictions. By using the Service you consent to the transfer and
        processing of your information in those locations.
      </p>

      <h2>9. Changes to this Policy</h2>
      <p>
        We may update this Policy from time to time. Material changes will be
        notified by posting the updated Policy on this page with a new “Last
        updated” date and, where appropriate, by email.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about this Policy? Reach us at{" "}
        <a href="mailto:support@10tap.io">support@10tap.io</a> or via our{" "}
        <a href="/contact">contact page</a>.
      </p>
    </LegalPage>
  );
}
