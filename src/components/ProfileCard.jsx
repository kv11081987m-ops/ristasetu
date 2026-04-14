import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, BadgeCheck } from 'lucide-react';
import Button from './Button';

const ProfileCard = ({ profile, actionButton }) => {
  return (
    <div className="bg-surface rounded-lg shadow-md overflow-hidden border" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'relative' }}>
        <img 
          src={profile.photoUrl} 
          alt={profile.name} 
          style={{ width: '100%', height: '250px', objectFit: 'cover' }} 
        />
        {profile.isVerified && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <BadgeCheck size={16} color="var(--secondary)" />
            <span className="text-xs font-bold text-secondary">Verified</span>
          </div>
        )}
      </div>
      
      <div className="p-4" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        <h3 className="font-bold text-lg mb-1">{profile.name}, {profile.age}</h3>
        
        <div className="flex items-center gap-2 text-sm text-light mb-1">
          <MapPin size={16} />
          <span>{profile.city}, {profile.state}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-light mb-3">
          <Briefcase size={16} />
          <span>{profile.profession}</span>
        </div>

        <div className="flex gap-2 text-sm text-light mb-4 flex-wrap">
          <span style={{ background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '12px' }}>{profile.religion}</span>
          <span style={{ background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '12px' }}>{profile.community}</span>
        </div>

        <div className="mt-auto flex gap-2">
          <Link to={`/profile/${profile.id}`} style={{ flex: '1' }}>
            <Button variant="outline" style={{ width: '100%', padding: '0.5rem' }}>View</Button>
          </Link>
          {actionButton && <div style={{ flex: '1' }}>{actionButton}</div>}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
