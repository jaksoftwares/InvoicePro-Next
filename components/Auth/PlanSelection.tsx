"use client";
import React, { useState, useEffect } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import type { Plan } from '@/types';

interface PlanSelectionProps {
  onPlanSelected: (planId: string) => void;
  selectedPlanId?: string;
}

const formatPrice = (cents: number, currency: string = 'KES') => {
  if (cents === 0) return 'Free';
  const formatted = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
  return `${formatted}/month`;
};

const PlanSelection: React.FC<PlanSelectionProps> = ({ onPlanSelected, selectedPlanId }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/plans');
        const data = await response.json();
        if (data.plans) {
          setPlans(data.plans);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">Select a plan to get started with your account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isFree = plan.priceCents === 0;

          return (
            <div
              key={plan.id}
              onClick={() => onPlanSelected(plan.id)}
              className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-3 -right-3 bg-blue-500 rounded-full p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(plan.priceCents, plan.currency)}
                </div>
                {!isFree && (
                  <p className="text-xs text-gray-500 mt-1">
                    Billed {plan.interval}ly • Auto-renews
                  </p>
                )}
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>
                    <strong>Invoices:</strong> {plan.maxInvoices === null ? 'Unlimited' : plan.maxInvoices}
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>
                    <strong>Business Profiles:</strong> {plan.maxBusinessProfiles === null ? 'Unlimited' : plan.maxBusinessProfiles}
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>
                    <strong>Support:</strong> {plan.supportLevel}
                  </span>
                </li>
                {plan.prioritySupport && (
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Priority Support</span>
                  </li>
                )}
                {plan.customBranding && (
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Custom Branding</span>
                  </li>
                )}
              </ul>

              <div className="mt-4 text-center">
                <div className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {isSelected ? 'Selected' : 'Select Plan'}
                  {isSelected && <ArrowRight className="ml-2 h-4 w-4" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Payment Information</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Free plans start immediately with no payment required</li>
          <li>• Paid plans require MPesa payment to activate</li>
          <li>• All plans auto-renew at the end of each billing period</li>
          <li>• You can change or cancel your plan anytime</li>
        </ul>
      </div>
    </div>
  );
};

export default PlanSelection;