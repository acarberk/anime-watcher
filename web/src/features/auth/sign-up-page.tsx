import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthError } from "@supabase/supabase-js";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import type { z } from "zod";
import { FormAlert, FormRow, PasswordChecklist } from "@/components/form";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authMessage } from "@/lib/auth-errors";
import { appUrl, supabase } from "@/lib/supabase";
import { AuthLayout } from "./auth-layout";
import { signUpSchema } from "./schemas";

type Values = z.infer<typeof signUpSchema>;

export function SignUpPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<Pick<AuthError, "code" | "message"> | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirm: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const password = form.watch("password");

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: appUrl("auth/callback") },
    });
    if (error) return setError(error);
    // with email confirmation on, an existing address returns a user without identities instead of an error
    if (data.user && data.user.identities?.length === 0) {
      return setError({ code: "user_already_exists", message: "" });
    }
    if (data.session) return navigate("/", { replace: true });
    navigate("/auth/check-email", { replace: true, state: { email } });
  });

  return (
    <AuthLayout
      hero
      title="Create your account"
      description="Add the shows you follow and get a notification on your phone when a new episode is out."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {error && (
          <FormAlert>
            {authMessage(error)}
            {error.code === "user_already_exists" && (
              <>
                {" "}
                <Link to="/auth/sign-in" state={{ email: form.getValues("email") }} className="font-medium underline">
                  Go to sign in
                </Link>
              </>
            )}
          </FormAlert>
        )}

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
          <FormRow id="password" label="Password" error={errors.password?.message}>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby="password-rules"
              {...form.register("password")}
            />
            <div id="password-rules">
              <PasswordChecklist value={password} />
            </div>
          </FormRow>
          <FormRow id="confirm" label="Confirm password" error={errors.confirm?.message}>
            <PasswordInput
              id="confirm"
              autoComplete="new-password"
              aria-invalid={!!errors.confirm}
              aria-describedby={errors.confirm ? "confirm-error" : undefined}
              {...form.register("confirm")}
            />
          </FormRow>
        </FieldGroup>

        <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
