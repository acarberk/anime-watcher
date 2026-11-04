import { Navigate, Outlet, useLocation } from "react-router";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import { useProfile } from "@/features/notifications/api";
import { useAuth } from "@/lib/auth";

export function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenSpinner />;
  if (!session) return <Navigate to="/auth/sign-in" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/** Sign-in/up screens: a signed-in user goes straight to the app */
export function GuestOnly() {
  const { session, loading, recovering } = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (session) return <Navigate to={recovering ? "/auth/reset" : "/"} replace />;
  return <Outlet />;
}

/** Without a notification channel nothing can reach the user, so set one up first */
export function RequireChannel() {
  const profile = useProfile();
  if (profile.isPending) return <FullScreenSpinner />;
  // on a load error let the app render; the settings screen can still fix the topic
  if (profile.isSuccess && !profile.data?.ntfy_topic) return <Navigate to="/setup" replace />;
  return <Outlet />;
}
