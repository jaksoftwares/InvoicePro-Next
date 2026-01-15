"use client";
// src/pages/Signup.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Head from 'next/head';
import PlanSelection from './PlanSelection';
import MpesaPayment from './MpesaPayment';

type SignupStep = 'account' | 'plan' | 'payment';

const Signup = () => {
  const [step, setStep] = useState<SignupStep>('account');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(email, password);
      setStep('plan');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Signup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelected = (planId: string) => {
    setSelectedPlanId(planId);
    setStep('payment');
  };

  const handlePaymentComplete = () => {
    router.push('/dashboard');
  };

  const renderStepContent = () => {
    switch (step) {
      case 'account':
        return (
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6 text-center">
              <img src="/logo.jpg" alt="InvoicePro Logo" className="mx-auto h-12 w-12" />
              <h2 className="text-2xl font-bold text-gray-800 mt-4">Create an Account</h2>
              <p className="text-sm text-gray-500">Step 1 of 3: Account details</p>
            </div>

            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name (optional)</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Continue to Plan Selection'}
              </button>
            </form>

            <div className="mt-6 text-sm text-center text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-green-600 hover:underline">Log in</Link>
            </div>
          </div>
        );

      case 'plan':
        return (
          <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg p-8">
            <PlanSelection onPlanSelected={handlePlanSelected} />
          </div>
        );

      case 'payment':
        return (
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
            <MpesaPayment
              planId={selectedPlanId}
              onPaymentComplete={handlePaymentComplete}
              onError={setError}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up | InvoicePro</title>
        <meta name="description" content="Create your InvoicePro account to start managing invoices." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4 py-8">
        {renderStepContent()}
      </div>
    </>
  );
};

export default Signup;
