import React, { useRef, useState } from 'react';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import PremiumModal from './PremiumModal';

const _dlKey = () => {
  const d = new Date();
  return `rs_biodata_dl_${d.getFullYear()}_${d.getMonth()}`;
};
const getDlCount = () => parseInt(localStorage.getItem(_dlKey()) || '0', 10);
const incDlCount = () => localStorage.setItem(_dlKey(), String(getDlCount() + 1));

const MAROON = '#8B1A2F';
const val = (v) => (v && String(v).trim()) ? String(v).trim() : null;

const Row = ({ label, value }) => {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', marginBottom: '5px', alignItems: 'flex-start' }}>
      <span style={{ minWidth: '145px', fontWeight: '600', color: '#666', fontSize: '11.5px', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: '11.5px', color: '#111', flex: 1 }}>{value}</span>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '14px' }}>
    <div style={{
      background: MAROON, color: 'white', padding: '4px 10px',
      fontSize: '10.5px', fontWeight: 'bold', letterSpacing: '0.8px',
      textTransform: 'uppercase', marginBottom: '8px', borderRadius: '2px',
    }}>
      {title}
    </div>
    <div style={{ paddingLeft: '2px' }}>{children}</div>
  </div>
);

const BiodataDownloadButton = ({ profile, showContact = false, className = '' }) => {
  const templateRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { userProfile } = useAuthContext();

  const handleDownload = async () => {
    if (status === 'generating') return;

    // Free users: max 3 downloads/month
    if (!userProfile?.isPremium && getDlCount() >= 3) {
      setShowPremiumModal(true);
      return;
    }

    setStatus('generating');
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      // Fetch photo as blob to bypass CORS restriction in html2canvas
      const imgEl = templateRef.current?.querySelector('.bd-photo');
      if (imgEl && profile.photoUrl) {
        try {
          const resp = await fetch(profile.photoUrl);
          const blob = await resp.blob();
          const blobUrl = URL.createObjectURL(blob);
          imgEl.src = blobUrl;
          await new Promise((res) => {
            imgEl.onload = res;
            imgEl.onerror = res;
            setTimeout(res, 4000);
          });
        } catch { /* continue without photo */ }
      }

      const canvas = await html2canvas(templateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const imgH = (canvas.height * pageW) / canvas.width;

      let yPos = 0;
      while (yPos < imgH) {
        if (yPos > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -yPos, pageW, imgH);
        yPos += pageH;
      }

      const name = (profile.name || 'Profile').replace(/\s+/g, '_');
      pdf.save(`RistaSetu_Biodata_${name}.pdf`);
      incDlCount();
      setStatus('done');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Biodata PDF error:', err);
      setStatus('idle');
    }
  };

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <>
      {showPremiumModal && (
        <PremiumModal
          feature="Biodata PDF download (3/month free limit)"
          onClose={() => setShowPremiumModal(false)}
        />
      )}
      <button
        onClick={handleDownload}
        disabled={status === 'generating'}
        className={className}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 18px',
          background: status === 'done' ? '#16a34a' : MAROON,
          color: 'white', border: 'none', borderRadius: '8px',
          fontWeight: '600', fontSize: '14px',
          cursor: status === 'generating' ? 'not-allowed' : 'pointer',
          opacity: status === 'generating' ? 0.75 : 1,
          transition: 'background 0.2s',
        }}
      >
        {status === 'generating' ? (
          <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating PDF...</>
        ) : status === 'done' ? (
          <><CheckCircle size={15} /> Downloaded!</>
        ) : (
          <><Download size={15} /> Download Biodata</>
        )}
      </button>

      {/* ── Off-screen A4 biodata template ── */}
      <div
        ref={templateRef}
        style={{
          position: 'fixed', left: '-9999px', top: 0,
          width: '794px', backgroundColor: '#ffffff',
          fontFamily: '"Segoe UI", Arial, "Noto Sans", sans-serif',
          color: '#222', lineHeight: 1.4,
        }}
      >
        {/* Top accent */}
        <div style={{ height: '7px', background: `linear-gradient(90deg, ${MAROON}, #C0392B, ${MAROON})` }} />

        {/* Header */}
        <div style={{
          background: MAROON, padding: '18px 36px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          color: 'white',
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '1.5px' }}>RistaSetu</div>
            <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '2px' }}>ristasetu.web.app</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>विवाह बायोडाटा</div>
            <div style={{ fontSize: '13px', opacity: 0.8 }}>Vivah Biodata</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', opacity: 0.8 }}>
            <div>Generated on</div>
            <div style={{ fontWeight: '600', marginTop: '2px' }}>{today}</div>
          </div>
        </div>

        {/* Gold divider */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />

        {/* Photo + Name banner */}
        <div style={{
          display: 'flex', gap: '20px', padding: '20px 36px 16px',
          borderBottom: `1px solid #e5e7eb`, alignItems: 'flex-start',
        }}>
          <div style={{
            width: '130px', height: '160px', flexShrink: 0,
            border: `3px solid ${MAROON}`, borderRadius: '4px',
            overflow: 'hidden', backgroundColor: '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {profile.photoUrl
              ? <img className="bd-photo" src={profile.photoUrl} alt="" crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <span style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>No Photo</span>
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '26px', fontWeight: '800', color: MAROON }}>{val(profile.name) || 'N/A'}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', marginBottom: '10px' }}>
              {profile.ristaSetuId && (
                <span style={{
                  background: '#FDF2F4', border: `1px solid ${MAROON}`,
                  color: MAROON, padding: '2px 10px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: '600',
                }}>
                  ID: {profile.ristaSetuId}
                </span>
              )}
              {profile.isVerified && (
                <span style={{
                  background: '#F0FDF4', border: '1px solid #16A34A',
                  color: '#16A34A', padding: '2px 10px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: '600',
                }}>
                  ✓ Verified
                </span>
              )}
              {profile.age && (
                <span style={{
                  background: '#F5F5F5', border: '1px solid #d1d5db',
                  color: '#555', padding: '2px 10px', borderRadius: '20px',
                  fontSize: '11px',
                }}>
                  {profile.age} वर्ष · {val(profile.gender) || ''}
                </span>
              )}
            </div>
            {profile.about && (
              <div style={{
                fontSize: '11.5px', color: '#555', lineHeight: 1.6,
                borderLeft: `3px solid ${MAROON}`, paddingLeft: '10px',
                fontStyle: 'italic', maxWidth: '520px',
              }}>
                "{profile.about}"
              </div>
            )}
          </div>
        </div>

        {/* Two-column info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', padding: '18px 36px' }}>
          {/* Left column */}
          <div>
            <Section title="व्यक्तिगत · Personal Info">
              <Row label="आयु / Age" value={profile.age ? `${profile.age} वर्ष` : null} />
              <Row label="लिंग / Gender" value={val(profile.gender)} />
              <Row label="ऊँचाई / Height" value={val(profile.height)} />
              <Row label="रक्त समूह / Blood" value={val(profile.bloodGroup)} />
              <Row label="वैवाहिक स्थिति" value={val(profile.maritalStatus)} />
              <Row label="जन्म स्थान" value={val(profile.birthPlace)} />
              <Row label="जन्म तिथि" value={val(profile.dob) || val(profile.birthDate)} />
            </Section>

            <Section title="धार्मिक · Dharmic Info">
              <Row label="धर्म / Religion" value={val(profile.religion)} />
              <Row label="जाति / Caste" value={val(profile.caste)} />
              <Row label="समुदाय / Community" value={val(profile.community)} />
              <Row label="गोत्र / Gotra" value={val(profile.gotra)} />
              <Row label="मांगलिक / Manglik" value={val(profile.manglik)} />
            </Section>
          </div>

          {/* Right column */}
          <div>
            <Section title="शिक्षा व पेशा · Education">
              <Row label="शिक्षा / Qualification" value={val(profile.education)} />
              <Row label="पेशा / Occupation" value={val(profile.occupation) || val(profile.profession)} />
              <Row label="आमदनी / Income" value={val(profile.incomeRange)} />
            </Section>

            <Section title="परिवार · Family">
              {profile.familyDetails
                ? <div style={{ fontSize: '11.5px', color: '#333', lineHeight: 1.6 }}>{profile.familyDetails}</div>
                : <>
                    <Row label="पिता / Father" value={val(profile.fatherName)} />
                    <Row label="पिता का पेशा" value={val(profile.fatherOccupation)} />
                    <Row label="माता / Mother" value={val(profile.motherName)} />
                    <Row label="भाई / Brothers" value={val(profile.brothers)} />
                    <Row label="बहन / Sisters" value={val(profile.sisters)} />
                  </>
              }
            </Section>

            <Section title="सम्पर्क · Contact">
              <Row label="शहर / City" value={val(profile.city)} />
              <Row label="राज्य / State" value={val(profile.state)} />
              <Row label="RistaSetu ID" value={val(profile.ristaSetuId)} />
              {showContact && <Row label="मोबाइल / Phone" value={val(profile.phone)} />}
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: `2px solid ${MAROON}`, padding: '10px 36px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#FDF2F4',
        }}>
          <div style={{ fontSize: '10px', color: '#999' }}>
            Generated via RistaSetu · ristasetu.web.app
          </div>
          <div style={{ fontSize: '10px', color: '#999' }}>
            यह बायोडाटा RistaSetu द्वारा बनाया गया है · {today}
          </div>
        </div>
        <div style={{ height: '6px', background: MAROON }} />
      </div>
    </>
  );
};

export default BiodataDownloadButton;
