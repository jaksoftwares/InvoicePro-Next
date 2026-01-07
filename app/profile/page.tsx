"use client";
import React from 'react';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';
import Layout from '../../components/Layout/Layout';
import Profile from '../../components/Auth/Profile';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Profile />
      </Layout>
    </ProtectedRoute>
  );
}
