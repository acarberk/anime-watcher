import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthError } from "@supabase/supabase-js";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import type { z } from "zod";
import { FormAlert, FormRow } from "@/components/form";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authMessage } from "@/lib/auth-errors";
import { supabase } from "@/lib/supabase";
import { AuthLayout } from "./auth-layout";
import { ResendConfirmation } from "./resend-confirmation";
import { signInSchema } from "./schemas";

type Values = z.infer<typeof signInSchema>;

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string; email?: string } | null) ?? {};
  const [error, setError] = useState<AuthError | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: from.email ?? "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setError(error);
      if (error.code === "invalid_credentials") form.setFocus("password");
      return;
    }
    navigate(from.from ?? "/", { replace: true });
  });

  return (
    <AuthLayout
      hero
      title="Welcome back"
      description="Sign in to manage your watchlist and notifications."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/auth/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {error && <FormAlert>{authMessage(error)}</FormAlert>}
        {error?.code === "email_not_confirmed" && <ResendConfirmation email={form.getValues("email")} />}

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
          <FormRow
            id="password"
            label="Password"
            error={errors.password?.message}
            action={
              <Link
                to="/auth/forgot"
                state={{ email: form.watch("email") }}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            }
          >
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...form.register("password")}
            />
          </FormRow>
        </FieldGroup>

        <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
