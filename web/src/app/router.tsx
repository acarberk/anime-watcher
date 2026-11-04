import { createBrowserRouter, Navigate } from "react-router";
import { AuthCallbackPage } from "@/features/auth/auth-callback-page";
import { CheckEmailPage } from "@/features/auth/check-email-page";
import { ForgotPasswordPage } from "@/features/auth/forgot-password-page";
import { ResetPasswordPage } from "@/features/auth/reset-password-page";
import { SignInPage } from "@/features/auth/sign-in-page";
import { SignUpPage } from "@/features/auth/sign-up-page";
import { AppLayout } from "./app-layout";
import { GuestOnly, RequireAuth } from "./guards";
import { HomePage } from "./home-page";

export const router = createBrowserRouter(
  [
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
      children: [{ element: <AppLayout />, children: [{ index: true, element: <HomePage /> }] }],
    },
    { path: "*", element: <Navigate to="/" replace /> },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, "") },
);
