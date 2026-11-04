import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthError } from "@supabase/supabase-js";
import { LinkIcon, LockKeyholeIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import type { z } from "zod";
import { FormAlert, FormRow, PasswordChecklist } from "@/components/form";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth";
import { authMessage, urlAuthError } from "@/lib/auth-errors";
import { supabase } from "@/lib/supabase";
import { AuthLayout } from "./auth-layout";
import { resetSchema } from "./schemas";

type Values = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [linkError] = useState(() => urlAuthError(location));
  const [error, setError] = useState<AuthError | null>(null);

  const form = useForm<Values>({ resolver: zodResolver(resetSchema), defaultValues: { password: "", confirm: "" } });
  const { errors, isSubmitting } = form.formState;
  const password = form.watch("password");

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setError(error);
    toast.success("Your password has been updated.");
    navigate("/", { replace: true });
  });

  if (loading) return <FullScreenSpinner label="Checking your link" />;

  // no recovery session: expired/used link, or opened in a different browser than the one that asked for it
  if (!session || linkError) {
    return (
      <AuthLayout
        icon={<LinkIcon />}
        title="This link is no longer valid"
        description="It may have expired, been used already, or been opened in a different browser than the one that requested it."
      >
        <Button asChild size="xl" className="w-full">
          <Link to="/auth/forgot">Request a new link</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={<LockKeyholeIcon />} title="Set a new password" description={`For ${session.user.email}`}>
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {error && <FormAlert>{authMessage(error)}</FormAlert>}
        <FieldGroup>
          <FormRow id="password" label="New password" error={errors.password?.message}>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              autoFocus
              aria-invalid={!!errors.password}
              aria-describedby="password-rules"
              {...form.register("password")}
            />
            <div id="password-rules">
              <PasswordChecklist value={password} />
            </div>
          </FormRow>
          <FormRow id="confirm" label="Confirm new password" error={errors.confirm?.message}>
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
          Save password
        </Button>
      </form>
    </AuthLayout>
  );
}
