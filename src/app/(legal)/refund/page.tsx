import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | VeriMedrix",
  description: "Refund and cancellation policy for VeriMedrix compliance management platform.",
};

export default function RefundPage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:scroll-mt-20">
      <h1 className="text-3xl font-bold mb-2">Refund Policy</h1>
      <p className="text-slate-500 text-sm mb-8">
        Last updated: {new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
        <p className="text-slate-700 m-0">
          At VeriMedrix, we want you to be completely satisfied with our compliance management platform.
          This Refund Policy outlines our commitment to ensuring your satisfaction.
        </p>
      </div>

      {/* Section 1 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">1. 14-Day Money-Back Guarantee</h2>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800 m-0 font-medium">
            We offer a full 14-day money-back guarantee on all subscription payments.
          </p>
        </div>

        <p>
          If you are not satisfied with VeriMedrix for any reason, you can request a full refund within
          14 days of your payment. No questions asked.
        </p>

        <ul className="space-y-2 mt-4">
          <li>This guarantee applies to all subscription plans</li>
          <li>You will receive a full refund of the payment made</li>
          <li>Refunds are processed within 5-10 business days</li>
        </ul>
      </section>

      {/* Section 2 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">2. Free Trial</h2>

        <p>In addition to our refund guarantee, we offer a 14-day free trial for all new users:</p>
        <ul className="space-y-2 mt-4">
          <li>Full access to all features of your selected plan</li>
          <li>No credit card or payment information required to start</li>
          <li>Cancel at any time during the trial without charge</li>
        </ul>
        <p className="mt-4">
          We encourage you to fully explore the platform during your trial period to ensure it meets your needs.
        </p>
      </section>

      {/* Section 3 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">3. How to Request a Refund</h2>
        <p>To request a refund within the 14-day guarantee period:</p>
        <ol className="space-y-3 mt-4 list-decimal list-inside">
          <li>Email our team at <strong>admin@verimedrix.com</strong></li>
          <li>Include your account email address</li>
          <li>State that you would like a refund</li>
        </ol>
        <p className="mt-4">
          We will process your refund to your original payment method within 5-10 business days.
        </p>
      </section>

      {/* Section 4 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">4. Subscription Cancellation</h2>

        <h3 className="text-lg font-medium mt-6 mb-3">4.1 How to Cancel</h3>
        <p>You can cancel your subscription at any time by:</p>
        <ul className="space-y-2 mt-4">
          <li>Going to <strong>Settings → Billing</strong> in your dashboard</li>
          <li>Contacting our team at admin@verimedrix.com</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">4.2 Effect of Cancellation</h3>
        <p>When you cancel your subscription:</p>
        <ul className="space-y-2 mt-4">
          <li>Your subscription will remain active until the end of your current billing period</li>
          <li>You will not be charged for the next billing cycle</li>
          <li>You can continue to use all features until your subscription expires</li>
          <li>Your data will be retained for 30 days after expiration, allowing you to reactivate or export your data</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">5. Plan Changes</h2>

        <h3 className="text-lg font-medium mt-6 mb-3">5.1 Upgrading Your Plan</h3>
        <p>When you upgrade to a higher-tier plan:</p>
        <ul className="space-y-2 mt-4">
          <li>The change takes effect immediately</li>
          <li>You will be charged a pro-rata amount for the remainder of your billing cycle</li>
          <li>Your next full billing will be at the new plan rate</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">5.2 Downgrading Your Plan</h3>
        <p>When you downgrade to a lower-tier plan:</p>
        <ul className="space-y-2 mt-4">
          <li>The change takes effect at the start of your next billing cycle</li>
          <li>Features exclusive to the higher plan will be disabled after the downgrade</li>
        </ul>
      </section>

      {/* Section 6 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">6. Currency and Payment</h2>
        <p>
          All refunds will be issued in South African Rand (ZAR) to the original payment method used for the purchase.
        </p>
        <p className="mt-4">
          We are not responsible for currency conversion fees that may be charged by your bank or payment provider.
        </p>
      </section>

      {/* Section 7 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">7. Changes to This Policy</h2>
        <p>
          We may update this Refund Policy from time to time. Material changes will be communicated via
          email or through the Service.
        </p>
      </section>

      {/* Section 8 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">8. Contact Us</h2>
        <p>If you have questions about this Refund Policy or need assistance:</p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
          <p className="m-0"><strong>Email:</strong> admin@verimedrix.com</p>
          <p className="m-0 mt-2"><strong>Website:</strong> verimedrix.com</p>
        </div>
        <p className="mt-4 text-slate-600">
          Our team is available Monday to Friday, 8:00 AM to 5:00 PM (SAST), excluding South African
          public holidays.
        </p>
      </section>
    </article>
  );
}
