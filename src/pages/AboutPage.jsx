import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, FileText, Shield, Heart, Users, MapPin, Mail, AlertTriangle } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">{title}</h2>
    <div className="text-gray-600 text-sm leading-relaxed space-y-2">{children}</div>
  </div>
);

const AboutPage = () => {
  const { hash } = useLocation();

  // Scroll to hash anchor after render
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hash]);

  return (
    <div className="container mx-auto px-4 py-8 page-transition max-w-3xl">

      {/* ── About RistaSetu ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck size={32} className="text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">RistaSetu ke Baare Mein</h1>
        </div>
        <p className="text-xs text-gray-400 mb-8">Hamare mission, team, aur aapki privacy ke baare mein</p>

        <Section title="Hamare Baare Mein">
          <p>
            <strong>RistaSetu</strong> ek modern matrimonial platform hai jo Indian families ko
            unke ideal life partner dhundhne mein madad karta hai. Hamara naam do shabdon se bana
            hai — <em>Rishta</em> (sambandh) aur <em>Setu</em> (pul) — yani hum do dilon ke beech
            ek vishwasniya pul banate hain.
          </p>
          <p>
            Hamara platform OTP-based verified accounts, community-specific matching, aur
            ek privacy-first approach ke saath kaam karta hai — taaki aap apni marzi se, apni
            pace mein apna rishta dhundh sakein.
          </p>
        </Section>

        <Section title="Hamara Mission">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <Heart size={24} className="text-red-600 mx-auto mb-2" />
              <p className="font-bold text-gray-800 text-sm">Genuine Matches</p>
              <p className="text-xs text-gray-500 mt-1">Verified profiles, real connections</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <Shield size={24} className="text-red-600 mx-auto mb-2" />
              <p className="font-bold text-gray-800 text-sm">Privacy First</p>
              <p className="text-xs text-gray-500 mt-1">Data aapka, control aapka</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <Users size={24} className="text-red-600 mx-auto mb-2" />
              <p className="font-bold text-gray-800 text-sm">Community Focus</p>
              <p className="text-xs text-gray-500 mt-1">Dharma, jati, gotra ke hisaab se</p>
            </div>
          </div>
        </Section>

        <Section title="Registered Entity">
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p className="flex items-center gap-2"><MapPin size={14} className="text-red-500 shrink-0" /> RistaSetu Matrimony Services, Deoria, Uttar Pradesh – 274001, India</p>
            <p className="flex items-center gap-2"><Mail size={14} className="text-red-500 shrink-0" /> support@ristasetu.com</p>
          </div>
        </Section>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a href="#privacy" className="text-red-600 font-bold hover:underline">↓ Privacy Policy padhein</a>
          <span className="text-gray-300">|</span>
          <a href="#terms" className="text-red-600 font-bold hover:underline">↓ Terms of Service padhein</a>
          <span className="text-gray-300">|</span>
          <Link to="/disclaimer" className="text-red-600 font-bold hover:underline">⚠ Disclaimer padhein</Link>
        </div>
      </div>

      {/* ── Disclaimer ─────────────────────────────────────── */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-red-700 mb-1">Mahatvapurn Disclaimer</h2>
            <p className="text-sm text-red-800 leading-relaxed">
              RistaSetu sirf ek madhyam hai — hum OTP se mobile verify karte hain,
              lekin kisi user ki Aadhar, income, ya background jaanch karna hamare bas mein nahi hai.
              Rishta tay karne se pehle khud jaankari verify karein, parivaar se milein,
              aur sirf profile dekhkar koi faisla na lein.
            </p>
            <Link
              to="/disclaimer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-red-600 hover:underline"
            >
              <AlertTriangle size={14} /> Poora Disclaimer padhein →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Privacy Policy ─────────────────────────────────── */}
      <div id="privacy" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6 scroll-mt-20">
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
          <p>You may delete your account at any time from Settings → Delete Account. Upon deletion, your profile, interests, shortlists, and notifications are permanently removed from our systems.</p>
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
            <p><strong>Address:</strong> Deoria, Uttar Pradesh – 274001, India</p>
            <p><strong>Email:</strong> grievance@ristasetu.com</p>
            <p><strong>Response Time:</strong> Acknowledgement within 24 hours; resolution within 15 days</p>
          </div>
        </Section>

        <Section title="8. Contact">
          <p>For privacy-related queries or data requests, email us at: <strong>privacy@ristasetu.com</strong></p>
          <p>Registered entity: RistaSetu Matrimony Services, Deoria, Uttar Pradesh, India.</p>
        </Section>

        <div className="mt-4 text-right">
          <a href="#terms" className="text-red-600 text-sm font-bold hover:underline">↓ Terms of Service padhein</a>
        </div>
      </div>

      {/* ── Terms of Service ───────────────────────────────── */}
      <div id="terms" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 scroll-mt-20">
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

      <div className="mt-8 text-center text-gray-400 text-xs">
        <p>&copy; 2026 RistaSetu Matrimony Services. All rights reserved.</p>
        <p className="mt-1">
          <Link to="/dashboard" className="text-red-600 hover:underline">Dashboard</Link>
          {' · '}
          <a href="#privacy" className="text-red-600 hover:underline">Privacy</a>
          {' · '}
          <a href="#terms" className="text-red-600 hover:underline">Terms</a>
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
