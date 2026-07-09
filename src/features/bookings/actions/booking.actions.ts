"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/roles";
import {
  bookSlotSchema,
  cancelBookingSchema,
  createHoldSchema,
  joinWaitlistSchema,
  rescheduleBookingSchema,
  type BookSlotInput,
  type CancelBookingInput,
  type CreateHoldInput,
  type JoinWaitlistInput,
  type RescheduleBookingInput,
} from "@/lib/validators/booking.schema";

export type BookingActionResult = {
  error?: string;
  success?: string;
  bookingId?: string;
  holdId?: string;
};

async function requireAuth() {
  const context = await getAuthContext();
  if (!context) throw new Error("Unauthorized");
  return context;
}

export async function createSlotHoldAction(
  input: CreateHoldInput
): Promise<BookingActionResult> {
  const parsed = createHoldSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_slot_hold", {
    p_slot_id: parsed.data.slotId,
    p_duration_minutes: parsed.data.durationMinutes,
  });

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  revalidatePath("/slots");
  return {
    success: "Slot held for checkout",
    holdId: (data as { id: string }).id,
  };
}

export async function bookSlotAction(
  input: BookSlotInput
): Promise<BookingActionResult | void> {
  const parsed = bookSlotSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const targetUserId =
    parsed.data.userId && canManageOrganization(context.appRole)
      ? parsed.data.userId
      : context.userId;

  const { data, error } = await supabase.rpc("book_slot", {
    p_slot_id: parsed.data.slotId,
    p_user_id: targetUserId,
    p_hold_id: parsed.data.holdId || null,
    p_notes: parsed.data.notes || null,
    p_booked_by: context.userId,
    p_status: "confirmed",
  });

  if (error) return { error: error.message };

  const booking = data as { id: string };
  revalidatePath("/bookings");
  revalidatePath("/slots");
  revalidatePath("/dashboard");
  redirect(`/bookings/${booking.id}?confirmed=1`);
}

export async function cancelBookingAction(
  input: CancelBookingInput
): Promise<BookingActionResult> {
  const parsed = cancelBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_booking", {
    p_booking_id: parsed.data.bookingId,
    p_reason: parsed.data.reason || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  revalidatePath("/slots");
  revalidatePath("/dashboard");
  return { success: "Booking cancelled" };
}

export async function rescheduleBookingAction(
  input: RescheduleBookingInput
): Promise<BookingActionResult> {
  const parsed = rescheduleBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reschedule_booking", {
    p_booking_id: parsed.data.bookingId,
    p_new_slot_id: parsed.data.newSlotId,
    p_notes: parsed.data.notes || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  revalidatePath("/slots");
  return {
    success: "Booking rescheduled",
    bookingId: (data as { id: string }).id,
  };
}

export async function completeBookingAction(
  bookingId: string
): Promise<BookingActionResult> {
  let context;
  try {
    context = await requireAuth();
    if (!canManageOrganization(context.appRole)) {
      return { error: "Permission denied" };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_booking", {
    p_booking_id: bookingId,
  });

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  return { success: "Booking marked completed" };
}

export async function joinWaitlistAction(
  input: JoinWaitlistInput
): Promise<BookingActionResult> {
  const parsed = joinWaitlistSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_waitlist", {
    p_slot_id: parsed.data.slotId,
  });

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  return { success: "Added to waitlist — we'll notify you if a slot opens" };
}

export async function confirmBookingAction(
  bookingId: string
): Promise<BookingActionResult> {
  try {
    await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_booking", {
    p_booking_id: bookingId,
  });

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  return { success: "Booking confirmed" };
}
