"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/roles";
import {
  processRefundSchema,
  recordBookingPaymentSchema,
  requestRefundSchema,
  type ProcessRefundInput,
  type RecordBookingPaymentInput,
  type RequestRefundInput,
} from "@/lib/validators/payment.schema";

export type PaymentActionResult = {
  error?: string;
  success?: string;
  id?: string;
};

async function requirePaymentManager() {
  const context = await getAuthContext();
  if (!context) throw new Error("Unauthorized");
  if (!canManageOrganization(context.appRole)) {
    throw new Error("You do not have permission to manage payments");
  }
  if (!context.activeTenant?.tenantId) {
    throw new Error("Select an organization first");
  }
  return context;
}

async function requireAuth() {
  const context = await getAuthContext();
  if (!context) throw new Error("Unauthorized");
  return context;
}

export async function recordBookingPaymentAction(
  input: RecordBookingPaymentInput
): Promise<PaymentActionResult> {
  const parsed = recordBookingPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requirePaymentManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_booking_payment", {
    p_booking_id: parsed.data.bookingId,
    p_amount: parsed.data.amount,
    p_payment_method: parsed.data.paymentMethod,
    p_reference: parsed.data.reference || null,
    p_notes: parsed.data.notes || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/payments");
  revalidatePath(`/bookings/${parsed.data.bookingId}`);
  revalidatePath(`/portal/bookings/${parsed.data.bookingId}`);
  return { success: "Payment recorded" };
}

export async function requestRefundAction(
  input: RequestRefundInput
): Promise<PaymentActionResult> {
  const parsed = requestRefundSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_booking_refund", {
    p_booking_id: parsed.data.bookingId,
    p_amount: parsed.data.amount,
    p_reason: parsed.data.reason || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/payments/refunds");
  revalidatePath(`/bookings/${parsed.data.bookingId}`);
  revalidatePath(`/portal/bookings/${parsed.data.bookingId}`);
  return { success: "Refund request submitted", id: data?.id };
}

export async function processRefundAction(
  input: ProcessRefundInput
): Promise<PaymentActionResult> {
  const parsed = processRefundSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requirePaymentManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("process_refund", {
    p_refund_id: parsed.data.refundId,
    p_action: parsed.data.action,
    p_review_notes: parsed.data.reviewNotes || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/payments");
  revalidatePath("/payments/refunds");
  if (data?.booking_id) {
    revalidatePath(`/bookings/${data.booking_id}`);
    revalidatePath(`/portal/bookings/${data.booking_id}`);
  }
  return {
    success:
      parsed.data.action === "approve"
        ? "Refund processed"
        : "Refund request rejected",
  };
}
