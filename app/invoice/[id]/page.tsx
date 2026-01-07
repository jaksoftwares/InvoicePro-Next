"use client";
import React from 'react';
import ProtectedRoute from '../../../components/Auth/ProtectedRoute';
import Layout from '../../../components/Layout/Layout';
import InvoiceView from '../../../components/Invoice/InvoiceView';

export default function InvoiceViewPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <InvoiceView />
      </Layout>
    </ProtectedRoute>
  );
}
