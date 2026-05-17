import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">{title}</h2>
    <div className="text-gray-600 text-sm leading-relaxed space-y-2">{children}</div>
  </div>
);

const PrivacyPolicy = () => {
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
          <Shield size={28} className="text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
        <p className="text-xs text-gray-400 mb-8">Last updated: May 2026 &nbsp;|&nbsp; Effective for all RistaSetu users</p>

        <Section title="1. Information We Collect">
          <p>We collect information you provide directly when creating your profile: name, age, gender, religion, community/caste, city, state, occupation, and a profile photograph.</p>
          <p>We also collect your mobile number for authentication via OTP, and usage data such as interests sent, profiles viewed, and login timestamps.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>Your profile information is used to show your profile to other registered users for matrimonial matching purposes.</p>
          <p>Contact details (phone number, email) are shared with a matched user only after both parties accept each other's interest.</p>
          <p>We do not sell your personal data to third parties.</p>
        </Section>

        <Section title="3. Data Sharing">
          <p>Your profile is visible to all registered and authenticated users on RistaSetu.</p>
          <p>We use Firebase (Google) for authentication and data storage, and Cloudinary for image hosting. These third-party services have their own privacy policies.</p>
        </Section>

        <Section title="4. Data Retention & Deletion">
          <p>You may delete your account at any time from Settings &rarr; Delete Account. Upon deletion, your profile, interests, shortlists, and notifications are permanently removed from our systems.</p>
          <p>Profile photos hosted on Cloudinary may take up to 30 days to be fully purged from CDN caches.</p>
        </Section>

        <Section title="5. Security">
          <p>All data is stored on Firebase Firestore with security rules enforced at the database level. Access to your data is restricted to your own account and administrators.</p>
          <p>Phone-based OTP authentication ensures only verified phone owners can access accounts.</p>
        </Section>

        <Section title="6. Your Rights (DPDP Act 2023)">
          <p>Under India's Digital Personal Data Protection Act 2023, you have the right to:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate personal data</li>
            <li>Erase your personal data (via account deletion)</li>
            <li>Withdraw consent at any time by deleting your account</li>
          </ul>
        </Section>

        <Section title="7. Grievance Officer (IT Act 2000 / IT Rules 2021)">
          <p>In accordance with the Information Technology Act, 2000 and the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the name and contact details of the Grievance Officer are provided below:</p>
          <div className="bg-gray-50 rounded-lg p-4 mt-2 space-y-1">
            <p><strong>Name:</strong> Mukesh Kumar</p>
            <p><strong>Designation:</strong> Grievance Officer</p>
            <p><strong>Organisation:</strong> RistaSetu Matrimony Services</p>
            <p><strong>Address:</strong> Gorakhpur, Uttar Pradesh – 273001, India</p>
            <p><strong>Email:</strong> grievance@ristasetu.com</p>
            <p><strong>Response Time:</strong> Acknowledgement within 24 hours; resolution within 15 days</p>
          </div>
        </Section>

        <Section title="8. Contact">
          <p>For privacy-related queries or data requests, email us at: <strong>privacy@ristasetu.com</strong></p>
          <p>Registered entity: RistaSetu Matrimony Services, Gorakhpur, Uttar Pradesh, India.</p>
        </Section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
