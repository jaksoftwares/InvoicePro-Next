"use client";
import React from 'react';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';
import Layout from '../../components/Layout/Layout';
import Dashboard from '../../components/Dashboard/Dashboard';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  );
}
