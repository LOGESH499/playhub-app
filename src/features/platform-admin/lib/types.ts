export type PlatformAnalytics = {
  tenants: number;
  activeTenants: number;
  suspendedTenants: number;
  users: number;
  platformAdmins: number;
  bookings: number;
  bookingsThisMonth: number;
  venues: number;
  subscriptionsByTier: { tier: string; count: number }[];
  openSupportTickets: number;
  generatedAt: string;
};

export type TenantWithSubscription = {
  id: string;
  name: string;
  slug: string;
  status: string;
  contactEmail: string | null;
  createdAt: string;
  memberCount?: number;
  subscription?: {
    tier: string;
    status: string;
    seatsLimit: number;
    venuesLimit: number;
  } | null;
};

export type PlatformUser = {
  id: string;
  email: string;
  fullName: string;
  isPlatformAdmin: boolean;
  createdAt: string;
  membershipCount?: number;
};

export type AuditLogRow = {
  id: string;
  tenantId: string | null;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actorName?: string;
};

export type FeatureFlag = {
  key: string;
  enabled: boolean;
  description: string | null;
  rolloutPercent: number;
  updatedAt: string;
};

export type PlatformSetting = {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updatedAt: string;
};

export type SupportTicket = {
  id: string;
  subject: string;
  body: string | null;
  status: string;
  priority: string;
  tenantId: string | null;
  userId: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  userName?: string;
  tenantName?: string;
};

export type HealthSnapshot = {
  id: string;
  metrics: Record<string, unknown>;
  createdAt: string;
};

export type TenantsListResult = {
  tenants: TenantWithSubscription[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type UsersListResult = {
  users: PlatformUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
