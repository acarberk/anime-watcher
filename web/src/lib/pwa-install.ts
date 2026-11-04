import { useEffect, useState } from "react";
import { isIOS as ios, isStandalone as standalone } from "./platform";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState = "installed" | "prompt" | "ios" | "unavailable";

/** Chrome/Edge/Android offer a native prompt; iOS needs Share → Add to Home Screen */
export function usePwaInstall() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(standalone);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    addEventListener("beforeinstallprompt", onPrompt);
    addEventListener("appinstalled", onInstalled);
    return () => {
      removeEventListener("beforeinstallprompt", onPrompt);
      removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const state: InstallState = installed ? "installed" : event ? "prompt" : ios() ? "ios" : "unavailable";
  const install = async () => {
    if (!event) return;
    await event.prompt();
    if ((await event.userChoice).outcome === "accepted") setInstalled(true);
    setEvent(null);
  };
  return { state, install };
}
