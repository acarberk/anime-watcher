import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthError } from "@supabase/supabase-js";
import { KeyRoundIcon, MailCheckIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router";
import type { z } from "zod";
import { FormAlert, FormRow } from "@/components/form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authMessage } from "@/lib/auth-errors";
import { appUrl, supabase } from "@/lib/supabase";
import { AuthLayout } from "./auth-layout";
import { forgotSchema } from "./schemas";

type Values = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const initialEmail = (useLocation().state as { email?: string } | null)?.email ?? "";
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<AuthError | null>(null);

  const form = useForm<Values>({ resolver: zodResolver(forgotSchema), defaultValues: { email: initialEmail } });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl("auth/reset") });
    if (error) return setError(error);
    setSentTo(email);
  });

  const backToSignIn = (
    <Link to="/auth/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
      Back to sign in
    </Link>
  );

  if (sentTo) {
    return (
      <AuthLayout
        icon={<MailCheckIcon />}
        title="Check your inbox"
        description={
          <>
            If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, a password reset
            link is on its way.
          </>
        }
        footer={backToSignIn}
      >
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          For security, the link only works in this browser. Open the email on this device; if you open it somewhere
          else, request a new link here.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={<KeyRoundIcon />}
      title="Forgot your password?"
      description="Enter your email and we'll send you a link to set a new password."
      footer={backToSignIn}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {error && <FormAlert>{authMessage(error)}</FormAlert>}
        <FieldGroup>
          <FormRow id="email" label="Email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoFocus
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...form.register("email")}
            />
          </FormRow>
        </FieldGroup>
        <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
