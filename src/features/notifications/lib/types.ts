export type NotificationRecord = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  tenantId: string | null;
  readAt: string | null;
  createdAt: string;
  data?: Record<string, unknown>;
};

export type NotificationEmailRecord = {
  id: string;
  notificationId: string | null;
  recipientEmail: string;
  subject: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
};

export type NotificationBroadcast = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  targetAudience: string;
  recipientsCount: number;
  createdAt: string;
  createdByName?: string;
};

export type NotificationsListResult = {
  notifications: NotificationRecord[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
