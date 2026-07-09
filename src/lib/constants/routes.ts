export const AUTH_ROUTES = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  callback: "/auth/callback",
  verifyEmail: "/verify-email",
} as const;

export const PROTECTED_ROUTES = {
  dashboard: "/dashboard",
  profile: "/profile",
  onboarding: "/onboarding",
  organizations: "/organizations",
} as const;

export const PLATFORM_ROUTES = {
  root: "/platform",
} as const;

export const PUBLIC_ROUTES = ["/", "/about", "/privacy", "/terms"] as const;

export function isAuthRoute(pathname: string): boolean {
  return (
    pathname.startsWith(AUTH_ROUTES.login) ||
    pathname.startsWith(AUTH_ROUTES.register) ||
    pathname.startsWith(AUTH_ROUTES.forgotPassword) ||
    pathname.startsWith(AUTH_ROUTES.resetPassword) ||
    pathname.startsWith(AUTH_ROUTES.verifyEmail) ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/invite/")
  );
}

export function isProtectedRoute(pathname: string): boolean {
  return (
    pathname.startsWith(PROTECTED_ROUTES.dashboard) ||
    pathname.startsWith(PROTECTED_ROUTES.profile) ||
    pathname.startsWith(PROTECTED_ROUTES.onboarding) ||
    pathname.startsWith(PROTECTED_ROUTES.organizations) ||
    pathname.startsWith("/sports") ||
    pathname.startsWith("/venues") ||
    pathname.startsWith("/courts") ||
    pathname.startsWith("/slots") ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/academies") ||
    pathname.startsWith("/invite/")
  );
}

export function isPlatformRoute(pathname: string): boolean {
  return pathname.startsWith(PLATFORM_ROUTES.root);
}

export function getPostLoginRedirect(
  isPlatformAdmin: boolean,
  hasOrganization: boolean
): string {
  if (isPlatformAdmin) {
    return PLATFORM_ROUTES.root;
  }
  if (!hasOrganization) {
    return PROTECTED_ROUTES.onboarding;
  }
  return PROTECTED_ROUTES.dashboard;
}
