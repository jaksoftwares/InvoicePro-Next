// src/services/api.ts
// Frontend API service for calling backend endpoints
import { supabase, getAccessToken } from '../lib/supabase';
import { BusinessProfile, Invoice, InvoiceItem, InvoiceHistory, UserSettings as UserSettingsType } from '../types';

const API_BASE = '/api';

// Helper for authenticated requests
async function authFetch<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    console.warn(`API request failed: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  return response.json();
}

// ============ Business Profiles ============

export async function getBusinessProfiles(): Promise<BusinessProfile[]> {
  const { profiles } = await authFetch<{ profiles: Record<string, unknown>[] }>('/business-profiles');
  return profiles.map((profile) => transformProfileDates(profile));
}

export async function getBusinessProfile(id: string): Promise<BusinessProfile> {
  const { profile } = await authFetch<{ profile: Record<string, unknown> }>(`/business-profiles/${id}`);
  return transformProfileDates(profile);
}

export async function createBusinessProfile(profile: Partial<BusinessProfile>): Promise<BusinessProfile> {
  const { profile: created } = await authFetch<{ profile: Record<string, unknown> }>('/business-profiles', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
  return transformProfileDates(created);
}

export async function updateBusinessProfile(id: string, updates: Partial<BusinessProfile>): Promise<BusinessProfile> {
  const { profile } = await authFetch<{ profile: Record<string, unknown> }>(`/business-profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return transformProfileDates(profile);
}

export async function deleteBusinessProfile(id: string): Promise<void> {
  await authFetch(`/business-profiles/${id}`, { method: 'DELETE' });
}

// ============ Invoices ============

export async function getInvoices(filters?: { status?: string; search?: string }): Promise<Invoice[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';
  const { invoices } = await authFetch<{ invoices: Record<string, unknown>[] }>(`/invoices${query}`);
  return invoices.map((invoice) => transformInvoiceDates(invoice));
}

export async function getInvoice(id: string): Promise<Invoice> {
  const { invoice } = await authFetch<{ invoice: Record<string, unknown> }>(`/invoices?id=${id}`);
  return transformInvoiceDates(invoice);
}

export async function createInvoice(invoice: Partial<Invoice> & { businessProfileId: string }): Promise<Invoice> {
  const { invoice: created } = await authFetch<{ invoice: Record<string, unknown> }>('/invoices', {
    method: 'POST',
    body: JSON.stringify({
      ...invoice,
      dueDate: invoice.dueDate instanceof Date ? invoice.dueDate.toISOString() : invoice.dueDate,
      issueDate: invoice.issueDate instanceof Date ? invoice.issueDate.toISOString() : invoice.issueDate,
    }),
  });
  return transformInvoiceDates(created);
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
  const { invoice } = await authFetch<{ invoice: Record<string, unknown> }>(`/invoices?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...updates,
      dueDate: updates.dueDate instanceof Date ? updates.dueDate.toISOString() : updates.dueDate,
      issueDate: updates.issueDate instanceof Date ? updates.issueDate.toISOString() : updates.issueDate,
    }),
  });
  return transformInvoiceDates(invoice);
}

export async function deleteInvoice(id: string): Promise<void> {
  await authFetch(`/invoices?id=${id}`, { method: 'DELETE' });
}

// ============ Invoice Items ============

export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  const { items } = await authFetch<{ items: Record<string, unknown>[] }>(`/invoices/${invoiceId}/items?id=${invoiceId}`);
  return items.map((item) => transformItemDates(item));
}

export async function createInvoiceItem(
  invoiceId: string,
  item: { description: string; quantity?: number; rate?: number; amount?: number }
): Promise<InvoiceItem> {
  const { item: created } = await authFetch<{ item: Record<string, unknown> }>(`/invoices/${invoiceId}/items?id=${invoiceId}`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
  return transformItemDates(created);
}

export async function updateInvoiceItem(
  invoiceId: string,
  itemId: string,
  updates: Partial<InvoiceItem>
): Promise<InvoiceItem> {
  const { item: updated } = await authFetch<{ item: Record<string, unknown> }>(`/invoices/${invoiceId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return transformItemDates(updated);
}

export async function deleteInvoiceItem(invoiceId: string, itemId: string): Promise<void> {
  await authFetch(`/invoices/${invoiceId}/items/${itemId}`, { method: 'DELETE' });
}

// ============ Invoice History ============

export async function getInvoiceHistory(invoiceId: string): Promise<InvoiceHistory[]> {
  const { history } = await authFetch<{ history: Record<string, unknown>[] }>(`/invoices/history?invoiceId=${invoiceId}`);
  return history.map((h) => transformHistoryDates(h));
}

// ============ Settings ============

export type UserSettings = UserSettingsType;

export async function getSettings(): Promise<UserSettings> {
  const { settings } = await authFetch<{ settings: UserSettings }>('/settings');
  return settings;
}

export async function updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
  const { settings } = await authFetch<{ settings: UserSettings }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return settings;
}

// ============ Plans & Subscriptions ============

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  interval: 'month' | 'year';
  features: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  planId: string;
  plan: Plan | null;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  mpesaReceiptNumber: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt: string | null;
  canceledAt: string | null;
}

export async function getPlans(): Promise<Plan[]> {
  const response = await fetch(`${API_BASE}/plans`);
  const { plans } = await response.json();
  return plans;
}

export async function getSubscription(): Promise<Subscription | null> {
  const { subscription } = await authFetch<{ subscription: Subscription | null }>('/subscription');
  return subscription;
}

// ============ M-Pesa Payments ============

export interface MpesaPaymentResult {
  status: string;
  message: string;
  checkoutRequestId?: string;
}

export async function initiateMpesaPayment(planId: string, phoneNumber: string): Promise<MpesaPaymentResult> {
  return authFetch<MpesaPaymentResult>('/payments/mpesa/subscribe', {
    method: 'POST',
    body: JSON.stringify({ planId, phoneNumber }),
  });
}

export interface PaymentStatusResult {
  status: 'pending' | 'completed' | 'failed';
  message: string;
  receiptNumber?: string;
}

export async function checkPaymentStatus(checkoutRequestId: string): Promise<PaymentStatusResult> {
  return authFetch<PaymentStatusResult>('/payments/mpesa/status', {
    method: 'POST',
    body: JSON.stringify({ checkoutRequestId }),
  });
}

// ============ Media / Cloudinary ============

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: string;
}

export interface MediaAsset {
  id: string;
  publicId: string;
  url: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
  width?: number;
  height?: number;
  businessProfileId?: string;
  invoiceId?: string;
  createdAt: string;
}

export async function getUploadSignature(folder?: string): Promise<UploadSignature> {
  return authFetch<UploadSignature>('/media?action=sign-upload', {
    method: 'POST',
    body: JSON.stringify({ folder }),
  });
}

export async function saveMediaAsset(media: {
  publicId: string;
  url: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
  width?: number;
  height?: number;
  businessProfileId?: string;
  invoiceId?: string;
}): Promise<MediaAsset> {
  const { media: saved } = await authFetch<{ media: MediaAsset }>('/media', {
    method: 'POST',
    body: JSON.stringify(media),
  });
  return saved;
}

// ============ Helpers ============

function transformProfileDates(profile: Record<string, unknown>): BusinessProfile {
  return {
    id: String(profile.id),
    userId: String(profile.userId || profile.user_id || ''),
    name: String(profile.name),
    email: String(profile.email),
    phone: String(profile.phone || ''),
    address: String(profile.address || ''),
    city: String(profile.city || ''),
    state: String(profile.state || ''),
    zipCode: String(profile.zipCode || profile.zip_code || ''),
    country: String(profile.country || ''),
    website: profile.website as string | undefined,
    logo: String(profile.logo || profile.logoUrl || ''),
    logoUrl: String(profile.logoUrl || profile.logo || ''),
    taxNumber: profile.taxNumber as string | undefined,
    createdAt: new Date(profile.createdAt as string),
    updatedAt: new Date(profile.updatedAt as string),
  };
}

function transformInvoiceDates(invoice: Record<string, unknown>): Invoice {
  const businessProfile = invoice.businessProfile as Record<string, unknown> | undefined;
  const items = invoice.items as Record<string, unknown>[] | undefined;
  
  return {
    id: String(invoice.id),
    userId: String(invoice.userId || invoice.user_id || ''),
    businessProfileId: String(invoice.businessProfileId || invoice.business_profile_id || ''),
    invoiceNumber: String(invoice.invoiceNumber || invoice.invoice_number || ''),
    businessProfile: businessProfile ? transformProfileDates(businessProfile) : undefined,
    clientName: String(invoice.clientName || invoice.client_name || ''),
    clientEmail: String(invoice.clientEmail || invoice.client_email || ''),
    clientPhone: invoice.clientPhone as string | undefined || invoice.client_phone as string | undefined,
    clientAddress: String(invoice.clientAddress || invoice.client_address || ''),
    clientCity: String(invoice.clientCity || invoice.client_city || ''),
    clientState: String(invoice.clientState || invoice.client_state || ''),
    clientZipCode: String(invoice.clientZipCode || invoice.client_zip_code || ''),
    clientCountry: String(invoice.clientCountry || invoice.client_country || ''),
    items: (items || []).map(transformItemDates),
    subtotal: Number(invoice.subtotal || invoice.subTotal || 0),
    taxRate: Number(invoice.taxRate || invoice.tax_rate || 0),
    taxAmount: Number(invoice.taxAmount || invoice.tax_amount || 0),
    discountRate: Number(invoice.discountRate || invoice.discount_rate || 0),
    discountAmount: Number(invoice.discountAmount || invoice.discount_amount || 0),
    total: Number(invoice.total || 0),
    notes: invoice.notes as string | undefined,
    terms: invoice.terms as string | undefined,
    dueDate: new Date(invoice.dueDate as string || invoice.due_date as string),
    issueDate: new Date(invoice.issueDate as string || invoice.issue_date as string),
    status: (invoice.status as Invoice['status']) || 'draft',
    template: (invoice.template as Invoice['template']) || 'modern',
    currency: String(invoice.currency || 'USD'),
    createdAt: new Date(invoice.createdAt as string || invoice.created_at as string),
    updatedAt: new Date(invoice.updatedAt as string || invoice.updated_at as string),
  };
}

function transformItemDates(item: Record<string, unknown>): InvoiceItem {
  return {
    id: String(item.id),
    invoiceId: String(item.invoiceId || item.invoice_id || ''),
    description: String(item.description),
    quantity: Number(item.quantity || 1),
    rate: Number(item.rate || 0),
    amount: Number(item.amount || 0),
    createdAt: item.createdAt ? new Date(item.createdAt as string) : undefined,
    updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : undefined,
  };
}

function transformHistoryDates(history: Record<string, unknown>): InvoiceHistory {
  return {
    id: String(history.id),
    invoiceId: String(history.invoiceId || history.invoice_id || ''),
    userId: String(history.userId || history.user_id || ''),
    action: history.action as InvoiceHistory['action'],
    previousData: history.previousData as Record<string, unknown> | undefined,
    newData: history.newData as Record<string, unknown> | undefined,
    statusFrom: history.statusFrom as string | undefined,
    statusTo: history.statusTo as string | undefined,
    metadata: history.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(history.createdAt as string || history.created_at as string),
  };
}

// ============ Supabase Auth Helpers (re-exported for convenience) ============

export { supabase };

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
