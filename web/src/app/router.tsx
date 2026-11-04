import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import { AuthCallbackPage } from "@/features/auth/auth-callback-page";
import { CheckEmailPage } from "@/features/auth/check-email-page";
import { ForgotPasswordPage } from "@/features/auth/forgot-password-page";
import { ResetPasswordPage } from "@/features/auth/reset-password-page";
import { SignInPage } from "@/features/auth/sign-in-page";
import { SignUpPage } from "@/features/auth/sign-up-page";
import { AppLayout } from "./app-layout";
import { GuestOnly, RequireAuth, RequireChannel } from "./guards";

// signed-in screens are split into their own chunks; the sign-in screen doesn't download them
const page = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) => ({
  lazy: async () => ({ Component: (await load())[name] }),
});

const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [{ path: "dev/gallery", ...page(() => import("@/dev/gallery"), "Gallery") }]
  : [];

export const router = createBrowserRouter(
  [
    {
      HydrateFallback: FullScreenSpinner,
      children: [
        {
          path: "auth",
          children: [
            {
              element: <GuestOnly />,
              children: [
                { path: "sign-in", element: <SignInPage /> },
                { path: "sign-up", element: <SignUpPage /> },
                { path: "check-email", element: <CheckEmailPage /> },
                { path: "forgot", element: <ForgotPasswordPage /> },
              ],
            },
            // these two handle links from emails and must work with or without a session
            { path: "callback", element: <AuthCallbackPage /> },
            { path: "reset", element: <ResetPasswordPage /> },
          ],
        },
        {
          element: <RequireAuth />,
          children: [
            { path: "setup", ...page(() => import("@/features/notifications/setup-page"), "SetupPage") },
            {
              element: <RequireChannel />,
              children: [
                {
                  element: <AppLayout />,
                  children: [
                    { index: true, ...page(() => import("@/features/watchlist/watchlist-page"), "WatchlistPage") },
                    { path: "settings", ...page(() => import("@/features/settings/settings-page"), "SettingsPage") },
                  ],
                },
              ],
            },
          ],
        },
        ...devRoutes,
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, "") },
);
