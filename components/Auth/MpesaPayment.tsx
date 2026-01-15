"use client";
import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface MpesaPaymentProps {
  planId: string;
  onPaymentComplete: () => void;
  onError: (error: string) => void;
}

type PaymentStatus = 'idle' | 'initiating' | 'waiting' | 'completed' | 'failed' | 'timeout';

const MpesaPayment: React.FC<MpesaPaymentProps> = ({ planId, onPaymentComplete, onError }) => {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInitiatePayment = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your MPesa phone number');
      return;
    }

    // Validate phone number format (Kenya)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone.match(/^254\d{9}$/)) {
      setError('Please enter a valid Kenyan phone number (e.g., 254712345678)');
      return;
    }

    setError('');
    setLoading(true);
    setStatus('initiating');

    try {
      // Create subscription first
      const subscriptionResponse = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify({
          planId,
          mpesaPhoneNumber: cleanPhone,
        }),
      });

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }

      // Initiate MPesa payment
      const paymentResponse = await fetch('/api/payments/mpesa?action=subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify({
          planId,
          phoneNumber: cleanPhone,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || 'Failed to initiate payment');
      }

      setCheckoutRequestId(paymentData.checkoutRequestId);
      setStatus('waiting');

      // Start polling for payment status
      pollPaymentStatus(paymentData.checkoutRequestId);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Payment initiation failed';
      setError(errorMessage);
      onError(errorMessage);
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (requestId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (60 * 5 seconds)

    const poll = async () => {
      try {
        const response = await fetch('/api/payments/mpesa?action=status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          },
          body: JSON.stringify({ checkoutRequestId: requestId }),
        });

        const data = await response.json();

        if (data.status === 'completed') {
          setStatus('completed');
          setTimeout(() => onPaymentComplete(), 2000); // Brief delay to show success
          return;
        } else if (data.status === 'failed') {
          setStatus('failed');
          setError('Payment failed. Please try again.');
          onError('Payment failed');
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          setStatus('timeout');
          setError('Payment timeout. Please check your MPesa messages and try again.');
          onError('Payment timeout');
          return;
        }

        // Continue polling
        setTimeout(poll, 5000);
      } catch (err) {
        console.error('Polling error:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setStatus('timeout');
          setError('Payment verification failed. Please contact support.');
          onError('Payment verification failed');
        }
      }
    };

    poll();
  };

  const renderStatusContent = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Smartphone className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Payment</h3>
              <p className="text-gray-600 text-sm">
                Enter your MPesa phone number to receive a payment prompt
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                MPesa Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="254712345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                maxLength={12}
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Format: 254XXXXXXXXX (without + or spaces)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleInitiatePayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Initiating Payment...' : 'Pay with MPesa'}
            </button>
          </div>
        );

      case 'initiating':
        return (
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h3 className="text-lg font-semibold text-gray-900">Initiating Payment</h3>
            <p className="text-gray-600 text-sm">Please wait while we set up your payment...</p>
          </div>
        );

      case 'waiting':
        return (
          <div className="text-center space-y-4">
            <Clock className="mx-auto h-12 w-12 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Pending</h3>
            <p className="text-gray-600 text-sm">
              Check your phone for the MPesa payment prompt and enter your PIN to complete the payment.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Important:</strong> Complete the payment within 5 minutes to avoid timeout.
              </p>
            </div>
            <div className="animate-pulse text-sm text-gray-500">
              Waiting for payment confirmation...
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Successful!</h3>
            <p className="text-gray-600 text-sm">
              Your subscription has been activated. Redirecting to dashboard...
            </p>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center space-y-4">
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Failed</h3>
            <p className="text-gray-600 text-sm">{error}</p>
            <button
              onClick={() => setStatus('idle')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        );

      case 'timeout':
        return (
          <div className="text-center space-y-4">
            <Clock className="mx-auto h-12 w-12 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Timeout</h3>
            <p className="text-gray-600 text-sm">{error}</p>
            <button
              onClick={() => setStatus('idle')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
        <p className="text-sm text-gray-500">Step 3 of 3: Secure payment</p>
      </div>

      {renderStatusContent()}
    </div>
  );
};

export default MpesaPayment;