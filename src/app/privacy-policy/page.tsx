import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Sri Sambuddha Viharaya ticket booking.",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="theme-muted-text text-sm">Last updated: March 5, 2026</p>

      <div className="theme-panel space-y-4 rounded-xl border p-6 text-sm leading-7">
        <p>
          We collect the information needed to process ticket purchases, send confirmations, and provide event access.
          This typically includes your name, email address, payment details handled by our payment provider, and order
          history.
        </p>
        <p>
          We use this information to deliver tickets, manage attendance, support customer service, and maintain booking
          records. We do not sell your personal information.
        </p>
        <p>
          Payment information is processed securely by our payment partner and is not stored in full on this website.
        </p>
        <p>
          By purchasing through this platform, you agree that all ticket sales are final and non-refundable unless
          required by applicable law.
        </p>
        <p>
          For privacy-related requests, contact us at{" "}
          <a
            href="mailto:info@srisambuddhaviharaya.com"
            className="underline-offset-4 hover:underline"
          >
            info@srisambuddhaviharaya.com
          </a>
          .
        </p>
      </div>
    </section>
  );
}
