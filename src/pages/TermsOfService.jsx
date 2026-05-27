import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">{title}</h2>
    <div className="text-gray-600 text-sm leading-relaxed space-y-2">{children}</div>
  </div>
);

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 page-transition max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary mb-6 bg-transparent border-none cursor-pointer font-bold"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText size={28} className="text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
        </div>
        <p className="text-xs text-gray-400 mb-8">Last updated: May 2026 &nbsp;|&nbsp; Please read carefully before using RistaSetu</p>

        <Section title="1. Acceptance of Terms">
          <p>By registering on RistaSetu, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
        </Section>

        <Section title="2. Eligibility">
          <ul className="list-disc ml-5 space-y-1">
            <li>You must be at least <strong>18 years of age</strong> to register.</li>
            <li>You must be legally eligible to marry under applicable Indian laws.</li>
            <li>You must provide a valid Indian mobile number for OTP verification.</li>
            <li>You must not already have an active account on RistaSetu.</li>
          </ul>
        </Section>

        <Section title="3. User Obligations">
          <p>By using RistaSetu, you agree to:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Provide accurate, truthful, and up-to-date information in your profile.</li>
            <li>Use the platform solely for the purpose of matrimonial matchmaking.</li>
            <li>Not impersonate another person or misrepresent your identity.</li>
            <li>Treat other users with respect and dignity.</li>
            <li>Promptly report profiles or behaviour that violates these terms.</li>
          </ul>
        </Section>

        <Section title="4. Prohibited Conduct">
          <p>You must NOT use RistaSetu to:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Harass, threaten, or intimidate other users.</li>
            <li>Send unsolicited messages or spam interests.</li>
            <li>Share obscene, offensive, or inappropriate content.</li>
            <li>Engage in fraudulent activity or financial solicitation.</li>
            <li>Collect or misuse other users' personal contact information.</li>
            <li>Create fake or duplicate profiles.</li>
          </ul>
          <p className="mt-2">Violation of these rules will result in immediate account suspension or permanent ban without notice.</p>
        </Section>

        <Section title="5. Profile Content">
          <p>You are responsible for all content you upload, including profile photos and written descriptions. By submitting content, you grant RistaSetu a non-exclusive license to display it to other registered users for matchmaking purposes.</p>
          <p>Profile photos must clearly show your face, be recent, and not contain obscene or misleading content.</p>
        </Section>

        <Section title="6. Subscriptions & Payments">
          <p>RistaSetu offers both free and paid (Premium) plans. Paid plans are non-refundable once activated, except where required by applicable law.</p>
          <p>RistaSetu reserves the right to modify pricing with 30 days advance notice to subscribed users.</p>
        </Section>

        <Section title="7. Account Termination">
          <p>You may delete your account at any time from Settings. RistaSetu may suspend or terminate accounts that violate these terms, with or without prior notice.</p>
          <p>Upon deletion, your data is removed as described in our Privacy Policy.</p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>RistaSetu is a platform that facilitates introductions between consenting adults. We do not conduct background checks or guarantee the accuracy of user-provided information.</p>
          <p>RistaSetu shall not be liable for any loss, harm, or damage arising from interactions between users, including in-person meetings. Users meet at their own risk.</p>
          <p>Our total liability in any circumstance shall not exceed the amount paid by you (if any) in the preceding 3 months.</p>
        </Section>

        <Section title="9. Governing Law & Jurisdiction">
          <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Deoria, Uttar Pradesh.</p>
        </Section>

        <Section title="10. Changes to Terms">
          <p>We may update these Terms at any time. Continued use of RistaSetu after changes constitutes acceptance of the updated Terms. Significant changes will be notified via the app.</p>
        </Section>

        <Section title="11. Contact">
          <p>For queries regarding these Terms, contact us at: <strong>legal@ristasetu.com</strong></p>
          <p>RistaSetu Matrimony Services, Deoria, Uttar Pradesh, India.</p>
        </Section>
      </div>
    </div>
  );
};

export default TermsOfService;
