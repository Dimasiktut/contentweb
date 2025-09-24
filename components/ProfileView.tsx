import React from 'react';
import { User, WinRecord } from '../types';
import ProfileCard from './ProfileCard';

interface ProfileViewProps {
  users: User[];
  winHistory: WinRecord[];
}

const ProfileView: React.FC<ProfileViewProps> = ({ users, winHistory }) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {users.map(user => (
        <ProfileCard key={user.id} user={user} winHistory={winHistory} />
      ))}
    </div>
  );
};

export default ProfileView;