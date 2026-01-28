import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | VeriMedrix",
  description: "Privacy policy for VeriMedrix compliance management platform.",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:scroll-mt-20">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-slate-500 text-sm mb-8">
        Last updated: {new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
        <p className="text-slate-700 m-0">
          VeriMedrix is committed to protecting your privacy. This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you use our compliance management platform.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-blue-800 m-0">
          We comply with the <strong>Protection of Personal Information Act (POPIA)</strong> of South Africa
          and are committed to ensuring that your privacy is protected.
        </p>
      </div>

      {/* Section 2 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">1. Information We Collect</h2>

        <h3 className="text-lg font-medium mt-6 mb-3">1.1 Personal Information</h3>
        <p>We collect personal information that you voluntarily provide when:</p>
        <ul className="space-y-2 mt-4">
          <li>Creating an account (name, email address, phone number)</li>
          <li>Setting up your practice profile (practice name, address, registration numbers)</li>
          <li>Subscribing to our services (billing information)</li>
          <li>Contacting our support team</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">1.2 Practice and Compliance Data</h3>
        <p>When using our Service, you may upload or create:</p>
        <ul className="space-y-2 mt-4">
          <li>Compliance documents and certificates</li>
          <li>Employee information for team management</li>
          <li>Task and logbook entries</li>
          <li>Training records</li>
          <li>Leave and payroll information</li>
          <li>Complaints and adverse event records</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">1.3 Automatically Collected Information</h3>
        <p>We automatically collect certain information when you use the Service:</p>
        <ul className="space-y-2 mt-4">
          <li>Device information (browser type, operating system)</li>
          <li>IP address and general location data</li>
          <li>Usage data (pages visited, features used, time spent)</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">2. How We Use Your Information</h2>
        <p>We use the collected information for:</p>
        <ul className="space-y-3 mt-4">
          <li>
            <strong>Providing the Service</strong><br />
            <span className="text-slate-600">To operate and maintain the platform, manage your account, and process payments</span>
          </li>
          <li>
            <strong>Communication</strong><br />
            <span className="text-slate-600">To send you important updates, security alerts, and support messages</span>
          </li>
          <li>
            <strong>Reminders and Notifications</strong><br />
            <span className="text-slate-600">To send document expiry reminders, task notifications, and compliance alerts</span>
          </li>
          <li>
            <strong>Improvement</strong><br />
            <span className="text-slate-600">To analyze usage patterns and improve the Service</span>
          </li>
          <li>
            <strong>Security</strong><br />
            <span className="text-slate-600">To protect against unauthorized access and ensure data integrity</span>
          </li>
          <li>
            <strong>Legal Compliance</strong><br />
            <span className="text-slate-600">To comply with legal obligations and respond to lawful requests</span>
          </li>
        </ul>
      </section>

      {/* Section 4 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">3. Data Storage and Security</h2>

        <h3 className="text-lg font-medium mt-6 mb-3">3.1 Data Location</h3>
        <p>
          Your data is stored on secure servers provided by our hosting partners. We use industry-standard
          security measures to protect your data.
        </p>

        <h3 className="text-lg font-medium mt-6 mb-3">3.2 Security Measures</h3>
        <p>We implement comprehensive security measures including:</p>
        <ul className="space-y-2 mt-4">
          <li>256-bit SSL/TLS encryption for all data in transit</li>
          <li>Encryption at rest for stored data</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Multi-factor authentication options</li>
          <li>Role-based access controls</li>
          <li>Daily automated backups</li>
          <li>99.9% uptime guarantee with redundant infrastructure</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">3.3 Data Retention</h3>
        <p>
          We retain your data for as long as your account is active or as needed to provide the Service.
          After account termination:
        </p>
        <ul className="space-y-2 mt-4">
          <li>We retain your data for 30 days to allow for data export or account reactivation</li>
          <li>After 30 days, personal data is deleted from our active systems</li>
          <li>Backup copies may be retained for up to 90 days for disaster recovery purposes</li>
          <li>Certain data may be retained longer if required by law or for legitimate business purposes</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">4. Information Sharing</h2>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 m-0 font-medium">
            We do not sell, trade, or rent your personal information to third parties.
          </p>
          <p className="text-green-700 m-0 mt-2">
            Your compliance data and practice information remain strictly confidential.
          </p>
        </div>

        <h3 className="text-lg font-medium mt-6 mb-3">4.1 Third-Party Service Providers</h3>
        <p>We may share information with trusted third parties who assist us in operating the Service:</p>
        <ul className="space-y-2 mt-4">
          <li><strong>Payment Processing:</strong> Paddle processes subscription payments securely</li>
          <li><strong>Cloud Infrastructure:</strong> Our hosting providers store and process data on our behalf</li>
          <li><strong>Email Services:</strong> We use email providers to send notifications and communications</li>
          <li><strong>Analytics:</strong> We use analytics tools to understand how the Service is used</li>
        </ul>
        <p className="mt-4">
          All third-party providers are contractually obligated to protect your data and use it only for
          the purposes we specify.
        </p>

        <h3 className="text-lg font-medium mt-6 mb-3">4.2 Legal Requirements</h3>
        <p>We may disclose your information if required by law or in response to:</p>
        <ul className="space-y-2 mt-4">
          <li>Valid legal processes (subpoenas, court orders)</li>
          <li>Government requests from authorized authorities</li>
          <li>To protect our rights, property, or safety</li>
          <li>To investigate potential violations of our Terms</li>
        </ul>
      </section>

      {/* Section 6 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">5. Your Rights Under POPIA</h2>
        <p>Under the Protection of Personal Information Act, you have the right to:</p>
        <ul className="space-y-3 mt-4">
          <li>
            <strong>Access</strong><br />
            <span className="text-slate-600">Request a copy of the personal information we hold about you</span>
          </li>
          <li>
            <strong>Correction</strong><br />
            <span className="text-slate-600">Request correction of inaccurate or incomplete information</span>
          </li>
          <li>
            <strong>Deletion</strong><br />
            <span className="text-slate-600">Request deletion of your personal information (subject to legal requirements)</span>
          </li>
          <li>
            <strong>Objection</strong><br />
            <span className="text-slate-600">Object to certain processing of your personal information</span>
          </li>
          <li>
            <strong>Data Portability</strong><br />
            <span className="text-slate-600">Request your data in a structured, commonly used format</span>
          </li>
          <li>
            <strong>Withdraw Consent</strong><br />
            <span className="text-slate-600">Withdraw consent for processing where consent was the basis</span>
          </li>
        </ul>
        <p className="mt-4">
          To exercise these rights, please contact us at <strong>admin@verimedrix.com</strong>.
          We will respond to your request within 30 days.
        </p>
      </section>

      {/* Section 7 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">6. Cookies and Tracking</h2>

        <h3 className="text-lg font-medium mt-6 mb-3">6.1 What Are Cookies</h3>
        <p>
          Cookies are small text files stored on your device when you visit our website. They help us
          provide a better user experience.
        </p>

        <h3 className="text-lg font-medium mt-6 mb-3">6.2 Types of Cookies We Use</h3>
        <ul className="space-y-2 mt-4">
          <li><strong>Essential Cookies:</strong> Required for the Service to function (authentication, security)</li>
          <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">6.3 Managing Cookies</h3>
        <p>
          You can control cookies through your browser settings. Note that disabling essential cookies
          may affect the functionality of the Service.
        </p>
      </section>

      {/* Section 8 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">7. Children&apos;s Privacy</h2>
        <p>
          The Service is not intended for individuals under 18 years of age. We do not knowingly collect
          personal information from children.
        </p>
        <p className="mt-4">
          If you believe we have collected information from a child, please contact us immediately.
        </p>
      </section>

      {/* Section 9 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">8. International Data Transfers</h2>
        <p>
          Your data may be transferred to and processed in countries outside South Africa where our
          service providers operate.
        </p>
        <p className="mt-4">
          We ensure appropriate safeguards are in place to protect your data in accordance with POPIA requirements.
        </p>
      </section>

      {/* Section 10 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any material changes
          by posting the new policy on this page and updating the &quot;Last updated&quot; date.
        </p>
        <p className="mt-4">
          We encourage you to review this policy periodically.
        </p>
      </section>

      {/* Section 10 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">10. Contact Us</h2>
        <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
          <p className="m-0"><strong>Email:</strong> admin@verimedrix.com</p>
          <p className="m-0 mt-2"><strong>Website:</strong> verimedrix.com</p>
        </div>
      </section>
    </article>
  );
}
