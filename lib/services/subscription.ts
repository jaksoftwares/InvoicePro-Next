// lib/services/subscription.ts
// Core subscription engine operations
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Plan, Subscription, UsageCounter } from '@/types';

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    planId: data.plan_id,
    plan: data.plans ? {
      id: data.plans.id,
      name: data.plans.name,
      description: data.plans.description,
      priceCents: data.plans.price_cents,
      currency: data.plans.currency,
      interval: data.plans.interval,
      features: data.plans.features || {},
      isActive: data.plans.is_active,
      maxInvoices: data.plans.max_invoices,
      maxBusinessProfiles: data.plans.max_business_profiles,
      supportLevel: data.plans.support_level,
      prioritySupport: data.plans.priority_support,
      customBranding: data.plans.custom_branding,
      createdAt: new Date(data.plans.created_at),
    } : undefined,
    status: data.status,
    currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : undefined,
    currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
    nextBillingAt: data.next_billing_at ? new Date(data.next_billing_at) : undefined,
    cancelAt: data.cancel_at ? new Date(data.cancel_at) : undefined,
    canceledAt: data.canceled_at ? new Date(data.canceled_at) : undefined,
    lastPaymentAt: data.last_payment_at ? new Date(data.last_payment_at) : undefined,
    paymentStatus: data.payment_status,
    billingInterval: data.billing_interval,
    usageSnapshot: data.usage_snapshot,
    trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : undefined,
    mpesaReceiptNumber: data.mpesa_receipt_number,
    mpesaPhoneNumber: data.mpesa_phone_number,
    suspendedAt: data.suspended_at ? new Date(data.suspended_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function getPlan(planId: string): Promise<Plan | null> {
  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    priceCents: data.price_cents,
    currency: data.currency,
    interval: data.interval,
    features: data.features || {},
    isActive: data.is_active,
    maxInvoices: data.max_invoices,
    maxBusinessProfiles: data.max_business_profiles,
    supportLevel: data.support_level,
    prioritySupport: data.priority_support,
    customBranding: data.custom_branding,
    createdAt: new Date(data.created_at),
  };
}

export async function createSubscription(userId: string, planId: string, mpesaPhoneNumber?: string): Promise<Subscription> {
  // Ensure only one active/pending subscription per user
  const existing = await getUserSubscription(userId);
  if (existing && (existing.status === 'active' || existing.status === 'pending' || existing.status === 'pending_payment' || existing.status === 'trialing')) {
    throw new Error('User already has an active or pending subscription');
  }

  const plan = await getPlan(planId);
  if (!plan) throw new Error('Plan not found');
  if (!plan.isActive) throw new Error('Plan is not active');

  const now = new Date();
  const periodEnd = new Date(now);
  if (plan.interval === 'year') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // Determine initial status based on plan price
  const initialStatus = plan.priceCents === 0 ? 'active' : 'pending_payment';

  const subscriptionData = {
    user_id: userId,
    plan_id: planId,
    status: initialStatus,
    current_period_start: plan.priceCents === 0 ? now.toISOString() : null,
    current_period_end: plan.priceCents === 0 ? periodEnd.toISOString() : null,
    next_billing_at: plan.priceCents === 0 ? periodEnd.toISOString() : null,
    billing_interval: plan.interval,
    mpesa_phone_number: mpesaPhoneNumber,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .insert(subscriptionData)
    .select()
    .single();

  if (error) throw error;

  // Initialize usage counters for free plans immediately
  if (plan.priceCents === 0) {
    await initializeUsageCounters(userId, data.id, plan);
  }

  const subscription = await getUserSubscription(userId);
  if (!subscription) throw new Error('Failed to retrieve created subscription');
  return subscription;
}

export async function activateSubscription(userId: string, planId: string, mpesaReceiptNumber: string): Promise<Subscription> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) throw new Error('No subscription found');

  const plan = await getPlan(planId);
  if (!plan) throw new Error('Plan not found');

  const now = new Date();
  const periodEnd = new Date(now);
  if (plan.interval === 'year') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      mpesa_receipt_number: mpesaReceiptNumber,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      next_billing_at: periodEnd.toISOString(),
      last_payment_at: now.toISOString(),
      payment_status: 'paid',
      canceled_at: null,
      cancel_at: null,
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;

  // Initialize usage counters for the activated subscription
  await initializeUsageCounters(userId, subscription.id, plan);

  const activatedSubscription = await getUserSubscription(userId);
  if (!activatedSubscription) throw new Error('Failed to retrieve activated subscription');
  return activatedSubscription;
}

export async function cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<Subscription> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) throw new Error('No subscription found');
  if (subscription.status === 'canceled') throw new Error('Subscription already canceled');

  const now = new Date();
  const updateData: Record<string, string | null> = {
    updated_at: now.toISOString(),
  };

  if (cancelAtPeriodEnd && subscription.currentPeriodEnd) {
    updateData.cancel_at = subscription.currentPeriodEnd.toISOString();
  } else {
    updateData.status = 'canceled';
    updateData.canceled_at = now.toISOString();
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update(updateData)
    .eq('user_id', userId);

  if (error) throw error;

  await logAuditEvent(userId, 'subscription.canceled', 'subscription', undefined, {
    cancelAtPeriodEnd,
    effectiveDate: cancelAtPeriodEnd ? subscription.currentPeriodEnd?.toISOString() : now.toISOString(),
  });

  const canceledSubscription = await getUserSubscription(userId);
  if (!canceledSubscription) throw new Error('Failed to retrieve canceled subscription');
  return canceledSubscription;
}

export async function changePlan(userId: string, newPlanId: string): Promise<Subscription> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) throw new Error('No subscription found');
  if (subscription.status !== 'active') throw new Error('Subscription must be active to change plan');

  const newPlan = await getPlan(newPlanId);
  if (!newPlan) throw new Error('New plan not found');
  if (!newPlan.isActive) throw new Error('New plan is not active');

  const now = new Date();
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      plan_id: newPlanId,
      billing_interval: newPlan.interval,
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;

  // Update usage counters for new plan limits
  await updateUsageCountersForPlan(userId, subscription.id, newPlan);

  await logAuditEvent(userId, 'subscription.plan_changed', 'subscription', undefined, {
    oldPlanId: subscription.planId,
    newPlanId: newPlanId,
  });

  const changedSubscription = await getUserSubscription(userId);
  if (!changedSubscription) throw new Error('Failed to retrieve changed subscription');
  return changedSubscription;
}

export async function initializeUsageCounters(userId: string, subscriptionId: string, plan: Plan): Promise<void> {
  const counters = [];

  if (plan.maxInvoices !== null) {
    counters.push({
      user_id: userId,
      subscription_id: subscriptionId,
      resource: 'invoices',
      used: 0,
      max_allowed: plan.maxInvoices,
      reset_at: null,
    });
  }

  if (plan.maxBusinessProfiles !== null) {
    counters.push({
      user_id: userId,
      subscription_id: subscriptionId,
      resource: 'business_profiles',
      used: 0,
      max_allowed: plan.maxBusinessProfiles,
      reset_at: null,
    });
  }

  if (counters.length > 0) {
    const { error } = await supabaseAdmin
      .from('usage_counters')
      .insert(counters);

    if (error) throw error;
  }
}

export async function updateUsageCountersForPlan(userId: string, subscriptionId: string, plan: Plan): Promise<void> {
  // Delete existing counters
  await supabaseAdmin
    .from('usage_counters')
    .delete()
    .eq('user_id', userId);

  // Initialize new counters
  await initializeUsageCounters(userId, subscriptionId, plan);
}

export async function resetUsageCounters(userId: string): Promise<void> {
  const now = new Date();
  const { error } = await supabaseAdmin
    .from('usage_counters')
    .update({
      used: 0,
      reset_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;
}

export async function incrementUsageCounter(userId: string, resource: string, amount: number = 1): Promise<UsageCounter | null> {
  const { data, error } = await supabaseAdmin
    .from('usage_counters')
    .select('*')
    .eq('user_id', userId)
    .eq('resource', resource)
    .single();

  if (error || !data) return null;

  const newUsed = data.used + amount;
  const now = new Date();

  const { error: updateError } = await supabaseAdmin
    .from('usage_counters')
    .update({
      used: newUsed,
      updated_at: now.toISOString(),
    })
    .eq('id', data.id);

  if (updateError) throw updateError;

  return {
    id: data.id,
    userId: data.user_id,
    subscriptionId: data.subscription_id,
    resource: data.resource,
    used: newUsed,
    maxAllowed: data.max_allowed,
    resetAt: data.reset_at ? new Date(data.reset_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: now,
  };
}

export async function getUsageCounters(userId: string): Promise<UsageCounter[]> {
  const { data, error } = await supabaseAdmin
    .from('usage_counters')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  return data.map(counter => ({
    id: counter.id,
    userId: counter.user_id,
    subscriptionId: counter.subscription_id,
    resource: counter.resource,
    used: counter.used,
    maxAllowed: counter.max_allowed,
    resetAt: counter.reset_at ? new Date(counter.reset_at) : undefined,
    createdAt: new Date(counter.created_at),
    updatedAt: new Date(counter.updated_at),
  }));
}

export async function checkUsageLimit(userId: string, resource: string): Promise<{ allowed: boolean; used: number; maxAllowed?: number }> {
  const { data, error } = await supabaseAdmin
    .from('usage_counters')
    .select('used, max_allowed')
    .eq('user_id', userId)
    .eq('resource', resource)
    .single();

  if (error || !data) {
    return { allowed: true, used: 0 }; // No limit set
  }

  const allowed = data.max_allowed === null || data.used < data.max_allowed;
  return {
    allowed,
    used: data.used,
    maxAllowed: data.max_allowed,
  };
}

export async function processBillingCycleResets(): Promise<void> {
  const now = new Date();

  // Find subscriptions that have passed their billing cycle end
  const { data: subscriptions, error } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, current_period_end, billing_interval')
    .eq('status', 'active')
    .lt('current_period_end', now.toISOString());

  if (error) throw error;

  for (const sub of subscriptions || []) {
    // Reset usage counters for this user
    await resetUsageCounters(sub.user_id);

    // Update subscription period based on billing interval
    const periodEnd = new Date(sub.current_period_end);
    const nextPeriodEnd = new Date(periodEnd);

    if (sub.billing_interval === 'year') {
      nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
    } else {
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
    }

    await supabaseAdmin
      .from('subscriptions')
      .update({
        current_period_start: periodEnd.toISOString(),
        current_period_end: nextPeriodEnd.toISOString(),
        next_billing_at: nextPeriodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', sub.user_id);
  }
}

export async function logAuditEvent(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await supabaseAdmin.from('audit_events').insert({
    user_id: userId,
    action,
    resource,
    resource_id: resourceId,
    details: details || {},
    ip_address: ipAddress,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
  });
}

export async function suspendSubscription(userId: string): Promise<Subscription> {
  const now = new Date();
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'suspended',
      suspended_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;

  await logAuditEvent(userId, 'subscription.suspended', 'subscription', undefined, { reason: 'payment_failure' });

  const subscription = await getUserSubscription(userId);
  if (!subscription) throw new Error('Failed to retrieve suspended subscription');
  return subscription;
}

export async function reactivateSubscription(userId: string): Promise<Subscription> {
  const now = new Date();
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      suspended_at: null,
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;

  await logAuditEvent(userId, 'subscription.reactivated', 'subscription');

  const subscription = await getUserSubscription(userId);
  if (!subscription) throw new Error('Failed to retrieve reactivated subscription');
  return subscription;
}