import {
  BellOffIcon,
  BellRingIcon,
  CircleCheckBigIcon,
  MonitorSmartphoneIcon,
  RefreshCwIcon,
  SettingsIcon,
  ShareIcon,
  ShieldAlertIcon,
  SquarePlusIcon,
  SmartphoneIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { isAndroid, isIOS } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { TopicDisplay } from "./topic-display";

export type PushStep = "ready" | "needs-install" | "denied" | "unsupported" | "push-service" | "update-pending" | "enabled";

function Hero({ icon, tone = "brand" }: { icon: ReactNode; tone?: "brand" | "ok" | "warn" }) {
  return (
    <div
      className={cn(
        "mb-6 grid size-16 place-items-center rounded-2xl [&_svg]:size-8",
        tone === "brand" && "bg-accent text-accent-foreground",
        tone === "ok" && "bg-success/15 text-success",
        tone === "warn" && "bg-warning/15 text-warning-foreground dark:text-warning",
      )}
    >
      {icon}
    </div>
  );
}

function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6 space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-[1.75rem]">{children}</h1>
      {sub && <p className="text-[0.9375rem] text-pretty text-muted-foreground">{sub}</p>}
    </div>
  );
}

function StepList({ items }: { items: { icon: ReactNode; text: ReactNode }[] }) {
  return (
    <ol className="space-y-3">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3 rounded-xl border bg-card p-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground [&_svg]:size-4.5">{it.icon}</span>
          <span className="min-w-0 flex-1 pt-1.5 text-[0.9375rem]">
            <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
            {it.text}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** What the alerts look like, so "Allow" has an obvious payoff */
function AlertPreview() {
  return (
    <div className="mb-8 flex gap-3 rounded-2xl border bg-card p-4 shadow-lg shadow-black/5" aria-hidden="true">
      <LogoMark className="size-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
          <span>Anime Watcher</span>
          <span>now</span>
        </div>
        <p className="mt-0.5 truncate font-medium">🆕 Frieren S2 — Episode 10</p>
        <p className="truncate text-sm text-muted-foreground">1080p · SubsPlease · 1.4 GiB</p>
      </div>
    </div>
  );
}

const unblockSteps = () =>
  isIOS()
    ? "Open the iPhone Settings app → Notifications → Anime Watcher → Allow Notifications."
    : isAndroid()
      ? "Tap ⋮ in the browser → Settings → Site settings → Notifications, and allow this site."
      : "Click the icon left of the address bar → Notifications → Allow, then reload.";

export function PushSetup({
  step,
  busy,
  onEnable,
  onRetry,
  onTest,
  onContinue,
  onReload,
  onUseNtfy,
}: {
  step: PushStep;
  busy: boolean;
  onEnable: () => void;
  onRetry: () => void;
  onTest: () => void;
  onContinue: () => void;
  onReload: () => void;
  onUseNtfy: () => void;
}) {
  const alternative = step !== "enabled" && (
    <button
      type="button"
      onClick={onUseNtfy}
      className="mt-8 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      Prefer a separate notifications app? Use that instead
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-lg">
      {step === "ready" && (
        <>
          <Hero icon={<BellRingIcon />} />
          <Title sub="Get a notification on this device the moment a new episode of your watchlist is out.">
            Turn on episode alerts
          </Title>
          <AlertPreview />
          <Button size="xl" className="w-full sm:w-auto" disabled={busy} onClick={onEnable}>
            {busy ? <Spinner /> : <BellRingIcon />} Allow notifications
          </Button>
          <p className="mt-3 text-[0.8125rem] text-muted-foreground">Your browser will ask for permission.</p>
        </>
      )}

      {step === "needs-install" && (
        <>
          <Hero icon={<SmartphoneIcon />} />
          <Title sub="On iPhone and iPad, alerts only work from the Home Screen app. It takes a few seconds.">
            Add Anime Watcher to your Home Screen
          </Title>
          <StepList
            items={[
              { icon: <ShareIcon />, text: <>Tap <span className="font-medium">Share</span> in Safari's toolbar</> },
              { icon: <SquarePlusIcon />, text: <>Choose <span className="font-medium">Add to Home Screen</span></> },
              {
                icon: <MonitorSmartphoneIcon />,
                text: <>Open <span className="font-medium">Anime Watcher</span> from your Home Screen and sign in once more</>,
              },
            ]}
          />
        </>
      )}

      {step === "denied" && (
        <>
          <Hero icon={<BellOffIcon />} tone="warn" />
          <Title sub={unblockSteps()}>Notifications are blocked</Title>
          <Button size="xl" className="w-full sm:w-auto" onClick={onRetry}>
            <RefreshCwIcon /> I've allowed them
          </Button>
        </>
      )}

      {step === "unsupported" && (
        <>
          <Hero icon={<BellOffIcon />} tone="warn" />
          <Title sub="Open this site in Chrome, Edge, Firefox or Safari to get alerts here.">This browser can't show alerts</Title>
        </>
      )}

      {step === "push-service" && (
        <>
          <Hero icon={<ShieldAlertIcon />} tone="warn" />
          <Title sub="Brave blocks website alerts until its push service is on.">Turn on push in Brave</Title>
          <StepList
            items={[
              { icon: <SettingsIcon />, text: <>Paste this into the address bar:<span className="mt-2 block"><TopicDisplay topic="brave://settings/privacy" wrap /></span></> },
              { icon: <BellRingIcon />, text: <>Turn on <span className="font-medium">Use Google services for push messaging</span></> },
              { icon: <RefreshCwIcon />, text: <>Restart Brave, come back and try again</> },
            ]}
          />
          <Button size="xl" className="mt-6 w-full sm:w-auto" disabled={busy} onClick={onEnable}>
            {busy ? <Spinner /> : <RefreshCwIcon />} Try again
          </Button>
        </>
      )}

      {step === "update-pending" && (
        <>
          <Hero icon={<RefreshCwIcon />} />
          <Title sub="A newer version of the app is ready. Reload to finish, then turn on alerts.">One moment</Title>
          <Button size="xl" className="w-full sm:w-auto" onClick={onReload}>
            <RefreshCwIcon /> Reload
          </Button>
        </>
      )}

      {step === "enabled" && (
        <>
          <Hero icon={<CircleCheckBigIcon />} tone="ok" />
          <Title sub="This device will get an alert for every new episode. A welcome alert arrives within 30 minutes.">
            Alerts are on
          </Title>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="xl" onClick={onContinue}>
              Go to my watchlist
            </Button>
            <Button variant="outline" size="xl" onClick={onTest}>
              Show a test alert
            </Button>
          </div>
        </>
      )}

      {alternative}
    </div>
  );
}
