import { MailCheckIcon } from "lucide-react";
import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "./auth-layout";
import { ResendConfirmation } from "./resend-confirmation";

export function CheckEmailPage() {
  const email = (useLocation().state as { email?: string } | null)?.email ?? "";

  return (
    <AuthLayout
      icon={<MailCheckIcon />}
      title="Check your email"
      description={
        email ? (
          <>
            We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Open it to activate your account.
          </>
        ) : (
          "We sent a confirmation link to your email. Open it to activate your account."
        )
      }
    >
      <div className="space-y-6">
        <ul className="space-y-2.5 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          <li>• Nothing after a few minutes? Check your spam or junk folder.</li>
          <li>• You can open the link on any device, then sign in here with your email and password.</li>
        </ul>
        <div className="space-y-3">
          {email && <ResendConfirmation email={email} />}
          <Button asChild variant="ghost" size="xl" className="w-full">
            <Link to="/auth/sign-in" state={{ email }}>
              Back to sign in
            </Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
