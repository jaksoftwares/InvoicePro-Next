// types/index.ts
// Type definitions for the invoice application

export interface BusinessProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website?: string;
  logo?: string;
  logoUrl?: string;
  taxNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  businessProfileId: string;
  invoiceNumber: string;
  businessProfile?: BusinessProfile;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress: string;
  clientCity: string;
  clientState: string;
  clientZipCode: string;
  clientCountry: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  notes?: string;
  terms?: string;
  dueDate: Date;
  issueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  template: 'modern' | 'classic' | 'minimal' | 'professional' | 'corporate' | 'elegant' | 'creative';
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceHistory {
  id: string;
  invoiceId: string;
  userId: string;
  action: 'created' | 'updated' | 'status_changed' | 'viewed' | 'sent' | 'paid';
  previousData?: Partial<Invoice>;
  newData?: Partial<Invoice>;
  statusFrom?: string;
  statusTo?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface UserSettings {
  id: string;
  userId: string;
  currency: string;
  taxRate: number;
  language: string;
  dateFormat: string;
  defaultTemplate: 'modern' | 'classic' | 'minimal' | 'professional' | 'corporate' | 'elegant' | 'creative';
  defaultNotes?: string;
  defaultTerms?: string;
  defaultDueDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaAsset {
  id: string;
  userId: string;
  businessProfileId?: string;
  invoiceId?: string;
  publicId: string;
  url: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
  width?: number;
  height?: number;
  createdAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  interval: 'month' | 'year';
  features: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan?: Plan;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'canceled';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAt?: Date;
  canceledAt?: Date;
  mpesaReceiptNumber?: string;
  mpesaPhoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentEvent {
  id: string;
  userId?: string;
  stripeEventId: string;
  type: string;
  payload: Record<string, unknown>;
  receivedAt: Date;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export interface EmailSettings {
  serviceId: string;
  templateId: string;
  publicKey: string;
}
