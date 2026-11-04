import { LogOutIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { sendTestNotification, useProfile, useSaveTopic } from "./api";
import { SetupFlow } from "./setup-flow";

export function SetupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-glow pt-safe pb-safe flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <Button variant="ghost" className="text-muted-foreground" onClick={() => supabase.auth.signOut()}>
          <LogOutIcon /> Sign out
        </Button>
      </header>
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 md:justify-center md:py-12">{children}</main>
    </div>
  );
}

export function SetupPage() {
  const profile = useProfile();
  const save = useSaveTopic();
  const navigate = useNavigate();

  return (
    <SetupLayout>
      <SetupFlow
        initialTopic={profile.data?.ntfy_topic}
        onTest={sendTestNotification}
        finishing={save.isPending}
        onFinish={(topic) =>
          save.mutate(topic, {
            onSuccess: () => {
              toast.success("Notifications are set up.");
              navigate("/", { replace: true });
            },
            onError: (e) => toast.error(e.message),
          })
        }
      />
    </SetupLayout>
  );
}
