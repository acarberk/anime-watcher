import { CircleAlertIcon, CircleCheckIcon, CircleIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { PASSWORD_RULES } from "@/features/auth/password-rules";
import { cn } from "@/lib/utils";

/** Label + control + hint/error, wired for screen readers via the control's id */
export function FormRow({
  id,
  label,
  error,
  hint,
  action,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {action}
      </div>
      {children}
      {hint && !error && <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}

/** Render only when there is an error: `{error && <FormAlert>…</FormAlert>}` */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <Alert variant="destructive" role="alert" className="animate-in fade-in-0 slide-in-from-top-1">
      <CircleAlertIcon />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

/** Live checklist under a new-password field */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="grid gap-1 text-[0.8125rem]" aria-label="Password rules">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        const Icon = ok ? CircleCheckIcon : CircleIcon;
        return (
          <li key={r.label} className={cn("flex items-center gap-2 transition-colors", ok ? "text-success" : "text-muted-foreground")}>
            <Icon className="size-3.5" aria-hidden="true" />
            <span>{r.label}</span>
            <span className="sr-only">{ok ? "met" : "not met"}</span>
          </li>
        );
      })}
    </ul>
  );
}
