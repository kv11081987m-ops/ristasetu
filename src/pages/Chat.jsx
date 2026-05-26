import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Send, MessageSquare, Home } from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, orderBy, query, doc, getDoc } from 'firebase/firestore';
import Button from '../components/Button';

const formatTime = (ts) => {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
};

const Chat = () => {
  const { chats, profiles, sendMessage } = useAppContext();
  const { currentUser } = useAuthContext();
  const navigate = useNavigate();
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [fetchedProfiles, setFetchedProfiles] = useState({});
  const bottomRef = useRef(null);

  const myChats = currentUser ? chats.filter(c => c.participants?.includes(currentUser.uid)) : [];
  const activeChat = myChats.find(c => c.id === activeChatId);

  const findProfile = (id) => profiles.find(p => p.id === id) || fetchedProfiles[id];

  const otherUser = activeChat
    ? findProfile(activeChat.participants.find(id => id !== currentUser.uid))
    : null;

  // Fetch profiles of chat partners not in the 200-profile limit
  useEffect(() => {
    if (!currentUser || myChats.length === 0) return;
    const missingIds = myChats
      .map(c => c.participants.find(id => id !== currentUser.uid))
      .filter(id => id && !profiles.find(p => p.id === id) && !fetchedProfiles[id]);
    if (missingIds.length === 0) return;
    Promise.all(
      missingIds.map(async id => {
        const snap = await getDoc(doc(db, 'users', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
      })
    ).then(results => {
      const map = {};
      results.forEach(p => { if (p) map[p.id] = p; });
      setFetchedProfiles(prev => ({ ...prev, ...map }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myChats.length, profiles.length]);

  // Subscribe to messages subcollection
  useEffect(() => {
    if (!activeChatId) { setMessages(prev => prev.length ? [] : prev); return; } // eslint-disable-line react-hooks/set-state-in-effect
    const msgsQuery = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(msgsQuery, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [activeChatId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeChatId) return;
    sendMessage(activeChatId, text.trim(), currentUser.uid);
    setText('');
  };

  if (myChats.length === 0) {
    return (
      <div className="container page-transition" style={{ padding: '2rem 1rem' }}>
        <div className="bg-white border border-gray-100 p-12 rounded-2xl text-center shadow-sm">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-200 mb-4" />
          <h2 className="text-xl font-bold mb-2">Koi active chat nahi</h2>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">Interest accept hone ke baad chat shuru ho sakti hai.</p>
          <Button variant="primary" onClick={() => navigate('/dashboard')} className="flex items-center gap-2 mx-auto">
            <Home size={18} /> Dashboard par jaayein
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-transition" style={{ padding: '1rem', height: 'calc(100vh - 140px)', display: 'flex', gap: '1rem' }}>

      {/* Chat List Sidebar */}
      <div className={`w-full md:w-1/3 bg-surface border rounded-lg overflow-hidden flex-col shadow-sm ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b font-bold text-lg text-primary">Matches</div>
        <div className="flex-1 overflow-y-auto">
          {myChats.map(chat => {
            const partnerId = chat.participants.find(id => id !== currentUser.uid);
            const partner = findProfile(partnerId);
            return (
              <div
                key={chat.id}
                className="p-4 border-b cursor-pointer flex items-center gap-3 transition-colors"
                style={{ backgroundColor: activeChatId === chat.id ? '#F3F4F6' : 'transparent' }}
                onClick={() => setActiveChatId(chat.id)}
              >
                <img
                  src={partner?.photoUrl || 'https://placehold.co/48x48/png?text=U'}
                  alt=""
                  className="rounded-full object-cover border"
                  loading="lazy"
                  style={{ width: '48px', height: '48px', minWidth: '48px' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/48x48/png?text=U'; }}
                />
                <div className="flex-1 overflow-hidden">
                  <div className="font-bold">{partner?.name || 'User'}</div>
                  <div className="text-sm text-light truncate">{chat.lastMessage || 'Chat shuru karein...'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`w-full md:w-2/3 bg-surface border rounded-lg shadow-sm flex-col overflow-hidden ${!activeChatId ? 'hidden md:flex bg-gray-50 items-center justify-center' : 'flex'}`}>
        {!activeChatId ? (
          <div className="text-light">Koi match select karein message karne ke liye</div>
        ) : (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <button className="md:hidden border-none bg-transparent font-bold cursor-pointer text-primary" onClick={() => setActiveChatId(null)}>← Wapas</button>
              <img
                src={otherUser?.photoUrl || 'https://placehold.co/40x40/png?text=U'}
                alt=""
                className="rounded-full object-cover"
                loading="lazy"
                style={{ width: '40px', height: '40px' }}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/40x40/png?text=U'; }}
              />
              <div className="font-bold">{otherUser?.name || 'User'}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" style={{ background: '#F9FAFB' }}>
              {messages.length === 0 && (
                <div className="text-center text-light mt-4 text-sm">{otherUser?.name || 'User'} ko pehla message bhejein!</div>
              )}
              {messages.map(msg => {
                const isMe = msg.senderId === currentUser.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`p-3 rounded-lg ${isMe ? 'bg-primary text-white' : 'bg-white border text-text-main'}`}
                      style={{ maxWidth: '70%', borderBottomRightRadius: isMe ? 0 : '0.5rem', borderBottomLeftRadius: isMe ? '0.5rem' : 0 }}
                    >
                      <div className="mb-1">{msg.text}</div>
                      <div className="text-xs" style={{ opacity: 0.8, color: isMe ? '#E5E7EB' : '#9CA3AF' }}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t bg-white">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  className="form-input flex-1"
                  placeholder="Message likhein..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button type="submit" className="bg-primary text-white p-3 rounded-md cursor-pointer border-none flex items-center justify-center">
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
