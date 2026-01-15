import React from 'react';
import UserProfile from '../../components/Profile/UserProfile';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';

const ProfilePage: React.FC = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <UserProfile />
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
