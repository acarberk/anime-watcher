import { ArrowLeftIcon, LogOutIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { activateUpdate, pushAvailability, PushError, showTestNotification, type PushAvailability } from "@/lib/push";
import { sendTestNotification, signOut, useChannels, useConnectThisDevice, useSaveTopic } from "./api";
import { NtfySetup } from "./ntfy-setup";
import { PushSetup, type PushStep } from "./push-setup";

export function SetupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-glow pt-safe pb-safe flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <Button variant="ghost" className="text-muted-foreground" onClick={() => signOut()}>
          <LogOutIcon /> Sign out
        </Button>
      </header>
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 md:justify-center md:py-12">{children}</main>
    </div>
  );
}

const stepFor = (a: PushAvailability): PushStep => (a === "unconfigured" ? "unsupported" : a);

const errorStep: Record<PushError["kind"], PushStep> = {
  denied: "denied",
  dismissed: "ready",
  "push-service": "push-service",
  "update-pending": "update-pending",
};

export function SetupPage() {
  const navigate = useNavigate();
  const channels = useChannels();
  const connect = useConnectThisDevice();
  const saveTopic = useSaveTopic();
  const [mode, setMode] = useState<"push" | "ntfy">(() => (pushAvailability() === "unconfigured" ? "ntfy" : "push"));
  const [step, setStep] = useState<PushStep>(() => stepFor(pushAvailability()));

  function enable() {
    connect.mutate(undefined, {
      onSuccess: () => setStep("enabled"),
      onError: (e) => {
        if (e instanceof PushError) {
          setStep(errorStep[e.kind]);
          if (e.kind === "dismissed") toast("You can turn alerts on whenever you're ready.");
        } else {
          toast.error(e.message || "Couldn't turn on alerts. Try again.");
        }
      },
    });
  }

  return (
    <SetupLayout>
      {mode === "push" ? (
        <PushSetup
          step={step}
          busy={connect.isPending}
          onEnable={enable}
          onRetry={() => setStep(stepFor(pushAvailability()))}
          onTest={() => showTestNotification().catch(() => toast.error("Couldn't show the test alert."))}
          onContinue={() => navigate("/", { replace: true })}
          onReload={activateUpdate}
          onUseNtfy={() => setMode("ntfy")}
        />
      ) : (
        <div className="mx-auto w-full max-w-xl">
          {pushAvailability() !== "unconfigured" && (
            <Button variant="ghost" className="mb-4 -ml-3 text-muted-foreground" onClick={() => setMode("push")}>
              <ArrowLeftIcon /> Use browser alerts instead
            </Button>
          )}
          <NtfySetup
            initialTopic={channels.data?.topic}
            onTest={sendTestNotification}
            finishing={saveTopic.isPending}
            onFinish={(topic) =>
              saveTopic.mutate(topic, {
                onSuccess: () => {
                  toast.success("Alerts are set up.");
                  navigate("/", { replace: true });
                },
                onError: (e) => toast.error(e.message),
              })
            }
          />
        </div>
      )}
    </SetupLayout>
  );
}
