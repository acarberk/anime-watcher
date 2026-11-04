import { sendTestNotification, useProfile, useSaveTopic } from "@/features/notifications/api";
import { useAuth } from "@/lib/auth";
import { authMessage } from "@/lib/auth-errors";
import { usePwaInstall } from "@/lib/pwa-install";
import { supabase } from "@/lib/supabase";
import { SettingsView } from "./settings-view";

export function SettingsPage() {
  const { session } = useAuth();
  const profile = useProfile();
  const save = useSaveTopic();
  const install = usePwaInstall();

  return (
    <SettingsView
      email={session?.user.email ?? ""}
      topic={profile.data?.ntfy_topic ?? null}
      install={install}
      onSaveTopic={(t) => save.mutateAsync(t)}
      onTest={sendTestNotification}
      onChangePassword={async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(authMessage(error));
      }}
      onSignOut={() => supabase.auth.signOut()}
    />
  );
}
