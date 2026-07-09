export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "booking" | "audit" | "notification" | "system";
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  sportType?: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  readAt: string | null;
  createdAt: string;
}

export interface DashboardData {
  stats: DashboardStat[];
  activity: ActivityItem[];
  calendarEvents: CalendarEvent[];
  notifications: DashboardNotification[];
  unreadCount: number;
}
