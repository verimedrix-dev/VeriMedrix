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
          This Refund Policy outlines the terms under which refunds may be issued for our subscription services.
        </p>
      </div>

      {/* Section 1 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">1. Free Trial</h2>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800 m-0 font-medium">
            We offer a 14-day free trial for all new users.
          </p>
        </div>

        <p>During this period:</p>
        <ul className="space-y-2 mt-4">
          <li>You have full access to all features of your selected plan</li>
          <li>No credit card or payment information is required</li>
          <li>You can cancel at any time without charge</li>
          <li>At the end of the trial, you will need to subscribe to continue using the Service</li>
        </ul>
        <p className="mt-4">
          We encourage you to fully explore the platform during your trial period to ensure it meets your needs
          before subscribing.
        </p>
      </section>

      {/* Section 2 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">2. Subscription Cancellation</h2>

        <h3 className="text-lg font-medium mt-6 mb-3">2.1 How to Cancel</h3>
        <p>You can cancel your subscription at any time by:</p>
        <ul className="space-y-2 mt-4">
          <li>Going to <strong>Settings → Billing</strong> in your dashboard</li>
          <li>Contacting our support team at admin@verimedrix.com</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">2.2 Effect of Cancellation</h3>
        <p>When you cancel your subscription:</p>
        <ul className="space-y-2 mt-4">
          <li>Your subscription will remain active until the end of your current billing period</li>
          <li>You will not be charged for the next billing cycle</li>
          <li>You can continue to use all features until your subscription expires</li>
          <li>After expiration, your account will be downgraded and you will lose access to premium features</li>
          <li>Your data will be retained for 30 days after expiration, allowing you to reactivate or export your data</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">3. Refund Eligibility</h2>

        <h3 className="text-lg font-medium mt-6 mb-3">3.1 Standard Refund Policy</h3>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-amber-800 m-0">
            Due to the nature of our subscription service and the 14-day free trial we offer,
            we generally <strong>do not provide refunds</strong> for subscription payments.
          </p>
        </div>
        <p>
          The free trial period is designed to allow you to evaluate the Service before committing to a paid subscription.
        </p>

        <h3 className="text-lg font-medium mt-6 mb-3">3.2 Exceptions</h3>
        <p>We may consider refund requests in the following circumstances:</p>
        <ul className="space-y-3 mt-4">
          <li>
            <strong>Technical Issues</strong><br />
            <span className="text-slate-600">If you experienced significant technical problems that prevented you from using the Service, and our support team was unable to resolve the issues within a reasonable timeframe.</span>
          </li>
          <li>
            <strong>Duplicate Charges</strong><br />
            <span className="text-slate-600">If you were accidentally charged more than once for the same subscription period.</span>
          </li>
          <li>
            <strong>Unauthorized Charges</strong><br />
            <span className="text-slate-600">If a charge was made without your authorization (subject to verification).</span>
          </li>
          <li>
            <strong>Service Discontinuation</strong><br />
            <span className="text-slate-600">If we discontinue the Service entirely.</span>
          </li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">3.3 First-Month Guarantee</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 m-0">
            For new subscribers, we offer a <strong>pro-rata refund within the first 7 days</strong> of your
            first paid subscription month if you are not satisfied with the Service.
          </p>
        </div>
        <p>To qualify:</p>
        <ul className="space-y-2 mt-4">
          <li>You must request the refund within 7 days of your first payment</li>
          <li>This applies only to your first subscription payment, not renewals</li>
          <li>You must provide a reason for your dissatisfaction so we can improve our service</li>
        </ul>
      </section>

      {/* Section 4 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">4. How to Request a Refund</h2>
        <p>To request a refund, please:</p>
        <ol className="space-y-3 mt-4 list-decimal list-inside">
          <li>Email our support team at <strong>admin@verimedrix.com</strong></li>
          <li>Include your account email address and the date of the charge</li>
          <li>Provide a detailed explanation of why you are requesting a refund</li>
          <li>Include any relevant documentation (screenshots of issues, support ticket numbers, etc.)</li>
        </ol>
        <p className="mt-4">
          We will review your request and respond within <strong>5 business days</strong>. If approved,
          refunds will be processed to your original payment method within 5-10 business days.
        </p>
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
          <li>No refunds are provided for the current billing period</li>
          <li>Features exclusive to the higher plan will be disabled after the downgrade</li>
        </ul>
      </section>

      {/* Section 6 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">6. Non-Refundable Items</h2>
        <p>The following are not eligible for refunds:</p>
        <ul className="space-y-2 mt-4">
          <li>Partial months of service (subscriptions are billed monthly)</li>
          <li>Subscription renewals after the first month</li>
          <li>Accounts terminated for violation of our Terms of Service</li>
          <li>Accounts that have been inactive for extended periods</li>
          <li>Any promotional or discounted subscriptions (unless specified in the promotion terms)</li>
        </ul>
      </section>

      {/* Section 7 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">7. Currency and Payment</h2>
        <p>
          All refunds will be issued in South African Rand (ZAR) to the original payment method used for the purchase.
        </p>
        <p className="mt-4">
          We are not responsible for currency conversion fees that may be charged by your bank or payment provider.
        </p>
      </section>

      {/* Section 8 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">8. Chargebacks</h2>
        <p>
          If you dispute a charge with your bank or credit card company without first contacting us, we
          reserve the right to suspend your account pending resolution.
        </p>
        <p className="mt-4">
          Please contact our support team first to resolve any billing issues.
        </p>
      </section>

      {/* Section 9 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">9. Changes to This Policy</h2>
        <p>
          We may update this Refund Policy from time to time. Material changes will be communicated via
          email or through the Service.
        </p>
        <p className="mt-4">
          The updated policy will apply to all new and existing subscriptions.
        </p>
      </section>

      {/* Section 10 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">10. Contact Us</h2>
        <p>If you have questions about this Refund Policy or need assistance with a refund request:</p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
          <p className="m-0"><strong>Email:</strong> admin@verimedrix.com</p>
          <p className="m-0 mt-2"><strong>Website:</strong> verimedrix.com</p>
        </div>
        <p className="mt-4 text-slate-600">
          Our support team is available Monday to Friday, 8:00 AM to 5:00 PM (SAST), excluding South African
          public holidays.
        </p>
      </section>
    </article>
  );
}
