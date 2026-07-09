import type { Tables } from "@/types/database.types";

export type PaymentTransaction = Tables<"payment_transactions">;
export type RefundRequest = Tables<"refund_requests">;

export type PaymentTransactionWithRelations = PaymentTransaction & {
  user?: { id: string; full_name: string } | null;
  recorded_by_profile?: { id: string; full_name: string } | null;
  booking?: {
    id: string;
    confirmation_code: string | null;
    amount: number;
  } | null;
};

export type RefundRequestWithRelations = RefundRequest & {
  user?: { id: string; full_name: string } | null;
  booking?: {
    id: string;
    confirmation_code: string | null;
    amount: number;
    payment_status: string;
  } | null;
};

export type PaymentsListResult = {
  transactions: PaymentTransactionWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PaymentStats = {
  totalCollected: number;
  totalRefunded: number;
  netRevenue: number;
  transactionCount: number;
  pendingRefunds: number;
  byMethod: { method: string; amount: number; count: number }[];
};
