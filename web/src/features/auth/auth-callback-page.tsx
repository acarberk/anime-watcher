import { CircleCheckBigIcon, LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { toast } from "sonner";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { authMessage, urlAuthError } from "@/lib/auth-errors";
import { AuthLayout } from "./auth-layout";

/** Landing page for the sign-up confirmation link (emailRedirectTo) */
export function AuthCallbackPage() {
  const { session, loading } = useAuth();
  const [linkError] = useState(() => urlAuthError(location));

  useEffect(() => {
    if (session && !linkError) toast.success("Email confirmed. Welcome!");
  }, [session, linkError]);

  if (linkError) {
    return (
      <AuthLayout
        icon={<LinkIcon />}
        title="This link is no longer valid"
        description={`${authMessage(linkError)} Try signing in; if your account isn't confirmed yet, you can request a new confirmation email from there.`}
      >
        <Button asChild size="xl" className="w-full">
          <Link to="/auth/sign-in">Sign in</Link>
        </Button>
      </AuthLayout>
    );
  }

  if (loading) return <FullScreenSpinner label="Confirming your account" />;
  if (session) return <Navigate to="/" replace />;

  // The link verified the address, but the session can only be created in the browser that signed up
  // (PKCE). Typical case: signed up on the PC, tapped the mail on the phone.
  return (
    <AuthLayout
      icon={<CircleCheckBigIcon />}
      title="Email confirmed"
      description="Your account is ready. Sign in with your email and password to continue on this device."
    >
      <Button asChild size="xl" className="w-full">
        <Link to="/auth/sign-in">Sign in</Link>
      </Button>
    </AuthLayout>
  );
}
