import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import { useNotificationContext } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Home, MoreVertical, ArrowLeft, Smile, Send } from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, orderBy, query, doc, getDoc, writeBatch } from 'firebase/firestore';

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
      ? <img src={person.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; }} />
      : initials(person?.name)
    }
  </div>
);

const Chat = () => {
  const { chats, profiles, sendMessage } = useAppContext();
  const { currentUser, userProfile } = useAuthContext();
  const { sendNotification } = useNotificationContext();
  const navigate = useNavigate();

  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [fetchedProfiles, setFetchedProfiles] = useState({});
  const [readChatIds, setReadChatIds] = useState(new Set());
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

  // Subscribe to messages
  useEffect(() => {
    if (!activeChatId) {
      setMessages(prev => prev.length ? [] : prev); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    const q = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [activeChatId]);

  // Batch-mark received messages as read when chat is open
  useEffect(() => {
    if (!activeChatId || !currentUser || !messages.length) return;
    const unread = messages.filter(m => m.senderId !== currentUser.uid && m.status !== 'read');
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach(m => batch.update(doc(db, 'chats', activeChatId, 'messages', m.id), { status: 'read' }));
    batch.commit().catch(() => {});
  }, [activeChatId, messages, currentUser]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setTimeout(() => inputRef.current?.focus(), 150);
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
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.gold, padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {!messages.length && (
                <div style={{ textAlign: 'center', color: T.ts, margin: '2rem 0', fontSize: '0.875rem' }}>
                  {otherUser?.name || 'User'} ko pehla message bhejein!
                </div>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
