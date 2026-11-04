import { useState } from "react";
import { toast } from "sonner";
import { FullScreenSpinner } from "@/components/full-screen-spinner";
import {
  sendTestNotification,
  signOut,
  useChannels,
  useConnectThisDevice,
  useRemoveDevice,
  useSaveTopic,
} from "@/features/notifications/api";
import type { PushStep } from "@/features/notifications/push-setup";
import { useAuth } from "@/lib/auth";
import { authMessage } from "@/lib/auth-errors";
import { activateUpdate, pushAvailability, PushError, showTestNotification } from "@/lib/push";
import { usePwaInstall } from "@/lib/pwa-install";
import { supabase } from "@/lib/supabase";
import { SettingsView } from "./settings-view";

export function SettingsPage() {
  const { session } = useAuth();
  const channels = useChannels();
  const connect = useConnectThisDevice();
  const removeDevice = useRemoveDevice();
  const saveTopic = useSaveTopic();
  const install = usePwaInstall();
  const [step, setStep] = useState<PushStep | "unconfigured">(() => pushAvailability());

  if (!channels.data) return <FullScreenSpinner />;

  return (
    <SettingsView
      email={session?.user.email ?? ""}
      install={install}
      notifications={{
        channels: channels.data,
        thisDeviceStep: step,
        connecting: connect.isPending,
        onConnect: () => {
          if (step === "update-pending") return void activateUpdate();
          connect.mutate(undefined, {
            onSuccess: () => toast.success("This device will get alerts."),
            onError: (e) => {
              if (e instanceof PushError) {
                if (e.kind !== "dismissed") setStep(e.kind);
              } else toast.error(e.message);
            },
          });
        },
        onRemoveDevice: (d) => removeDevice.mutateAsync(d),
        onTestThisDevice: showTestNotification,
        onSaveTopic: (t) => saveTopic.mutateAsync(t),
        onTestTopic: sendTestNotification,
      }}
      onChangePassword={async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(authMessage(error));
      }}
      onSignOut={() => signOut()}
    />
  );
}
