import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — 10tap",
  description:
    "How refunds, cancellations and failed OTP deliveries are handled on 10tap.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="April 17, 2026">
      <p>
        At <strong>Syntix</strong>, operator of <strong>10tap</strong>, we want
        you to pay only for what you actually receive. This policy explains how
        wallet top-ups, OTP purchases and number rentals are refunded and
        cancelled.
      </p>

      <h2>1. Wallet top-ups</h2>
      <ul>
        <li>
          Wallet top-ups made via Razorpay (cards / UPI / net-banking) or
          CloudPaya (cryptocurrency) are credited to your 10tap wallet as soon
          as the payment is confirmed.
        </li>
        <li>
          Completed top-ups are <strong>non-refundable back to source</strong>{" "}
          because the funds become store credit spendable on 10tap services. If
          a charge is made but the wallet is not credited within 30 minutes,
          email us at{" "}
          <a href="mailto:support@10tap.io">support@10tap.io</a> with your
          payment reference; we will investigate and credit or refund as
          appropriate within 5–7 business days.
        </li>
        <li>
          Cryptocurrency payments are final once confirmed on-chain. If you
          send the wrong amount or an unsupported coin, recovery may not be
          possible — please double-check before confirming.
        </li>
      </ul>

      <h2>2. OTP / activation purchases</h2>
      <ul>
        <li>
          When you purchase an OTP activation, funds are debited from your
          wallet and held against the order.
        </li>
        <li>
          If <strong>no OTP is received</strong> within the product timeout
          window, the activation is automatically <strong>cancelled</strong>{" "}
          and the full amount is <strong>refunded to your wallet</strong>.
        </li>
        <li>
          Once an OTP/SMS has been delivered to your dashboard, the activation
          is considered fulfilled and is non-refundable.
        </li>
        <li>
          You may cancel a pending activation from the dashboard before any
          message is received; the amount will be refunded to your wallet.
        </li>
      </ul>

      <h2>3. Number rentals</h2>
      <ul>
        <li>
          Rentals are billed up-front for the requested duration and reserve a
          number from the upstream provider.
        </li>
        <li>
          A rental can be cancelled before any SMS has been received, subject
          to the upstream provider&apos;s cancellation rules. Where a refund is
          available it is credited to your wallet.
        </li>
        <li>
          Once a rental has received one or more messages, or the rental
          window has started, it is generally <strong>non-refundable</strong>.
        </li>
      </ul>

      <h2>4. How to request a refund</h2>
      <ol className="my-4 list-decimal pl-6">
        <li>
          Email <a href="mailto:support@10tap.io">support@10tap.io</a> from the
          address registered on your account.
        </li>
        <li>
          Include the order ID or transaction ID, a short description of the
          issue and any screenshots that help us investigate.
        </li>
        <li>
          We acknowledge refund requests within 2 business days and resolve
          them within 5–7 business days, subject to information received from
          our payment processors and upstream providers.
        </li>
      </ol>

      <h2>5. Chargebacks</h2>
      <p>
        Please contact us first — we are almost always able to resolve an issue
        faster than a chargeback. Filing a chargeback for a transaction that
        has been successfully fulfilled is a violation of our{" "}
        <a href="/terms">Terms &amp; Conditions</a> and may result in account
        suspension and the forfeiture of remaining wallet balance.
      </p>

      <h2>6. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Changes will be reflected
        on this page with a new “Last updated” date.
      </p>

      <h2>7. Contact</h2>
      <p>
        Refund questions: <a href="mailto:support@10tap.io">support@10tap.io</a>
        {" "}· <a href="/contact">contact page</a>.
      </p>
    </LegalPage>
  );
}
