import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/roles";
import type { PaymentListFilters } from "@/lib/validators/payment.schema";
import type {
  PaymentStats,
  PaymentsListResult,
  PaymentTransactionWithRelations,
  RefundRequestWithRelations,
} from "./types";

function emptyPaymentsResult(filters: PaymentListFilters): PaymentsListResult {
  return {
    transactions: [],
    total: 0,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: 0,
  };
}

export function canManagePayments(appRole: string): boolean {
  return canManageOrganization(appRole as never);
}

export async function listPayments(
  filters: PaymentListFilters
): Promise<PaymentsListResult> {
  const supabase = await createClient();
  const context = await getAuthContext();
  if (!context) return emptyPaymentsResult(filters);

  const isStaff =
    context.activeTenant && canManageOrganization(context.appRole);

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = supabase
    .from("payment_transactions")
    .select(
      `
      *,
      user:profiles!payment_transactions_user_id_fkey ( id, full_name ),
      recorded_by_profile:profiles!payment_transactions_recorded_by_fkey ( id, full_name ),
      booking:bookings ( id, confirmation_code, amount )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (isStaff && context.activeTenant) {
    query = query.eq("tenant_id", context.activeTenant.tenantId);
  } else {
    query = query.eq("user_id", context.userId);
  }

  if (filters.method) query = query.eq("payment_method", filters.method);
  if (filters.direction) query = query.eq("direction", filters.direction);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters.startDate) {
    query = query.gte("created_at", `${filters.startDate}T00:00:00`);
  }
  if (filters.endDate) {
    query = query.lte("created_at", `${filters.endDate}T23:59:59`);
  }

  const { data, count, error } = await query.range(from, to);
  if (error) return emptyPaymentsResult(filters);

  const total = count ?? 0;
  return {
    transactions: (data ?? []) as PaymentTransactionWithRelations[],
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize) || 0,
  };
}

export async function getPaymentStats(): Promise<PaymentStats | null> {
  const supabase = await createClient();
  const context = await getAuthContext();
  if (!context?.activeTenant || !canManageOrganization(context.appRole)) {
    return null;
  }

  const tenantId = context.activeTenant.tenantId;

  const { data: transactions } = await supabase
    .from("payment_transactions")
    .select("amount, direction, payment_method")
    .eq("tenant_id", tenantId);

  const { count: pendingRefunds } = await supabase
    .from("refund_requests")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "requested");

  let totalCollected = 0;
  let totalRefunded = 0;
  const methodMap = new Map<string, { amount: number; count: number }>();

  for (const tx of transactions ?? []) {
    const amount = Number(tx.amount);
    if (tx.direction === "refund") {
      totalRefunded += amount;
    } else {
      totalCollected += amount;
      const key = tx.payment_method;
      const prev = methodMap.get(key) ?? { amount: 0, count: 0 };
      methodMap.set(key, {
        amount: prev.amount + amount,
        count: prev.count + 1,
      });
    }
  }

  return {
    totalCollected,
    totalRefunded,
    netRevenue: totalCollected - totalRefunded,
    transactionCount: transactions?.length ?? 0,
    pendingRefunds: pendingRefunds ?? 0,
    byMethod: Array.from(methodMap.entries()).map(([method, v]) => ({
      method,
      ...v,
    })),
  };
}

export async function listRefundRequests(
  status?: string
): Promise<RefundRequestWithRelations[]> {
  const supabase = await createClient();
  const context = await getAuthContext();
  if (!context) return [];

  let query = supabase
    .from("refund_requests")
    .select(
      `
      *,
      user:profiles!refund_requests_user_id_fkey ( id, full_name ),
      booking:bookings ( id, confirmation_code, amount, payment_status )
    `
    )
    .order("created_at", { ascending: false });

  if (context.activeTenant && canManageOrganization(context.appRole)) {
    query = query.eq("tenant_id", context.activeTenant.tenantId);
  } else {
    query = query.eq("user_id", context.userId);
  }

  if (status) query = query.eq("status", status);

  const { data } = await query;
  return (data ?? []) as RefundRequestWithRelations[];
}

export async function getBookingTransactions(
  bookingId: string
): Promise<PaymentTransactionWithRelations[]> {
  const supabase = await createClient();
  const context = await getAuthContext();
  if (!context) return [];

  const { data } = await supabase
    .from("payment_transactions")
    .select(
      `
      *,
      recorded_by_profile:profiles!payment_transactions_recorded_by_fkey ( id, full_name )
    `
    )
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  return (data ?? []) as PaymentTransactionWithRelations[];
}

export async function getBookingRefundRequests(
  bookingId: string
): Promise<RefundRequestWithRelations[]> {
  const supabase = await createClient();
  const context = await getAuthContext();
  if (!context) return [];

  const { data } = await supabase
    .from("refund_requests")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  return (data ?? []) as RefundRequestWithRelations[];
}
