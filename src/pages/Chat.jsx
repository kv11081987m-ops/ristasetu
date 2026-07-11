import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import { useNotificationContext } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Home, MoreVertical, ArrowLeft, Smile, Send, X } from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, orderBy, query, doc, getDoc, getDocs, writeBatch, limit, startAfter } from 'firebase/firestore';
import { ICEBREAKER_CATEGORIES, getSmartSuggestions } from '../utils/icebreakerQuestions';
import { initiateShaadi, confirmShaadi, declineShaadi, submitSuccessStory } from '../utils/shaadiUtils';
import { uploadToCloudinary } from '../utils/uploadUtils';
import { cloudinaryThumb } from '../utils/cloudinaryUrl';

const T = {
  bg: '#2D1B5E',
  panel: '#1A0D3D',
  sent: '#5C2D8F',
  received: '#3D2470',
  recvBorder: '#6B4AAF',
  gold: '#C9A84C',
  text: '#F0E8FF',
  ts: 'rgba(200,180,255,0.55)',
  inputBg: '#3D2470',
  ph: '#9B7ED4',
  divBg: 'rgba(255,255,255,0.07)',
  divText: '#9B7ED4',
  border: 'rgba(107,74,175,0.3)',
};

const fmtTime = (ts) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (ts) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const fmtLast = (ts) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
};

const initials = (name) =>
  (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const MSG_PAGE_SIZE = 50;

const SingleTick = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
    <path d="M1 5L5 9L13 1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DoubleTick = ({ color }) => (
  <svg width="18" height="10" viewBox="0 0 18 10" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
    <path d="M1 5L5 9L13 1" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 5L9 9L17 1" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MsgTick = ({ status }) =>
  status === 'read' ? <DoubleTick color="#4ADE80" /> : <SingleTick />;

const Avatar = ({ person, size = 48, fs = '1rem' }) => (
  <div style={{
    width: size, height: size, minWidth: size, borderRadius: '50%',
    background: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', color: '#1A0D3D', fontSize: fs, overflow: 'hidden', flexShrink: 0,
  }}>
    {person?.photoUrl
      ? <img src={cloudinaryThumb(person.photoUrl, size * 2)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; }} />
      : initials(person?.name)
    }
  </div>
);

// ── Icebreaker full-screen panel ──────────────────────────────────────────────
const IcebreakerPanel = ({ onSelect, onClose, myProfile, otherUser }) => {
  const smartSuggestions = getSmartSuggestions(myProfile, otherUser);
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1A0D3D',
          border: `1px solid ${T.border}`,
          borderRadius: '1.25rem 1.25rem 0 0',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Panel header */}
        <div style={{
          padding: '1rem 1.25rem 0.875rem',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ color: T.gold, fontWeight: 'bold', fontSize: '1rem' }}>
              💌 Icebreaker Sawaal
            </div>
            <div style={{ color: T.ts, fontSize: '0.75rem', marginTop: '2px' }}>
              Koi bhi sawaal click karein — seedha message box mein jayega
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.ph, padding: '0.25rem', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Smart suggestions */}
          {smartSuggestions.length > 0 && (
            <div>
              <div style={{ color: T.gold, fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
                ✨ AAPKE LIYE KHAAS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {smartSuggestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(q)}
                    style={{
                      background: 'rgba(201,168,76,0.08)',
                      border: `1px solid rgba(201,168,76,0.3)`,
                      borderRadius: '0.625rem',
                      padding: '0.6rem 0.875rem',
                      color: T.text,
                      fontSize: '0.85rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      lineHeight: 1.4,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.16)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All categories */}
          {ICEBREAKER_CATEGORIES.map(cat => (
            <div key={cat.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1rem' }}>{cat.emoji}</span>
                <span style={{ color: cat.color, fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.08em' }}>
                  {cat.label.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {cat.questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(q)}
                    style={{
                      background: cat.bg,
                      border: `1px solid ${cat.color}30`,
                      borderRadius: '0.625rem',
                      padding: '0.55rem 0.875rem',
                      color: T.text,
                      fontSize: '0.825rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      lineHeight: 1.4,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = cat.color + '20'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = cat.bg; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ height: '0.5rem' }} />
        </div>
      </div>
    </div>
  );
};

// ── Inline icebreaker section (shown when 0 messages) ────────────────────────
const IcebreakerSection = ({ otherUser, myProfile, onSelect, onShowAll }) => {
  const suggestions = getSmartSuggestions(myProfile, otherUser);
  // Picked once at mount — stable across re-renders. Indexed off the
  // category/question array lengths (not hardcoded counts) so editing
  // ICEBREAKER_CATEGORIES can never produce an undefined button.
  const [quickQ] = useState(() => {
    const firstCat = ICEBREAKER_CATEGORIES[0];
    const lastCat = ICEBREAKER_CATEGORIES[ICEBREAKER_CATEGORIES.length - 1];
    const pickRandom = (cat) => cat?.questions?.length
      ? cat.questions[Math.floor(Math.random() * cat.questions.length)]
      : null;
    return [pickRandom(firstCat), pickRandom(lastCat)].filter(Boolean);
  });

  return (
    <div style={{
      margin: '1rem 0',
      background: 'rgba(201,168,76,0.06)',
      border: `1px solid rgba(201,168,76,0.2)`,
      borderRadius: '1rem',
      padding: '1.25rem',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>💌</div>
        <div style={{ color: T.gold, fontWeight: 'bold', fontSize: '0.95rem' }}>
          Naya Rishta, Nai Shuruaat!
        </div>
        <div style={{ color: T.ts, fontSize: '0.775rem', marginTop: '3px' }}>
          {otherUser?.name || 'Is shaqs'} ko pehla message bhejne mein madad chahiye?
        </div>
      </div>

      {/* Smart suggestions */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ color: T.gold, fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
            ✨ AAPKE LIYE
          </div>
          {suggestions.map((q, i) => (
            <button
              key={i}
              onClick={() => onSelect(q)}
              style={{
                display: 'block', width: '100%',
                background: 'rgba(201,168,76,0.1)',
                border: `1px solid rgba(201,168,76,0.25)`,
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                color: T.text,
                fontSize: '0.8rem',
                textAlign: 'left',
                cursor: 'pointer',
                marginBottom: '0.4rem',
                lineHeight: 1.4,
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Quick starters */}
      <div style={{ marginBottom: '0.875rem' }}>
        <div style={{ color: T.ph, fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
          SAWAAL SE SHURU KAREIN
        </div>
        {quickQ.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            style={{
              display: 'block', width: '100%',
              background: T.received,
              border: `1px solid ${T.recvBorder}`,
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              color: T.text,
              fontSize: '0.8rem',
              textAlign: 'left',
              cursor: 'pointer',
              marginBottom: '0.4rem',
              lineHeight: 1.4,
            }}
          >
            {q}
          </button>
        ))}
      </div>

      <button
        onClick={onShowAll}
        style={{
          display: 'block', width: '100%',
          background: 'none',
          border: `1px solid ${T.border}`,
          borderRadius: '0.5rem',
          padding: '0.5rem',
          color: T.gold,
          fontSize: '0.8rem',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Aur sawaal dekhein →
      </button>
    </div>
  );
};

const Chat = () => {
  const { chats, profiles, sendMessage } = useAppContext();
  const { currentUser, userProfile } = useAuthContext();
  const { sendNotification } = useNotificationContext();
  const navigate = useNavigate();

  const [activeChatId, setActiveChatId] = useState(null);
  // Live window = most recent MSG_PAGE_SIZE messages, kept in real time.
  // Older pages are fetched once (not live) as the user scrolls back.
  const [liveMessages, setLiveMessages] = useState([]);
  const [olderMessages, setOlderMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState('');
  const [fetchedProfiles, setFetchedProfiles] = useState({});
  const [readChatIds, setReadChatIds] = useState(new Set());
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const [shaadiRequest, setShaadiRequest] = useState(null);
  const [showShaadiModal, setShowShaadiModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyPhotoFile, setStoryPhotoFile] = useState(null);
  const [storyIsPublic, setStoryIsPublic] = useState(true);
  const [storySubmitting, setStorySubmitting] = useState(false);
  const [storyDone, setStoryDone] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const myChats = currentUser
    ? chats.filter(c => c.participants?.includes(currentUser.uid))
    : [];

  const sortedChats = [...myChats].sort((a, b) => {
    const ta = a.lastMessageAt?.toMillis?.() ?? (a.lastMessageAt?.seconds ? a.lastMessageAt.seconds * 1000 : 0);
    const tb = b.lastMessageAt?.toMillis?.() ?? (b.lastMessageAt?.seconds ? b.lastMessageAt.seconds * 1000 : 0);
    return tb - ta;
  });

  const activeChat = myChats.find(c => c.id === activeChatId);
  const findProfile = (id) => profiles.find(p => p.id === id) || fetchedProfiles[id];
  const otherUser = activeChat?.participants
    ? findProfile(activeChat.participants.find(id => id !== currentUser?.uid))
    : null;

  // Fetch partner profiles not in the 200-profile snapshot
  useEffect(() => {
    if (!currentUser || !myChats.length) return;
    const missing = myChats
      .map(c => c.participants.find(id => id !== currentUser.uid))
      .filter(id => id && !profiles.find(p => p.id === id) && !fetchedProfiles[id]);
    if (!missing.length) return;
    Promise.all(missing.map(async id => {
      const s = await getDoc(doc(db, 'users', id));
      return s.exists() ? { id: s.id, ...s.data() } : null;
    })).then(res => {
      const map = {};
      res.forEach(p => { if (p) map[p.id] = p; });
      setFetchedProfiles(prev => ({ ...prev, ...map }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myChats.length, profiles.length]);

  // Subscribe to shaadi_request for active chat
  useEffect(() => {
    if (!activeChatId) {
      setShaadiRequest(prev => prev ? null : prev); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    return onSnapshot(doc(db, 'shaadi_requests', activeChatId), snap => {
      setShaadiRequest(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, [activeChatId]);

  // Subscribe to the most recent MSG_PAGE_SIZE messages, live.
  useEffect(() => {
    setOlderMessages(prev => prev.length ? [] : prev); // eslint-disable-line react-hooks/set-state-in-effect
    setHasMoreMessages(prev => prev ? prev : true);
    if (!activeChatId) {
      setLiveMessages(prev => prev.length ? [] : prev);
      return;
    }
    const q = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(MSG_PAGE_SIZE)
    );
    let sawFirstSnapshot = false;
    return onSnapshot(q, snap => {
      setLiveMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
      // Only the initial snapshot should decide "is there more history?" —
      // later re-emissions (new messages arriving) reflect the same window
      // size regardless of how much older history has already been loaded.
      if (!sawFirstSnapshot) {
        sawFirstSnapshot = true;
        setHasMoreMessages(snap.docs.length >= MSG_PAGE_SIZE);
      }
    });
  }, [activeChatId]);

  // Combined view: previously-loaded history + the live recent window.
  const messages = useMemo(() => [...olderMessages, ...liveMessages], [olderMessages, liveMessages]);

  const handleLoadOlderMessages = async () => {
    if (!activeChatId || loadingOlder || !hasMoreMessages) return;
    const oldest = olderMessages[0] || liveMessages[0];
    if (!oldest?.timestamp) return;
    setLoadingOlder(true);
    try {
      const q = query(
        collection(db, 'chats', activeChatId, 'messages'),
        orderBy('timestamp', 'desc'),
        startAfter(oldest.timestamp),
        limit(MSG_PAGE_SIZE)
      );
      const snap = await getDocs(q);
      const page = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
      setOlderMessages(prev => [...page, ...prev]);
      if (snap.docs.length < MSG_PAGE_SIZE) setHasMoreMessages(false);
    } catch (e) {
      console.error('Load older messages error:', e);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Batch-mark received messages as read when chat is open
  useEffect(() => {
    if (!activeChatId || !currentUser || !messages.length) return;
    const unread = messages.filter(m => m.senderId !== currentUser.uid && m.status !== 'read');
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach(m => batch.update(doc(db, 'chats', activeChatId, 'messages', m.id), { status: 'read' }));
    batch.commit().catch(() => {});
  }, [activeChatId, messages, currentUser]);

  // Auto-scroll on new live messages only — NOT when older history loads,
  // which would otherwise yank the view back down while scrolling up.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages]);

  // Group messages by date for dividers
  const grouped = useMemo(() => {
    const out = [];
    let lastDs = null;
    messages.forEach(msg => {
      const ts = msg.timestamp?.toDate?.() ? msg.timestamp.toDate() : (msg.timestamp ? new Date(msg.timestamp) : null);
      const ds = ts?.toDateString();
      if (ds && ds !== lastDs) {
        out.push({ type: 'div', ts, key: `d-${ds}` });
        lastDs = ds;
      }
      out.push({ type: 'msg', data: msg, key: msg.id });
    });
    return out;
  }, [messages]);

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setReadChatIds(prev => new Set([...prev, id]));
    setShowIcebreaker(false);
    setShowShaadiModal(false);
    setShowStoryModal(false);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const handleIcebreakerSelect = (question) => {
    setText(question);
    setShowIcebreaker(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleInitiateShaadi = async () => {
    if (!activeChatId || !otherUser?.id) return;
    try {
      await initiateShaadi(activeChatId, currentUser.uid, otherUser.id);
      sendNotification(otherUser.id, 'shaadi_request', userProfile?.name, userProfile?.photoUrl || null, 'ne shaadi confirm ki request bheji hai 💍').catch(() => {});
      setShowShaadiModal(false);
    } catch (e) { console.error('Shaadi initiate error:', e); }
  };

  const handleConfirmShaadi = async () => {
    if (!activeChatId || !otherUser?.id) return;
    try {
      await confirmShaadi(activeChatId);
      sendNotification(currentUser.uid, 'shaadi_confirmed', 'RistaSetu', null, '💍 Mubarak ho! Aapki shaadi RistaSetu se confirm hui!').catch(() => {});
      sendNotification(otherUser.id, 'shaadi_confirmed', 'RistaSetu', null, '💍 Mubarak ho! Aapki shaadi RistaSetu se confirm hui!').catch(() => {});
      setShowStoryModal(true);
    } catch (e) { console.error('Confirm shaadi error:', e); }
  };

  const handleDeclineShaadi = async () => {
    if (!activeChatId) return;
    try { await declineShaadi(activeChatId); } catch (e) { console.error(e); }
  };

  const handleSubmitStory = async () => {
    if (!storyText.trim()) return;
    setStorySubmitting(true);
    try {
      let photoUrl = null;
      if (storyPhotoFile) photoUrl = await uploadToCloudinary(storyPhotoFile);
      await submitSuccessStory({
        userId1: currentUser.uid,
        userId2: otherUser?.id || '',
        name1: userProfile?.name || '',
        name2: otherUser?.name || '',
        city: userProfile?.city || '',
        year: new Date().getFullYear(),
        story: storyText.trim(),
        photoUrl,
        isPublic: storyIsPublic,
      });
      setStoryDone(true);
    } catch (e) { console.error(e); } finally { setStorySubmitting(false); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || !activeChatId) return;
    setText('');
    try {
      await sendMessage(activeChatId, msg, currentUser.uid);
      if (otherUser?.id) {
        sendNotification(otherUser.id, 'message', userProfile?.name || 'Someone', userProfile?.photoUrl || null, msg, { chatId: activeChatId })
          .catch(() => {});
      }
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!myChats.length) {
    return (
      <div className="page-transition" style={{ background: T.bg, minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: '1rem', padding: '3rem 2rem', textAlign: 'center', maxWidth: '380px', width: '100%' }}>
          <MessageSquare size={48} style={{ color: T.gold, margin: '0 auto 1rem' }} />
          <h2 style={{ color: T.text, fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Koi active chat nahi</h2>
          <p style={{ color: T.ts, marginBottom: '2rem', fontSize: '0.875rem' }}>Interest accept hone ke baad chat shuru ho sakti hai.</p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: T.gold, color: '#1A0D3D', fontWeight: 'bold', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Home size={16} /> Dashboard par jaayein
          </button>
        </div>
      </div>
    );
  }

  // ── Main layout ──────────────────────────────────────────────────────────
  return (
    <div
      className="page-transition"
      style={{ background: T.bg, height: 'calc(100vh - 140px)', display: 'flex', overflow: 'hidden' }}
    >

      {/* ── Chat List ──────────────────────────────────────────── */}
      <div
        className={`${activeChatId ? 'hidden md:flex' : 'flex'} flex-col md:w-80 w-full`}
        style={{ background: T.panel, borderRight: `1px solid ${T.border}`, flexShrink: 0, overflow: 'hidden' }}
      >
        <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <h3 style={{ color: T.text, fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>Matches</h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sortedChats.map(chat => {
            const pid = chat.participants.find(id => id !== currentUser.uid);
            const partner = findProfile(pid);
            const isActive = activeChatId === chat.id;
            const hasUnread = !readChatIds.has(chat.id)
              && chat.lastMessageSenderId
              && chat.lastMessageSenderId !== currentUser.uid;
            return (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                style={{
                  background: isActive ? T.bg : 'transparent',
                  padding: '0.75rem 1rem',
                  borderBottom: 'rgba(107,74,175,0.15) 1px solid',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'background 0.15s ease',
                }}
              >
                <Avatar person={partner} size={44} fs="0.875rem" />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ color: T.text, fontWeight: hasUnread ? 700 : 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                      {partner?.name || 'User'}
                    </span>
                    <span style={{ color: T.gold, fontSize: '0.65rem', flexShrink: 0 }}>
                      {fmtLast(chat.lastMessageAt)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: T.ts, fontSize: '0.775rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {chat.lastMessage || 'Chat shuru karein...'}
                    </span>
                    {hasUnread && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.gold, marginLeft: 6, flexShrink: 0 }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Chat Area ─────────────────────────────────────────── */}
      <div
        className={`${!activeChatId ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-hidden`}
        style={{ background: T.bg }}
      >
        {!activeChatId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ts, fontSize: '0.875rem' }}>
            Koi match select karein message karne ke liye
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ background: T.panel, padding: '0.75rem 1rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              <button
                className="md:hidden"
                onClick={() => setActiveChatId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.gold, padding: '0.25rem', display: 'flex', alignItems: 'center' }}
              >
                <ArrowLeft size={22} />
              </button>
              <Avatar person={otherUser} size={40} fs="0.85rem" />
              <div style={{ flex: 1 }}>
                <div style={{ color: T.text, fontWeight: 'bold', fontSize: '0.975rem', lineHeight: 1.2 }}>
                  {otherUser?.name || 'User'}
                </div>
                <div style={{ color: T.gold, fontSize: '0.65rem', marginTop: '1px' }}>Online</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {(!shaadiRequest || shaadiRequest.status === 'declined') && (
                  <button
                    onClick={() => setShowShaadiModal(true)}
                    title="Shaadi Confirm Karein"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, padding: '0.25rem', opacity: 0.8, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; }}
                  >
                    💍
                  </button>
                )}
                {shaadiRequest?.status === 'pending' && (
                  <span title="Shaadi request pending" style={{ fontSize: '1.1rem', opacity: 0.6 }}>💍⏳</span>
                )}
                {shaadiRequest?.status === 'confirmed' && (
                  <span title="Shaadi Confirmed!" style={{ fontSize: '1rem', color: T.gold, fontWeight: 'bold' }}>💍✓</span>
                )}
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.gold, padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {hasMoreMessages && messages.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 0.75rem' }}>
                  <button
                    onClick={handleLoadOlderMessages}
                    disabled={loadingOlder}
                    style={{
                      background: T.divBg, color: T.gold, border: `1px solid ${T.border}`,
                      borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 'bold',
                      cursor: loadingOlder ? 'default' : 'pointer', opacity: loadingOlder ? 0.6 : 1,
                    }}
                  >
                    {loadingOlder ? 'Load ho raha hai...' : '↑ Purane messages dekhein'}
                  </button>
                </div>
              )}
              {/* Shaadi confirmation banner */}
              {shaadiRequest?.status === 'pending' && shaadiRequest.initiatorId === currentUser?.uid && (
                <div style={{ margin: '0.75rem 0', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '0.875rem', padding: '0.875rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>💍</div>
                  <div style={{ color: T.gold, fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '3px' }}>Shaadi Confirm ki Request Bheji Gayi</div>
                  <div style={{ color: T.ts, fontSize: '0.75rem' }}>{otherUser?.name || 'Unka'} jawab aane tak intezaar karein...</div>
                </div>
              )}
              {shaadiRequest?.status === 'pending' && shaadiRequest.receiverId === currentUser?.uid && (
                <div style={{ margin: '0.75rem 0', background: 'rgba(212,175,55,0.1)', border: '1.5px solid rgba(212,175,55,0.5)', borderRadius: '0.875rem', padding: '1rem' }}>
                  <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>💍</div>
                    <div style={{ color: T.gold, fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '3px' }}>{otherUser?.name || 'Unka saathi'} ne shaadi confirm ki request bheji hai!</div>
                    <div style={{ color: T.ts, fontSize: '0.75rem' }}>Kya aap sehmat hain?</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleDeclineShaadi} style={{ flex: 1, background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5', borderRadius: '0.5rem', padding: '0.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                      ❌ Nahi
                    </button>
                    <button onClick={handleConfirmShaadi} style={{ flex: 1, background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.5)', color: T.gold, borderRadius: '0.5rem', padding: '0.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                      ✅ Haan
                    </button>
                  </div>
                </div>
              )}
              {shaadiRequest?.status === 'confirmed' && (
                <div style={{ margin: '0.75rem 0', background: 'linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.07))', border: '1.5px solid #D4AF37', borderRadius: '0.875rem', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '4px' }}>🎉</div>
                  <div style={{ color: T.gold, fontWeight: 'bold', fontSize: '0.9rem' }}>Mubarak ho! Aapki shaadi confirm hui!</div>
                  <div style={{ color: T.ts, fontSize: '0.75rem', marginTop: '3px' }}>RistaSetu ki taraf se dil ki gehraaiyon se badhai! 💍</div>
                  <button onClick={() => { setStoryDone(false); setShowStoryModal(true); }} style={{ marginTop: '0.75rem', background: T.gold, color: '#1A0D3D', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 1rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                    💌 Success Story Share Karein
                  </button>
                </div>
              )}

              {/* Icebreaker section — shown only when no messages exist */}
              {!messages.length && (
                <IcebreakerSection
                  otherUser={otherUser}
                  myProfile={userProfile}
                  onSelect={handleIcebreakerSelect}
                  onShowAll={() => setShowIcebreaker(true)}
                />
              )}
              {grouped.map(item => {
                if (item.type === 'div') {
                  return (
                    <div key={item.key} style={{ display: 'flex', justifyContent: 'center', margin: '0.75rem 0' }}>
                      <span style={{ background: T.divBg, color: T.divText, fontSize: '0.7rem', padding: '3px 12px', borderRadius: '20px' }}>
                        {fmtDate(item.ts)}
                      </span>
                    </div>
                  );
                }
                const msg = item.data;
                const isMe = msg.senderId === currentUser.uid;
                return (
                  <div key={item.key} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
                    <div style={{
                      background: isMe ? T.sent : T.received,
                      border: isMe ? 'none' : `1px solid ${T.recvBorder}`,
                      color: T.text,
                      padding: '0.5rem 0.75rem',
                      borderRadius: isMe ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                      maxWidth: '70%',
                      wordBreak: 'break-word',
                    }}>
                      <div style={{ fontSize: '0.925rem', lineHeight: 1.45 }}>{msg.text}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '3px' }}>
                        <span style={{ color: T.ts, fontSize: '0.65rem' }}>{fmtTime(msg.timestamp)}</span>
                        {isMe && <MsgTick status={msg.status} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              style={{ background: T.panel, padding: '0.75rem 1rem', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}
            >
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.ph, padding: '0.25rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <Smile size={22} />
              </button>
              {/* Icebreaker 💌 button */}
              <button
                type="button"
                onClick={() => setShowIcebreaker(true)}
                title="Icebreaker sawaal"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  lineHeight: 1,
                  padding: '0.2rem',
                  flexShrink: 0,
                  opacity: 0.85,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; }}
              >
                💌
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder="Message likhein..."
                value={text}
                onChange={e => setText(e.target.value)}
                className="placeholder:text-[#9B7ED4]"
                style={{
                  flex: 1,
                  background: T.inputBg,
                  color: T.text,
                  border: 'none',
                  borderRadius: '1.5rem',
                  padding: '0.625rem 1rem',
                  outline: 'none',
                  fontSize: '0.9rem',
                }}
              />
              <button
                type="submit"
                style={{
                  background: text.trim() ? T.gold : 'rgba(201,168,76,0.25)',
                  border: 'none',
                  cursor: text.trim() ? 'pointer' : 'default',
                  borderRadius: '50%',
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <Send size={18} style={{ color: text.trim() ? '#1A0D3D' : T.ph }} />
              </button>
            </form>

            {/* Shaadi confirm "are you sure?" modal */}
            {showShaadiModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowShaadiModal(false)}>
                <div onClick={e => e.stopPropagation()} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: '1.25rem', padding: '1.5rem', maxWidth: '340px', width: '100%', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💍</div>
                  <h3 style={{ color: T.text, fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Shaadi Confirm Karein</h3>
                  <p style={{ color: T.ts, fontSize: '0.825rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    Kya aap <strong style={{ color: T.gold }}>{otherUser?.name}</strong> ke saath shaadi ki taiyari confirm karna chahte hain?<br />
                    <span style={{ fontSize: '0.75rem' }}>Dono ki sehmat hone par hi profiles archive honge.</span>
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setShowShaadiModal(false)} style={{ flex: 1, background: 'none', border: `1px solid ${T.border}`, color: T.ts, borderRadius: '0.625rem', padding: '0.6rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      Nahi
                    </button>
                    <button onClick={handleInitiateShaadi} style={{ flex: 1, background: T.gold, color: '#1A0D3D', border: 'none', borderRadius: '0.625rem', padding: '0.6rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      Haan, Request Bhejo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success story form modal */}
            {showStoryModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: '1.25rem', padding: '1.5rem', maxWidth: '400px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                  {storyDone ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎊</div>
                      <h3 style={{ color: T.gold, fontWeight: 'bold', marginBottom: '0.5rem' }}>Story Submit Ho Gayi!</h3>
                      <p style={{ color: T.ts, fontSize: '0.8rem', marginBottom: '1rem' }}>Admin approve karne ke baad public ho jaayegi.</p>
                      <button onClick={() => setShowStoryModal(false)} style={{ background: T.gold, color: '#1A0D3D', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        Theek Hai
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>💌</div>
                        <h3 style={{ color: T.gold, fontWeight: 'bold', fontSize: '1rem' }}>Apni Success Story Share Karein</h3>
                        <p style={{ color: T.ts, fontSize: '0.75rem', marginTop: '3px' }}>RistaSetu se apna rishta kaise bana?</p>
                      </div>
                      <textarea
                        value={storyText}
                        onChange={e => setStoryText(e.target.value)}
                        placeholder="RistaSetu se humara rishta kaise hua..."
                        rows={4}
                        style={{ width: '100%', background: T.inputBg, color: T.text, border: `1px solid ${T.border}`, borderRadius: '0.625rem', padding: '0.75rem', fontSize: '0.875rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      />
                      <div style={{ marginTop: '0.75rem' }}>
                        <label style={{ color: T.ts, fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>
                          Photo upload karein (optional)
                        </label>
                        <input type="file" accept="image/*" onChange={e => setStoryPhotoFile(e.target.files[0] || null)} style={{ color: T.ts, fontSize: '0.75rem', width: '100%' }} />
                      </div>
                      <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <button
                          type="button"
                          onClick={() => setStoryIsPublic(p => !p)}
                          style={{ background: storyIsPublic ? T.gold : 'none', border: `1px solid ${T.gold}`, color: storyIsPublic ? '#1A0D3D' : T.gold, borderRadius: '999px', padding: '0.3rem 0.875rem', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}
                        >
                          {storyIsPublic ? '🌐 Public' : '🔒 Private'}
                        </button>
                        <span style={{ color: T.ts, fontSize: '0.72rem' }}>
                          {storyIsPublic ? 'Success Stories page pe dikhegi' : 'Sirf aapke liye'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                        <button onClick={() => setShowStoryModal(false)} style={{ flex: 1, background: 'none', border: `1px solid ${T.border}`, color: T.ts, borderRadius: '0.625rem', padding: '0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                          Skip
                        </button>
                        <button
                          onClick={handleSubmitStory}
                          disabled={!storyText.trim() || storySubmitting}
                          style={{ flex: 1, background: storyText.trim() && !storySubmitting ? T.gold : 'rgba(201,168,76,0.3)', color: '#1A0D3D', border: 'none', borderRadius: '0.625rem', padding: '0.6rem', cursor: storyText.trim() && !storySubmitting ? 'pointer' : 'default', fontWeight: 'bold', fontSize: '0.85rem' }}
                        >
                          {storySubmitting ? 'Submitting...' : 'Submit 💍'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Icebreaker full panel overlay */}
            {showIcebreaker && (
              <IcebreakerPanel
                onSelect={handleIcebreakerSelect}
                onClose={() => setShowIcebreaker(false)}
                myProfile={userProfile}
                otherUser={otherUser}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
