import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Send } from 'lucide-react';

const Chat = () => {
  const { currentUser, chats, profiles, sendMessage } = useAppContext();
  const [activeChatId, setActiveChatId] = useState(null);
  const [text, setText] = useState('');

  const myChats = chats.filter(c => c.participants.includes(currentUser.id));
  
  const activeChat = myChats.find(c => c.id === activeChatId);
  const otherUser = activeChat ? profiles.find(p => p.id === activeChat.participants.find(id => id !== currentUser.id)) : null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeChatId) return;
    sendMessage(activeChatId, text);
    setText('');
  };

  if (myChats.length === 0) {
    return (
      <div className="container page-transition" style={{ padding: '2rem 1rem' }}>
        <div className="bg-surface border p-8 rounded-lg text-center shadow-sm">
          <h2 className="text-xl font-bold mb-2">No active chats</h2>
          <p className="text-light">You can start chatting once your interest is accepted by a match.</p>
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
            const partnerId = chat.participants.find(id => id !== currentUser.id);
            const partner = profiles.find(p => p.id === partnerId);
            const lastMsg = chat.messages[chat.messages.length - 1];
            
            return (
              <div 
                key={chat.id} 
                className={`p-4 border-b cursor-pointer flex items-center gap-3 transition-colors`}
                style={{ backgroundColor: activeChatId === chat.id ? '#F3F4F6' : 'transparent' }}
                onClick={() => setActiveChatId(chat.id)}
              >
                <img src={partner?.photoUrl} alt="" className="rounded-full object-cover border" style={{ width: '48px', height: '48px', minWidth: '48px' }} />
                <div className="flex-1 overflow-hidden">
                  <div className="font-bold">{partner?.name}</div>
                  <div className="text-sm text-light truncate mb-0">{lastMsg ? lastMsg.text : 'Start chatting...'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`w-full md:w-2/3 bg-surface border rounded-lg shadow-sm flex-col overflow-hidden ${!activeChatId ? 'hidden md:flex bg-gray-50 items-center justify-center' : 'flex'}`}>
        {!activeChatId ? (
          <div className="text-light">Select a match to start messaging</div>
        ) : (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <button className="md:hidden border-none bg-transparent font-bold cursor-pointer text-primary" onClick={() => setActiveChatId(null)}>← Back</button>
              <img src={otherUser?.photoUrl} alt="" className="rounded-full object-cover" style={{ width: '40px', height: '40px' }} />
              <div className="font-bold">{otherUser?.name}</div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" style={{ background: '#F9FAFB' }}>
              {activeChat.messages.length === 0 && (
                <div className="text-center text-light mt-4 text-sm">Send your first message to {otherUser?.name}!</div>
              )}
              {activeChat.messages.map(msg => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg ${isMe ? 'bg-primary text-white' : 'bg-white border text-text-main'}`} style={{ maxWidth: '70%', borderBottomRightRadius: isMe ? 0 : '0.5rem', borderBottomLeftRadius: isMe ? '0.5rem' : 0 }}>
                      <div className="mb-1">{msg.text}</div>
                      <div className="text-xs" style={{ opacity: 0.8, color: isMe ? '#E5E7EB' : '#9CA3AF' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 border-t bg-white">
              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  type="text" 
                  className="form-input flex-1" 
                  placeholder="Type a message..."
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
