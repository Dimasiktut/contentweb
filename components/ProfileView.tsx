import React from 'react';
import { User, WinRecord, Purchase } from '../types';
import ProfileCard from './ProfileCard';

interface ProfileViewProps {
  users: User[];
  winHistory: WinRecord[];
  purchases: Purchase[];
  currentUser: User;
  onInitiateDuel: (opponent: User) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ users, winHistory, purchases, currentUser, onInitiateDuel }) => {
  const sortedUsers = [...users].sort((a, b) => {
    if (a.id === currentUser.id) return -1;
    if (b.id === currentUser.id) return 1;
    return b.stats_wins - a.stats_wins; // Sort other users by wins
  });
  
  return (
    <div className="space-y-4 animate-fade-in">
      {sortedUsers.map(user => (
        <ProfileCard 
          key={user.id} 
          user={user} 
          winHistory={winHistory}
          purchases={user.id === currentUser.id ? purchases : []}
          isCurrentUser={user.id === currentUser.id}
          currentUser={currentUser}
          onInitiateDuel={onInitiateDuel}
        />
      ))}
    </div>
  );
};

export default ProfileView;