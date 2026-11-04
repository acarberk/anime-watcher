import { Navigate, Outlet, useLocation } from "react-router";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import { hasChannel, useChannels } from "@/features/notifications/api";
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

/** Without a way to reach the user (a connected device or an ntfy topic) alerts go nowhere, so set one up first */
export function RequireChannel() {
  const channels = useChannels();
  if (channels.isPending) return <FullScreenSpinner />;
  // on a load error let the app render; the settings screen can still fix it
  if (channels.isSuccess && !hasChannel(channels.data)) return <Navigate to="/setup" replace />;
  return <Outlet />;
}
