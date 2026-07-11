import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { db, functions } from '../firebase/firebaseConfig';
import { doc, setDoc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { validateImageFile, uploadKycDocument } from '../utils/uploadUtils';
import { ShieldCheck, Upload, CheckCircle, XCircle, Clock, ArrowLeft, Loader2, FileText } from 'lucide-react';
import Button from '../components/Button';

const DOC_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'driving_license', label: 'Driving License' },
];

const KYC = () => {
  const { currentUser, userProfile } = useAuthContext();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submittedDoc, setSubmittedDoc] = useState(null);

  const alreadySubmitted = userProfile?.kycStatus === 'submitted' || userProfile?.kycStatus === 'verified';
  const isRejected = userProfile?.kycStatus === 'rejected';

  // Document type/number moved to the owner/admin-only private/kyc
  // subcollection — fetch it for the "already submitted" summary view.
  useEffect(() => {
    if (!currentUser?.uid) return;
    return onSnapshot(doc(db, 'users', currentUser.uid, 'private', 'kyc'), (snap) => {
      setSubmittedDoc(snap.exists() ? snap.data() : null);
    });
  }, [currentUser?.uid]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { showToast(err, 'error'); return; }
    setFrontFile(file);
    setFrontPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docType) { showToast('Document type select karein', 'error'); return; }
    if (!docNumber.trim()) { showToast('Document number enter karein', 'error'); return; }
    if (!frontFile) { showToast('Document ki photo upload karein', 'error'); return; }

    setUploading(true);
    try {
      // Signed upload — never the shared unsigned preset used for profile
      // photos. Stores publicId/format, not a directly-viewable URL; only
      // getKycDocumentUrl (admin-only, time-limited) can produce one.
      const getSignature = () => httpsCallable(functions, 'getKycUploadSignature')();
      const { publicId, format } = await uploadKycDocument(frontFile, getSignature);
      // Document type/number/scan are sensitive PII — kept off the
      // broadly-readable users doc, in the owner/admin-only private/kyc
      // subcollection instead. Only the non-sensitive status stays on the
      // main doc (needed for badges + the admin pending-review query).
      await setDoc(doc(db, 'users', currentUser.uid, 'private', 'kyc'), {
        documentType: docType,
        documentNumber: docNumber.trim().toUpperCase(),
        documentPublicId: publicId,
        documentFormat: format,
      }, { merge: true });
      await updateDoc(doc(db, 'users', currentUser.uid), {
        kycStatus: 'submitted',
        kycSubmittedAt: serverTimestamp(),
        kycRejectionReason: null,
      });
      await addDoc(collection(db, 'notifications'), {
        userId: currentUser.uid,
        type: 'kyc_submitted',
        fromId: 'system',
        fromName: 'RistaSetu',
        fromPhoto: null,
        message: 'KYC documents submit ho gaye! Admin 24-48 ghante mein review karega.',
        status: 'unread',
        createdAt: serverTimestamp(),
      });
      showToast('KYC documents submit ho gaye! Admin review karega.', 'success');
      navigate('/settings');
    } catch (err) {
      console.error(err);
      showToast('Upload failed. Dobara try karein.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 page-transition max-w-lg">
      <button
        onClick={() => navigate('/settings')}
        className="flex items-center gap-2 text-primary hover:text-primary-hover mb-6 bg-transparent border-none cursor-pointer font-bold transition-colors"
      >
        <ArrowLeft size={20} /> Settings par wapas jaayein
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="p-3 bg-red-50 rounded-xl">
            <ShieldCheck size={24} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">KYC Verification</h2>
            <p className="text-sm text-gray-500">Government ID se apni identity verify karein</p>
          </div>
        </div>

        {/* Status Banner */}
        {userProfile?.kycStatus === 'verified' && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600 shrink-0" />
            <div>
              <p className="font-bold text-green-800">Verified!</p>
              <p className="text-sm text-green-700">Aapki identity verify ho chuki hai.</p>
            </div>
          </div>
        )}

        {userProfile?.kycStatus === 'submitted' && (
          <div className="mx-6 mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
            <Clock size={20} className="text-yellow-600 shrink-0" />
            <div>
              <p className="font-bold text-yellow-800">🟡 Review Pending</p>
              <p className="text-sm text-yellow-700">Aapke documents submit ho gaye hain. 24-48 ghante mein review hoga.</p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <XCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800">❌ KYC Reject Hua</p>
              <p className="text-sm text-red-700 mt-1">
                {userProfile?.kycRejectionReason || 'Documents verify nahi ho sake.'}
              </p>
              <p className="text-xs text-red-500 mt-1">Neeche sahi documents ke saath dobara submit karein.</p>
            </div>
          </div>
        )}

        {!alreadySubmitted ? (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Document Type *</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="form-select w-full"
                required
              >
                <option value="">Select document type</option>
                {DOC_TYPES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Document Number *</label>
              <input
                type="text"
                value={docNumber}
                onChange={e => setDocNumber(e.target.value)}
                placeholder="e.g. XXXX XXXX XXXX"
                className="form-input w-full uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Document Photo *</label>
              <p className="text-xs text-gray-500 mb-3">Clear photo lein — text readable hona chahiye. Max 5MB, JPG/PNG/WebP.</p>

              {frontPreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-red-200">
                  <img src={frontPreview} alt="Document preview" className="w-full max-h-48 object-contain bg-gray-50" />
                  <button
                    type="button"
                    onClick={() => { setFrontFile(null); setFrontPreview(null); }}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold border-none cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-600">Photo upload karein</span>
                  <span className="text-xs text-gray-400 mt-1">Click karein ya drag & drop</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>

            <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <FileText size={16} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                Aapke documents sirf identity verification ke liye use honge aur securely store kiye jaayenge. Yeh kisi third party ke saath share nahi kiye jaayenge.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={uploading}
              className="w-full py-3 font-bold"
            >
              {uploading ? 'Uploading...' : 'Submit for Verification'}
            </Button>
          </form>
        ) : (
          <div className="p-6">
            {submittedDoc?.documentType && (
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 mb-4">
                <FileText size={20} className="text-gray-500" />
                <div>
                  <p className="text-sm font-bold text-gray-700 capitalize">
                    {DOC_TYPES.find(d => d.value === submittedDoc.documentType)?.label || submittedDoc.documentType}
                  </p>
                  <p className="text-xs text-gray-500">{submittedDoc.documentNumber}</p>
                </div>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => navigate('/settings')}>
              Settings par wapas jaayein
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KYC;
