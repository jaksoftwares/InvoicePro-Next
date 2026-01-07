"use client";
import React from 'react';
import ProtectedRoute from '../../../components/Auth/ProtectedRoute';
import Layout from '../../../components/Layout/Layout';
import InvoiceCreator from '../../../components/Invoice/InvoiceCreator';

export default function EditInvoicePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <InvoiceCreator />
      </Layout>
    </ProtectedRoute>
  );
}
