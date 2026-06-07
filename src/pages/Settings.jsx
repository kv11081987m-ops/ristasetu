import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import {
  LogOut, User, ChevronRight, Shield, Trash2, HelpCircle, ExternalLink,
  AlertTriangle, X, Loader2, Lock, Copy, Check, Eye, EyeOff, Camera,
  FileText, Users, UserPlus, Trash, Zap, Bell,
} from 'lucide-react';
import BiodataDownloadButton from '../components/BiodataDownloadButton';
import ProfileAnalytics from '../components/ProfileAnalytics';
import StreakDisplay from '../components/StreakDisplay';
import { validateImageFile, uploadToCloudinary } from '../utils/uploadUtils';
import { auth, db } from '../firebase/firebaseConfig';
import {
  signOut, deleteUser,
  EmailAuthProvider, linkWithCredential,
  reauthenticateWithCredential, updatePassword,
} from 'firebase/auth';
import {
  doc, deleteDoc, getDocs, updateDoc, setDoc,
  collection, query, where, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { hashPassword } from '../utils/cryptoUtils';
import { useNavigate, Link } from 'react-router-dom';

// ── Family Access Modal ───────────────────────────────────────────────────────
const FamilyAccessModal = ({ onClose, currentUser }) => {
  const RELATIONS = ['Father/Pita', 'Mother/Mata', 'Brother/Bhai', 'Sister/Bahen', 'Uncle/Chacha', 'Aunt/Chachi', 'Other'];
  const [name, setName] = useState('');
  const [relation, setRelation] = useState(RELATIONS[0]);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('10 digit mobile number chahiye.'); return; }
    if (!name.trim()) { setError('Naam dalna zaroori hai.'); return; }
    setLoading(true); setError('');
    try {
      const normalizedPhone = `+91${digits}`;
      await setDoc(doc(db, 'family_access', normalizedPhone), {
        phone: normalizedPhone,
        linkedUserId: currentUser.uid,
        name: name.trim(),
        relation,
        status: 'active',
        addedAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch (err) {
      setError('Add karne mein error hua. Dobara try karein.');
      console.error(err);
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={24} className="text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Family Member Add Ho Gaya!</h3>
        <p className="text-sm text-gray-500 mb-4">
          Ab woh apne phone se OTP login karke aapka profile dekh sakenge.
        </p>
        <Button variant="primary" className="w-full" onClick={onClose}>Theek Hai</Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl"><UserPlus size={20} className="text-red-600" /></div>
              <h3 className="text-lg font-bold text-gray-900">Family Member Add Karein</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"><X size={20} /></button>
          </div>
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{error}</div>}
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Naam</label>
              <input type="text" className="form-input w-full" placeholder="e.g. Ramesh ji" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Rishta / Relation</label>
              <select className="form-input w-full" value={relation} onChange={e => setRelation(e.target.value)}>
                {RELATIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-500 shrink-0">+91</span>
                <input
                  type="tel" className="form-input flex-1" placeholder="9XXXXXXXXX"
                  value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Isi number se woh OTP login karenge</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button variant="primary" className="flex-1" type="submit" disabled={loading || !name || phone.replace(/\D/g,'').length !== 10}>
                {loading ? 'Adding...' : 'Add Karein'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Family Members List ───────────────────────────────────────────────────────
const FamilySection = ({ currentUser }) => {
  const [members, setMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    return onSnapshot(
      query(collection(db, 'family_access'), where('linkedUserId', '==', currentUser.uid)),
      (snap) => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [currentUser?.uid]);

  const toggleStatus = async (member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, 'family_access', member.id), { status: newStatus });
  };

  const removeMember = async (member) => {
    if (!window.confirm(`${member.name} ko remove karein?`)) return;
    await deleteDoc(doc(db, 'family_access', member.id));
  };

  return (
    <div>
      {showAddModal && <FamilyAccessModal onClose={() => setShowAddModal(false)} currentUser={currentUser} />}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-2">Family Access</h4>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors cursor-pointer border-none"
        >
          <UserPlus size={13} /> Add Family
        </button>
      </div>

      {members.length === 0 ? (
        <div
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-between p-4 bg-white rounded-xl border border-dashed border-gray-300 hover:border-red-300 hover:bg-red-50/30 transition-all cursor-pointer mb-3"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-gray-50 text-gray-400"><Users size={20} /></div>
            <div>
              <p className="font-bold text-sm text-gray-600">Family Access Den</p>
              <p className="text-xs text-gray-400">Pita, Mata ya koi family member ko invite karein</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </div>
      ) : (
        <div className="flex flex-col gap-2 mb-3">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Users size={16} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">{member.name}</p>
                <p className="text-xs text-gray-400">{member.relation} · {member.phone}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleStatus(member)}
                  className={`text-xs px-2 py-1 rounded-full font-semibold border-none cursor-pointer transition-colors ${
                    member.status === 'active'
                      ? 'bg-green-100 text-green-700 hover:bg-yellow-100 hover:text-yellow-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                  }`}
                >
                  {member.status === 'active' ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => removeMember(member)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-transparent border-none cursor-pointer"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50/30 transition-all cursor-pointer bg-transparent w-full"
          >
            <UserPlus size={15} /> Aur family member add karein
          </button>
        </div>
      )}
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const SettingsItem = ({ icon: ItemIcon, title, description, onClick, to, danger = false }) => {
  const content = (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all cursor-pointer group shadow-sm mb-3">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${danger ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600 group-hover:bg-primary group-hover:text-white transition-colors'}`}>
          <ItemIcon size={20} />
        </div>
        <div className="text-left">
          <p className={`font-bold text-sm ${danger ? 'text-red-600' : 'text-gray-800'}`}>{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
    </div>
  );

  if (to) return <Link to={to} className="block no-underline">{content}</Link>;
  return (
    <button onClick={onClick} className="w-full bg-transparent border-none p-0 text-inherit focus:outline-none">
      {content}
    </button>
  );
};

// ── Password modal (Set / Change) ────────────────────────────────────────
const PasswordModal = ({ mode, onClose }) => {
  const { currentUser, userProfile, setUserProfile } = useAuthContext();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Minimum 8 characters chahiye.'); return; }
    setLoading(true);
    setError('');
    try {
      const rsId = userProfile.ristaSetuId.toUpperCase();
      const virtualEmail = `${rsId.toLowerCase()}@ristasetu.app`;

      if (mode === 'set') {
        const pwHash = await hashPassword(newPassword);
        const credential = EmailAuthProvider.credential(virtualEmail, pwHash);
        await linkWithCredential(auth.currentUser, credential);
        await auth.currentUser.getIdToken(true);
        await Promise.all([
          updateDoc(doc(db, 'users', currentUser.uid), { hasPassword: true }),
          setDoc(doc(db, 'password_index', rsId), {
            uid: currentUser.uid,
            hasPassword: true,
            passwordHash: pwHash,
          }),
        ]);
        setUserProfile(prev => ({ ...prev, hasPassword: true }));
      } else {
        // 'change' mode — try SHA256 first, fallback to plaintext for migration
        const oldHash = await hashPassword(oldPassword);
        const newHash = await hashPassword(newPassword);

        try {
          await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(virtualEmail, oldHash));
        } catch (firstErr) {
          if (firstErr.code === 'auth/wrong-password' || firstErr.code === 'auth/invalid-credential') {
            // Migration fallback: user may have set password before SHA256 approach
            await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(virtualEmail, oldPassword));
          } else {
            throw firstErr;
          }
        }

        await updatePassword(auth.currentUser, newHash);
        await setDoc(doc(db, 'password_index', rsId), {
          uid: currentUser.uid,
          hasPassword: true,
          passwordHash: newHash,
        });
      }
      setSuccess(true);
    } catch (err) {
      console.error('PasswordModal error:', err.code, err.message);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Purana password galat hai.');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Logout karke dobara login karein, phir password change karein.');
      } else if (err.code === 'auth/provider-already-linked') {
        setError('Password pehle se set hai. "Password Change Karo" option use karein.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Password login enable nahi hai. Admin se contact karein: ristasetu@gmail.com');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error — internet check karein aur dobara try karein.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password bahut chhota hai — minimum 8 characters chahiye.');
      } else if (err.code === 'auth/email-already-in-use' || err.code === 'auth/credential-already-in-use') {
        setError(`Account conflict (${err.code}). Support: ristasetu@gmail.com`);
      } else {
        setError(`Kuch galat hua (${err.code || 'unknown'}). Dobara try karein.`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {mode === 'set' ? 'Password Set Ho Gaya!' : 'Password Change Ho Gaya!'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {mode === 'set'
              ? 'Ab aap RistaSetu ID + Password se bhi login kar sakte hain.'
              : 'Aapka naya password active ho gaya hai.'}
          </p>
          <Button variant="primary" className="w-full" onClick={onClose}>Theek Hai</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl">
                <Lock size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {mode === 'set' ? 'Password Set Karein' : 'Password Change Karein'}
              </h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'change' && (
              <div className="form-group">
                <label className="form-label">Purana Password</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    className="form-input w-full pr-10"
                    placeholder="Purana password dalein"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer" onClick={() => setShowOld(p => !p)}>
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Naya Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  className="form-input w-full pr-10"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer" onClick={() => setShowNew(p => !p)}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button
                variant="primary"
                className="flex-1"
                type="submit"
                disabled={loading || newPassword.length < 8 || (mode === 'change' && oldPassword.length < 1)}
              >
                {loading ? 'Saving...' : mode === 'set' ? 'Set Karo' : 'Change Karo'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Photos modal ─────────────────────────────────────────────────────────
const PhotosModal = ({ onClose }) => {
  const { currentUser, userProfile, setUserProfile } = useAuthContext();
  const [photoItems, setPhotoItems] = useState(() => {
    const existing = userProfile?.photos?.length > 0
      ? userProfile.photos
      : userProfile?.photoUrl ? [userProfile.photoUrl] : [];
    return existing.map(url => ({ type: 'existing', url }));
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const maxPhotos = userProfile?.isPremium ? 5 : 2;

  const handleAddPhoto = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    const newItems = [];
    for (const selected of files) {
      if (photoItems.length + newItems.length >= maxPhotos) {
        setError(`Free mein max ${maxPhotos} photos allowed hain. 💎 Premium mein upgrade karein.`);
        break;
      }
      const validationError = validateImageFile(selected);
      if (validationError) { setError(validationError); return; }
      newItems.push({ type: 'new', file: selected, preview: URL.createObjectURL(selected) });
    }
    if (newItems.length > 0) {
      setIsDirty(true);
      setSaved(false);
      setPhotoItems(prev => [...prev, ...newItems]);
      setError('');
    }
  };

  const handleRemovePhoto = (index) => {
    setIsDirty(true);
    setSaved(false);
    setPhotoItems(prev => {
      const item = prev[index];
      if (item.type === 'new') URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    if (photoItems.length === 0) { setError('Kam se kam ek photo zaroori hai.'); return; }
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const photoUrls = await Promise.all(
        photoItems.map(item =>
          item.type === 'existing' ? Promise.resolve(item.url) : uploadToCloudinary(item.file)
        )
      );
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photos: photoUrls,
        photoUrl: photoUrls[0],
      });
      setUserProfile(prev => ({ ...prev, photos: photoUrls, photoUrl: photoUrls[0] }));
      // Mark all items as existing so further edits detect new changes correctly
      setPhotoItems(photoUrls.map(url => ({ type: 'existing', url })));
      setIsDirty(false);
      setSaved(true);
    } catch (err) {
      setError('Save karne mein error. Dobara try karein.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl">
                <Camera size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Manage Photos</h3>
                <p className="text-xs text-gray-400">{photoItems.length}/{maxPhotos} — pehli photo = main{!userProfile?.isPremium ? ' · 💎 Premium = 5' : ''}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{error}</div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-2">
            {photoItems.map((item, i) => (
              <div key={i} className={`relative aspect-square rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-red-500' : 'border-gray-200'}`}>
                <img
                  src={item.type === 'existing' ? item.url : item.preview}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-[9px] font-bold text-center py-0.5">MAIN</span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors leading-none"
                >
                  ×
                </button>
              </div>
            ))}
            {photoItems.length < maxPhotos && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-red-300 transition-colors">
                <input type="file" accept="image/*" multiple onChange={handleAddPhoto} className="hidden" />
                <span className="text-2xl text-gray-400 leading-none">+</span>
                <span className="text-[10px] text-gray-400 mt-1">Add Photo</span>
              </label>
            )}
          </div>

          <p className="text-[10px] text-gray-400 mb-4">JPG, PNG ya WebP — max 5MB each</p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button
              variant="primary"
              className="flex-1 transition-all"
              style={(saved && !isDirty) ? { backgroundColor: '#16A34A', borderColor: '#16A34A' } : {}}
              onClick={handleSave}
              disabled={saving || !isDirty || photoItems.length === 0}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" />Saving...
                </span>
              ) : (saved && !isDirty) ? 'Saved ✓' : 'Save Karo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Delete confirmation modal ─────────────────────────────────────────────
const DeleteAccountModal = ({ onConfirm, onCancel, isDeleting, error }) => (
  <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          This will <strong>permanently delete</strong> your account and all associated data:
        </p>
        <ul className="text-sm text-gray-600 space-y-1 mb-4 ml-4 list-disc">
          <li>Your profile and photos</li>
          <li>All interests sent and received</li>
          <li>Your shortlisted profiles</li>
          <li>All notifications</li>
        </ul>
        <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg mb-4">
          This action is irreversible and cannot be undone.
        </p>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}
      </div>

      <div className="px-6 pb-6 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <><Loader2 size={16} className="animate-spin" /> Deleting...</>
          ) : (
            <><Trash2 size={16} /> Yes, Delete</>
          )}
        </button>
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────
const Settings = () => {
  const { currentUser, userProfile } = useAuthContext();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [copied, setCopied] = useState(false);
  // null = follow userProfile value; non-null = user just toggled (optimistic)
  const [smartMatchOverride, setSmartMatchOverride] = useState(null);
  const smartMatchAlerts = smartMatchOverride !== null
    ? smartMatchOverride
    : (userProfile?.smartMatchAlerts !== false);

  const handleSmartMatchToggle = async () => {
    if (!currentUser?.uid) return;
    const newVal = !smartMatchAlerts;
    setSmartMatchOverride(newVal);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { smartMatchAlerts: newVal });
    } catch {
      setSmartMatchOverride(!newVal);
    }
  };

  const handleCopyId = () => {
    if (!userProfile?.ristaSetuId) return;
    navigator.clipboard.writeText(userProfile.ristaSetuId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return;
    await signOut(auth);
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setIsDeleting(true);
    setDeleteError('');

    const uid = currentUser.uid;

    try {
      // 1. Delete all interests (sent + received)
      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(query(collection(db, 'interests'), where('senderId', '==', uid))),
        getDocs(query(collection(db, 'interests'), where('receiverId', '==', uid))),
      ]);
      const interestDeletions = [
        ...sentSnap.docs.map(d => deleteDoc(d.ref)),
        ...receivedSnap.docs.map(d => deleteDoc(d.ref)),
      ];

      // 2. Delete shortlists
      const shortlistSnap = await getDocs(
        query(collection(db, 'shortlists'), where('userId', '==', uid))
      );

      // 3. Delete notifications
      const notifSnap = await getDocs(
        query(collection(db, 'notifications'), where('userId', '==', uid))
      );

      // 4. Delete chats (and their messages subcollections)
      const chatsSnap = await getDocs(
        query(collection(db, 'chats'), where('participants', 'array-contains', uid))
      );
      const chatDeletions = [];
      for (const chatDoc of chatsSnap.docs) {
        const msgsSnap = await getDocs(collection(db, 'chats', chatDoc.id, 'messages'));
        msgsSnap.docs.forEach(m => chatDeletions.push(deleteDoc(m.ref)));
        chatDeletions.push(deleteDoc(chatDoc.ref));
      }

      await Promise.all([
        ...interestDeletions,
        ...shortlistSnap.docs.map(d => deleteDoc(d.ref)),
        ...notifSnap.docs.map(d => deleteDoc(d.ref)),
        ...chatDeletions,
      ]);

      // 4. Delete Firestore profile document
      await deleteDoc(doc(db, 'users', uid));

      // 5. Delete Firebase Auth user (must be last — after this, rules won't work)
      await deleteUser(currentUser);

      // Auth state change will auto-redirect via AuthContext
      navigate('/splash');

    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setDeleteError(
          'Security check failed. Please log out and log back in, then try deleting again.'
        );
      } else {
        setDeleteError('Something went wrong. Please try again.');
        console.error('Delete account error:', err);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 page-transition max-w-2xl">
      {showPasswordModal && (
        <PasswordModal
          mode={userProfile?.hasPassword ? 'change' : 'set'}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
      {showPhotosModal && (
        <PhotosModal onClose={() => setShowPhotosModal(false)} />
      )}
      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => { setShowDeleteModal(false); setDeleteError(''); }}
          isDeleting={isDeleting}
          error={deleteError}
        />
      )}

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Settings</h2>
        <p className="text-gray-500">Manage your profile and account preferences</p>
      </div>

      {/* Premium Upgrade Banner */}
      {!userProfile?.isPremium && (
        <div
          onClick={() => navigate('/premium')}
          className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-3 cursor-pointer hover:opacity-90 transition-opacity shadow-md"
          style={{ background: 'linear-gradient(135deg, #8B1A2F, #5C0E1E)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">💎</span>
            <div>
              <p className="text-white font-black text-sm">RistaSetu Premium Upgrade Karein</p>
              <p className="text-white/70 text-xs mt-0.5">Unlimited interests · Verified badge · Profile boost</p>
            </div>
          </div>
          <div className="shrink-0 px-3 py-1.5 rounded-full text-xs font-black"
               style={{ background: '#D4AF37', color: '#7A4F00' }}>
            Plans Dekho →
          </div>
        </div>
      )}

      {/* Profile Overview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8 flex flex-col items-center text-center">
        <div className="relative w-20 h-20 mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/10 p-1">
            <img
              src={userProfile?.photoUrl || 'https://placehold.co/80x80/png?text=User'}
              alt={userProfile?.name}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          {(userProfile?.photos?.length > 0 || userProfile?.photoUrl) && (
            <button
              onClick={() => setShowPhotosModal(true)}
              className="absolute bottom-0 right-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center border-2 border-white cursor-pointer hover:bg-red-700 transition-colors"
              title="Manage Photos"
            >
              <Camera size={11} />
            </button>
          )}
        </div>
        <h3 className="font-bold text-xl text-gray-800">{userProfile?.name}</h3>
        <p className="text-gray-500 text-sm">{userProfile?.phone || userProfile?.email}</p>
        {userProfile?.ristaSetuId && (
          <div className="mt-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-400">Aapki RistaSetu ID:</span>
            <span className="font-mono font-bold text-sm text-gray-800">{userProfile.ristaSetuId}</span>
            <button
              onClick={handleCopyId}
              className="text-gray-400 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer p-0.5"
              title="Copy ID"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Login Streak */}
      <StreakDisplay userProfile={userProfile} />

      {/* Meri Analytics */}
      <div className="mb-8">
        <ProfileAnalytics />
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-2">Profile</h4>
          <SettingsItem
            icon={User}
            title="Edit Profile"
            description="Update your personal details, age, and location"
            to="/complete-profile"
          />
          <SettingsItem
            icon={Camera}
            title="Manage Photos"
            description={`Profile photos edit karein — abhi ${userProfile?.photos?.length || (userProfile?.photoUrl ? 1 : 0)}/5 photos hain`}
            onClick={() => setShowPhotosModal(true)}
          />
          <SettingsItem
            icon={Lock}
            title={userProfile?.hasPassword ? 'Password Change Karo' : 'Password Set Karo'}
            description={userProfile?.hasPassword ? 'RistaSetu ID login ka password badlein' : 'RS ID se login ke liye password banayein'}
            onClick={() => setShowPasswordModal(true)}
          />
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm mb-3">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-gray-50 text-gray-600">
                <FileText size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-gray-800">Download Biodata</p>
                <p className="text-xs text-gray-500">Apna vivah biodata PDF mein download karein</p>
              </div>
            </div>
            {userProfile && (
              <BiodataDownloadButton
                profile={{ ...userProfile, id: currentUser?.uid }}
                showContact={true}
              />
            )}
          </div>
          <SettingsItem
            icon={Shield}
            title="KYC Verification"
            description={
              userProfile?.kycStatus === 'verified' ? 'Verified — Identity confirmed' :
              userProfile?.kycStatus === 'submitted' ? 'Documents submitted — Review pending' :
              'Upload government ID to get verified'
            }
            to="/kyc"
          />
        </div>

        {/* Notifications Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-2">Notifications</h4>
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm mb-3">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-green-50">
                <Bell size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">Naye Match Alerts</p>
                <p className="text-xs text-gray-500">Naya compatible user join kare toh notify karo</p>
              </div>
            </div>
            <button
              onClick={handleSmartMatchToggle}
              aria-label="Toggle smart match alerts"
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none border-none cursor-pointer"
              style={{ background: smartMatchAlerts ? '#16A34A' : '#D1D5DB' }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
                style={{ transform: smartMatchAlerts ? 'translateX(24px)' : 'translateX(4px)' }}
              />
            </button>
          </div>
        </div>

        {/* Kisne Dekha — locked for free users */}
        {!userProfile?.isPremium && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-gray-500" />
                <p className="font-bold text-sm text-gray-800">Kisne Dekha Aapka Profile</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
                    style={{ background: '#FFFBEC', color: '#92610A', border: '1px solid #D4AF37' }}>
                💎 Premium
              </span>
            </div>
            {/* Blurred fake viewer avatars */}
            <div className="relative h-12 mb-3">
              <div className="flex gap-1.5 overflow-hidden">
                {['#F87171','#60A5FA','#34D399','#FBBF24','#A78BFA'].map((c, i) => (
                  <div key={i} className="w-10 h-10 rounded-full shrink-0 opacity-60 blur-[3px]" style={{ background: c }} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                  <Lock size={13} className="text-gray-400" />
                  <p className="text-xs text-gray-500 font-semibold">Premium mein unlock hoga</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/premium')}
              className="w-full text-xs font-bold py-2 rounded-lg border-none cursor-pointer transition-colors"
              style={{ background: '#FDF2F4', color: '#8B1A2F', border: '1px solid #FECDD3' }}
            >
              💎 Premium mein Upgrade Karein
            </button>
          </div>
        )}

        {/* Profile Boost */}
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm mb-3">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-amber-50"><Zap size={20} className="text-amber-600" /></div>
            <div>
              <p className="font-bold text-sm text-gray-800">Profile Boost Karo</p>
              <p className="text-xs text-gray-500">Search mein top pe aao — Silver/Gold mein</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/premium')}
            className="text-xs font-bold px-3 py-1.5 rounded-full border-none cursor-pointer"
            style={{ background: '#FFFBEC', color: '#92610A', border: '1px solid #D4AF37' }}
          >
            💎 Boost
          </button>
        </div>

        {/* Family Access Section */}
        <div>
          <FamilySection currentUser={currentUser} />
        </div>

        {/* Support Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-2">Support</h4>
          <SettingsItem
            icon={HelpCircle}
            title="Contact Support"
            description="ristasetu@gmail.com — Account ya kisi issue ke liye"
            onClick={() => window.open('mailto:ristasetu@gmail.com?subject=RistaSetu Support Request', '_blank')}
          />
          <SettingsItem
            icon={ExternalLink}
            title="Hamare Baare Mein"
            description="RistaSetu ke mission aur team ke baare mein jaanein"
            to="/about"
          />
          <SettingsItem
            icon={ExternalLink}
            title="Disclaimer"
            description="Platform ki zimmedari aur kanuni sthiti padhein"
            to="/disclaimer"
          />
          <SettingsItem
            icon={ExternalLink}
            title="Privacy Policy"
            description="Read how we handle your data"
            to="/about#privacy"
          />
          <SettingsItem
            icon={ExternalLink}
            title="Terms of Service"
            description="Rules and conditions for using RistaSetu"
            to="/about#terms"
          />
        </div>

        {/* Account Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-2">Account</h4>
          <SettingsItem
            icon={LogOut}
            title="Logout"
            description="Sign out of your account on this device"
            onClick={handleLogout}
          />
        </div>

        {/* Danger Zone */}
        <div className="pt-6 border-t">
          <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-4 px-2">Danger Zone</h4>
          <SettingsItem
            icon={Trash2}
            title="Delete Account"
            description="Permanently remove your account and all data"
            danger={true}
            onClick={() => setShowDeleteModal(true)}
          />
        </div>
      </div>

      <div className="mt-12 text-center text-gray-400 text-xs">
        <p>RistaSetu v1.0.4</p>
        <p className="mt-1">&copy; 2026 RistaSetu Matrimony Services</p>
      </div>
    </div>
  );
};

export default Settings;
