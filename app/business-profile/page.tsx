"use client";
import React from 'react';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';
import Layout from '../../components/Layout/Layout';
import BusinessProfileComponent from '../../components/Profile/BusinessProfile';

export default function BusinessProfilePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <BusinessProfileComponent />
      </Layout>
    </ProtectedRoute>
  );
}
