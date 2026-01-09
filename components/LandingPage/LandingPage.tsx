"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Send, Check } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  interval: string;
  features: Record<string, unknown>;
}

const formatPrice = (cents: number, currency: string = 'USD') => {
  if (cents === 0) return 'Free';
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
  return `${formatted}/${cents > 0 ? 'mo' : ''}`;
};

const LandingPage: React.FC = () => {
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

  // Helper to check if a plan has a feature
  const hasFeature = (plan: Plan, featureName: string): boolean => {
    const features = plan.features as Record<string, boolean | number | string>;
    if (typeof features[featureName] === 'boolean') {
      return features[featureName] as boolean;
    }
    if (typeof features[featureName] === 'number') {
      return (features[featureName] as number) > 0;
    }
    return false;
  };

  // Get feature value
  const getFeatureValue = (plan: Plan, featureName: string): string => {
    const features = plan.features as Record<string, boolean | number | string>;
    if (typeof features[featureName] === 'boolean') {
      return features[featureName] ? 'Unlimited' : 'Limited';
    }
    if (typeof features[featureName] === 'number') {
      return features[featureName] === -1 ? 'Unlimited' : String(features[featureName]);
    }
    return String(features[featureName] || '');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-indigo-50 to-white">
      {/* Header */}
      <header className="w-full py-6 px-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <img src="/logo.jpg" alt="Dovepeak Digital Solutions Logo" className="h-10 w-10 rounded-full shadow-lg border-2 border-blue-400" />
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">Dovepeak Digital Solutions</span>
        </div>
        <nav className="hidden sm:flex space-x-6">
          <a href="#features" className="text-blue-700 font-semibold hover:underline underline-offset-4 transition-colors">Features</a>
          <a href="#pricing" className="text-blue-700 font-semibold hover:underline underline-offset-4 transition-colors">Pricing</a>
          <a href="#about" className="text-blue-700 font-semibold hover:underline underline-offset-4 transition-colors">About</a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-8 pb-4">
        <div className="max-w-3xl w-full">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight drop-shadow-xl">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 bg-clip-text text-transparent">Modern Invoicing</span> for Digital Businesses
          </h1>
          <p className="text-base sm:text-lg md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Create, preview, and send professional invoices in seconds. Our sleek, intuitive platform helps you get paid faster and look great doing it—on any device.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Link
                 href="/create"
                 className="inline-flex items-center px-8 py-4 bg-blue-700 text-white text-lg sm:text-xl font-bold rounded-full shadow-xl hover:bg-blue-800 transition-colors group focus:outline-none focus:ring-4 focus:ring-blue-300"
               >
              Log in toGet Started Free
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
               <Link
                 href="/dashboard"
                 className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white text-lg sm:text-xl font-bold rounded-full shadow-xl hover:bg-indigo-700 transition-colors group focus:outline-none focus:ring-4 focus:ring-indigo-300"
               >
              Access your workspace
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        <div className="mt-12 w-full flex justify-center">
          <img src="/sample-template.png" alt="Invoice Generator Preview" className="rounded-2xl shadow-2xl w-full max-w-xl border border-blue-100" />
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform">
            <Sparkles className="text-blue-600 h-10 w-10 mb-4" />
            <h3 className="font-bold text-lg mb-2">Effortless Creation</h3>
            <p className="text-gray-600 text-center">Generate invoices with a beautiful, guided form. No design skills required—just fill and send.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform">
            <Send className="text-green-600 h-10 w-10 mb-4" />
            <h3 className="font-bold text-lg mb-2">Instant Email & PDF</h3>
            <p className="text-gray-600 text-center">Send invoices directly to clients or download as PDF with a single click. Fast, reliable, and secure.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform">
            <ShieldCheck className="text-indigo-600 h-10 w-10 mb-4" />
            <h3 className="font-bold text-lg mb-2">Private & Secure</h3>
            <p className="text-gray-600 text-center">Your data stays private and protected. No unnecessary signups, no tracking, just peace of mind.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600">Choose the plan that works best for your business</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => {
                const isPopular = plan.id === 'basic';
                const isFree = plan.priceCents === 0;

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl shadow-lg p-6 flex flex-col ${
                      isPopular
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-600 ring-offset-2'
                        : 'bg-white text-slate-900'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-yellow-400 text-indigo-900 text-sm font-bold px-4 py-1 rounded-full shadow">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <p className={`text-sm mb-4 ${isPopular ? 'text-indigo-100' : 'text-gray-500'}`}>
                        {plan.description}
                      </p>
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-extrabold">
                          {formatPrice(plan.priceCents, plan.currency)}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features && Object.entries(plan.features).map(([key, value]) => {
                        // Format feature key for display
                        const featureLabels: Record<string, string> = {
                          maxInvoices: 'Max Invoices',
                          maxProfiles: 'Business Profiles',
                          emailSupport: 'Email Support',
                          prioritySupport: 'Priority Support',
                          customBranding: 'Custom Branding',
                        };
                        const label = featureLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                        return (
                          <li key={key} className="flex items-center text-sm">
                            <Check className={`h-5 w-5 mr-2 flex-shrink-0 ${
                              isPopular ? 'text-green-300' : 'text-green-500'
                            }`} />
                            <span>
                              <strong>{label}:</strong> {
                                typeof value === 'boolean'
                                  ? (value ? 'Yes' : 'No')
                                  : value === -1
                                    ? 'Unlimited'
                                    : String(value)
                              }
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <Link
                      href={isFree ? '/create' : '/signup'}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-center transition-colors ${
                        isPopular
                          ? 'bg-white text-indigo-600 hover:bg-gray-100'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {isFree ? 'Get Started Free' : 'Choose Plan'}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">About Dovepeak Digital Solutions</h2>
          <p className="text-gray-700 mb-2 text-base sm:text-lg">
            We empower businesses to thrive in the digital era. Our invoice generator is crafted for speed, accuracy, and a professional look—helping you save time, reduce errors, and get paid faster.
          </p>
          <p className="text-gray-600 text-sm">Contact: <a href="mailto:contact@dovepeakdigital.com" className="underline hover:text-blue-700">contact@dovepeakdigital.com</a></p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm bg-white/80 border-t border-blue-100 mt-8">
        &copy; {new Date().getFullYear()} Dovepeak Digital Solutions. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
