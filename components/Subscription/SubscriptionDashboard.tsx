"use client";
import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react';
import type { Subscription, Plan, UsageCounter, MpesaPayment } from '@/types';

interface SubscriptionDashboardProps {
  subscription: Subscription | null;
  usageCounters: UsageCounter[];
  onPlanChange?: (planId: string) => void;
  onCancel?: () => void;
}

const SubscriptionDashboard: React.FC<SubscriptionDashboardProps> = ({
  subscription,
  usageCounters,
  onPlanChange,
  onCancel,
}) => {
  const [billingHistory, setBillingHistory] = useState<MpesaPayment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBillingHistory = async () => {
    try {
      const response = await fetch('/api/subscription/billing-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBillingHistory(data.payments || []);
      }
    } catch (error) {
      console.error('Failed to fetch billing history:', error);
    }
  };

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending_payment':
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'past_due':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'suspended':
      case 'canceled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending_payment':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'past_due':
        return 'bg-orange-100 text-orange-800';
      case 'suspended':
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (cents: number, currency = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription Found</h3>
          <p className="text-gray-500">You don't have an active subscription.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
          {getStatusIcon(subscription.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Plan</p>
            <p className="font-semibold text-gray-900">{subscription.plan?.name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
              {subscription.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Billing</p>
            <p className="font-semibold text-gray-900 capitalize">{subscription.billingInterval}ly</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Next Billing</p>
            <p className="font-semibold text-gray-900">{formatDate(subscription.nextBillingAt)}</p>
          </div>
        </div>

        {/* Status-specific messaging */}
        {subscription.status === 'past_due' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              <div>
                <h4 className="font-medium text-orange-900">Payment Overdue</h4>
                <p className="text-sm text-orange-800">
                  Your payment is past due. Please update your payment method to avoid service interruption.
                </p>
              </div>
            </div>
          </div>
        )}

        {subscription.status === 'suspended' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <h4 className="font-medium text-red-900">Account Suspended</h4>
                <p className="text-sm text-red-800">
                  Your account has been suspended due to payment issues. Please update your payment to restore access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {onPlanChange && subscription.status === 'active' && (
            <button
              onClick={() => onPlanChange('')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Change Plan
            </button>
          )}
          {onCancel && subscription.status === 'active' && (
            <button
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Usage Limits */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage & Limits</h3>
        <div className="space-y-4">
          {usageCounters.map((counter) => {
            const percentage = counter.maxAllowed ? (counter.used / counter.maxAllowed) * 100 : 0;
            const isUnlimited = counter.maxAllowed === null;

            return (
              <div key={counter.resource} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {counter.resource.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {counter.used} {isUnlimited ? 'used (Unlimited)' : `of ${counter.maxAllowed}`}
                  </span>
                </div>
                {!isUnlimited && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        percentage > 90 ? 'bg-red-500' :
                        percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                )}
                {counter.resetAt && (
                  <p className="text-xs text-gray-500">
                    Resets on {formatDate(counter.resetAt)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
          <button
            onClick={fetchBillingHistory}
            className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>

        {billingHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No billing history available</p>
        ) : (
          <div className="space-y-3">
            {billingHistory.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    payment.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(payment.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    payment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {payment.status}
                  </span>
                  {payment.mpesaReceiptNumber && (
                    <p className="text-xs text-gray-500 mt-1">
                      Receipt: {payment.mpesaReceiptNumber}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionDashboard;