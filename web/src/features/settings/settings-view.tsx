import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleCheckBigIcon,
  DownloadIcon,
  KeyRoundIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  ShareIcon,
  SmartphoneIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, type ComponentProps, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { FormRow, PasswordChecklist } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { resetSchema } from "@/features/auth/schemas";
import type { InstallState } from "@/lib/pwa-install";
import { NotificationsSection } from "./notifications-section";

function Section({ icon, title, description, children }: { icon: ReactNode; title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground [&_svg]:size-4.5">{icon}</span>
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-[0.8125rem] text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  return (
    <Section icon={<PaletteIcon />} title="Appearance">
      <ToggleGroup type="single" variant="outline" value={theme} onValueChange={(v) => v && setTheme(v)} className="w-full sm:w-auto" aria-label="Theme">
        <ToggleGroupItem value="dark" className="h-11 flex-1 px-4 sm:flex-none md:h-10">
          <MoonIcon /> Dark
        </ToggleGroupItem>
        <ToggleGroupItem value="light" className="h-11 flex-1 px-4 sm:flex-none md:h-10">
          <SunIcon /> Light
        </ToggleGroupItem>
        <ToggleGroupItem value="system" className="h-11 flex-1 px-4 sm:flex-none md:h-10">
          <MonitorIcon /> System
        </ToggleGroupItem>
      </ToggleGroup>
    </Section>
  );
}

function InstallSection({ state, onInstall }: { state: InstallState; onInstall: () => void }) {
  if (state === "unavailable") return null;
  return (
    <Section icon={<SmartphoneIcon />} title="Install the app" description="Opens full-screen from your home screen, like a native app.">
      {state === "installed" ? (
        <p className="flex items-center gap-2 text-sm text-success">
          <CircleCheckBigIcon className="size-4" /> Installed on this device
        </p>
      ) : state === "prompt" ? (
        <Button size="xl" onClick={onInstall}>
          <DownloadIcon /> Install Anime Watcher
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          In Safari, tap <ShareIcon className="inline size-4 align-text-bottom" /> <span className="font-medium text-foreground">Share</span>, then{" "}
          <span className="font-medium text-foreground">Add to Home Screen</span>.
        </p>
      )}
    </Section>
  );
}

type PasswordValues = z.infer<typeof resetSchema>;

function AccountSection({
  email,
  onChangePassword,
  onSignOut,
}: {
  email: string;
  onChangePassword: (password: string) => Promise<void>;
  onSignOut: () => void;
}) {
  const [changing, setChanging] = useState(false);
  const form = useForm<PasswordValues>({ resolver: zodResolver(resetSchema), defaultValues: { password: "", confirm: "" } });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async ({ password }) => {
    try {
      await onChangePassword(password);
      toast.success("Password updated.");
      form.reset();
      setChanging(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update the password.");
    }
  });

  return (
    <Section icon={<UserIcon />} title="Account" description={email}>
      {changing ? (
        <form onSubmit={submit} noValidate className="space-y-5">
          <FieldGroup>
            <FormRow id="new-password" label="New password" error={errors.password?.message}>
              <PasswordInput id="new-password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
              <PasswordChecklist value={form.watch("password")} />
            </FormRow>
            <FormRow id="confirm-password" label="Confirm new password" error={errors.confirm?.message}>
              <PasswordInput id="confirm-password" autoComplete="new-password" aria-invalid={!!errors.confirm} {...form.register("confirm")} />
            </FormRow>
          </FieldGroup>
          <div className="flex gap-2">
            <Button type="submit" size="xl" disabled={isSubmitting}>
              {isSubmitting && <Spinner />} Update password
            </Button>
            <Button type="button" variant="ghost" size="xl" onClick={() => setChanging(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="xl" onClick={() => setChanging(true)}>
            <KeyRoundIcon /> Change password
          </Button>
          <Button variant="ghost" size="xl" className="text-destructive hover:text-destructive" onClick={onSignOut}>
            <LogOutIcon /> Sign out
          </Button>
        </div>
      )}
    </Section>
  );
}

export interface SettingsViewProps {
  email: string;
  notifications: ComponentProps<typeof NotificationsSection>;
  install: { state: InstallState; install: () => void };
  onChangePassword: (password: string) => Promise<void>;
  onSignOut: () => void;
}

export function SettingsView({ email, notifications, install, onChangePassword, onSignOut }: SettingsViewProps) {
  return (
    // capped width: settings are forms, long lines read badly on wide monitors
    <div className="max-w-5xl">
      <PageHeader title="Settings" />
      {/* phones/tablets: one column; desktop: two balanced columns */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 3xl:gap-5">
        <div className="grid min-w-0 grid-cols-1 gap-4 3xl:gap-5">
          <NotificationsSection {...notifications} />
          <InstallSection state={install.state} onInstall={install.install} />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-4 3xl:gap-5">
          <AppearanceSection />
          <AccountSection email={email} onChangePassword={onChangePassword} onSignOut={onSignOut} />
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Nyaa is checked every 30 minutes · 1080p+ · English subtitles ·{" "}
        <a href="https://github.com/acarberk/anime-watcher" target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
          Source
        </a>
      </p>
    </div>
  );
}
