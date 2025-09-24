import React from 'react';
import { User, WinRecord } from '../types';
import ProfileCard from './ProfileCard';

interface ProfileViewProps {
  users: User[];
  winHistory: WinRecord[];
  currentUser: User;
}

const ProfileView: React.FC<ProfileViewProps> = ({ users, winHistory, currentUser }) => {
  const sortedUsers = [...users].sort((a, b) => {
    if (a.id === currentUser.id) return -1;
    if (b.id === currentUser.id) return 1;
    return b.stats.wins - a.stats.wins; // Sort other users by wins
  });
  
  return (
    <div className="space-y-4 animate-fade-in">
      {sortedUsers.map(user => (
        <ProfileCard 
          key={user.id} 
          user={user} 
          winHistory={winHistory} 
          isCurrentUser={user.id === currentUser.id}
        />
      ))}
    </div>
  );
};

export default ProfileView;
