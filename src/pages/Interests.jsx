import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';
import { Heart, Send, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

const TabButton = ({ name, label, count, activeTab, setActiveTab }) => (
  <button
    className={`pb-2 px-4 font-bold text-sm cursor-pointer transition-colors pt-2`}
    style={{
      borderBottom: activeTab === name ? '2px solid var(--primary)' : '2px solid transparent',
      color: activeTab === name ? 'var(--primary)' : 'var(--text-light)',
      background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
      whiteSpace: 'nowrap'
    }}
    onClick={() => setActiveTab(name)}
  >
    {label} {count > 0 && <span className="text-white rounded-full px-2 py-0.5 text-xs ml-1" style={{ backgroundColor: 'var(--primary)' }}>{count}</span>}
  </button>
);

const Interests = () => {
  const navigate = useNavigate();
  const { profiles, loading, interests, acceptInterest, declineInterest, shortlists } = useAppContext();
  const { currentUser } = useAuthContext();
  const [activeTab, setActiveTab] = useState('received');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-light font-medium">Loading your interests...</p>
      </div>
    );
  }

  if (!currentUser) return null;

  const receivedInterests = interests.filter(i => i.receiverId === currentUser.uid && i.status === 'pending');
  const sentInterests = interests.filter(i => i.senderId === currentUser.uid && i.status === 'pending');
  const acceptedInterests = interests.filter(i => (i.senderId === currentUser.uid || i.receiverId === currentUser.uid) && i.status === 'accepted');
  const myShortlists = shortlists.filter(s => s.userId === currentUser.uid);

  const renderContent = () => {
    let list = [];
    if (activeTab === 'received') {
      list = receivedInterests.map(i => ({ profile: profiles.find(p => p.id === i.senderId), interestId: i.id, type: 'received' }));
    } else if (activeTab === 'sent') {
      list = sentInterests.map(i => ({ profile: profiles.find(p => p.id === i.receiverId), interestId: i.id, type: 'sent' }));
    } else if (activeTab === 'accepted') {
      list = acceptedInterests.map(i => {
        const otherId = i.senderId === currentUser.uid ? i.receiverId : i.senderId;
        return { profile: profiles.find(p => p.id === otherId), interestId: i.id, type: 'accepted' };
      });
    } else if (activeTab === 'shortlisted') {
      list = myShortlists.map(s => ({ profile: profiles.find(p => p.id === s.profileId), type: 'shortlisted' }));
    }

    if (list.length === 0) {
      const emptyMessages = {
        received: { title: "No interests received", desc: "When other users connect with you, they will appear here." },
        sent: { title: "No interests sent yet", desc: "Start exploring profiles and send interests to find your match!" },
        accepted: { title: "No connections yet", desc: "Once your interests are accepted, you can start chatting." },
        shortlisted: { title: "Your shortlist is empty", desc: "Save profiles you like to view them later." }
      };
      
      const { title, desc } = emptyMessages[activeTab] || { title: "No profiles found", desc: "Profiles you interact with will appear here." };

      return (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm mt-4">
          <Heart className="mx-auto h-12 w-12 text-gray-200 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-gray-500 max-w-xs mx-auto mb-6">{desc}</p>
          <Button onClick={() => navigate('/dashboard')} variant="primary" className="px-8">
            Explore Matches
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {list.filter(item => item.profile).map(item => (
          <ProfileCard 
            key={`${item.type}-${item.profile.id}`} 
            profile={item.profile} 
            actionButton={
              item.type === 'received' ? (
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1" style={{ padding: '0.5rem' }} onClick={() => declineInterest(item.interestId)}>Decline</Button>
                  <Button variant="primary" className="flex-1" style={{ padding: '0.5rem' }} onClick={() => acceptInterest(item.interestId)}>Accept</Button>
                </div>
              ) : item.type === 'sent' ? (
                <Button variant="outline" className="w-full" disabled style={{ padding: '0.5rem' }}>Pending...</Button>
              ) : item.type === 'accepted' ? (
                <Button variant="primary" className="w-full" style={{ padding: '0.5rem', background: 'var(--secondary)' }}>Accepted</Button>
              ) : null
            }
          />
        ))}
      </div>
    );
  };



  return (
    <div className="container page-transition" style={{ padding: '2rem 1rem' }}>
      <h2 className="text-2xl font-bold mb-4">My Interests</h2>
      
      <div className="flex border-b overflow-x-auto gap-2">
        <TabButton name="received" label="Received" count={receivedInterests.length} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton name="accepted" label="Accepted" count={acceptedInterests.length} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton name="sent" label="Sent" count={sentInterests.length} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton name="shortlisted" label="Shortlisted" count={myShortlists.length} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {renderContent()}
    </div>
  );
};

export default Interests;
