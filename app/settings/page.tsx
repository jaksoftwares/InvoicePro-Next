"use client";
import React from 'react';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';
import Layout from '../../components/Layout/Layout';
import Settings from '../../components/Settings/Settings';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Settings />
      </Layout>
    </ProtectedRoute>
  );
}
