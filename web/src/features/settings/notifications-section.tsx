import {
  BellRingIcon,
  ChevronDownIcon,
  LaptopIcon,
  RefreshCwIcon,
  SendIcon,
  SmartphoneIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { isValidTopic, randomTopic, type Channels, type Device } from "@/features/notifications/api";
import { TopicDisplay } from "@/features/notifications/topic-display";
import type { PushStep } from "@/features/notifications/push-setup";
import { formatRelative } from "@/lib/time";
import { cn } from "@/lib/utils";

const message = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

async function run(fn: () => Promise<unknown>, ok?: string) {
  try {
    await fn();
    if (ok) toast.success(ok);
  } catch (e) {
    toast.error(message(e));
  }
}

function DeviceRow({ d, current, onRemove }: { d: Device; current: boolean; onRemove: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const label = d.device_label ?? "Device";
  const Icon = /iPhone|iPad|Android/.test(label) ? SmartphoneIcon : LaptopIcon;
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted [&_svg]:size-4.5">
        <Icon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium">
          {label}
          {current && <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-medium text-accent-foreground">This device</span>}
        </p>
        <p className={cn("truncate text-[0.8125rem]", d.last_error ? "text-warning-foreground dark:text-warning" : "text-muted-foreground")}>
          {d.last_error ? (
            <><TriangleAlertIcon className="mr-1 inline size-3.5 align-[-2px]" />Last alert didn't go through</>
          ) : d.last_success_at ? (
            `Last alert ${formatRelative(d.last_success_at)}`
          ) : (
            "Waiting for the first alert"
          )}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-10 text-muted-foreground hover:text-destructive md:size-9"
        aria-label={`Remove ${label}`}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await run(onRemove, `${label} removed`);
          setBusy(false);
        }}
      >
        {busy ? <Spinner /> : <Trash2Icon />}
      </Button>
    </li>
  );
}

/** What to offer for this browser when it isn't connected yet */
function ThisDevice({ step, busy, onConnect }: { step: PushStep | "unconfigured"; busy: boolean; onConnect: () => void }) {
  const hint: Partial<Record<PushStep, ReactNode>> = {
    "needs-install": "On iPhone, add the app to your Home Screen (Share → Add to Home Screen) to get alerts there.",
    denied: "Notifications are blocked for this site in your browser settings.",
    "push-service": "Brave blocks alerts until “Use Google services for push messaging” is on in brave://settings/privacy.",
    "update-pending": "Reload the app to finish updating, then connect this device.",
  };
  if (step === "unconfigured" || step === "unsupported" || step === "enabled") return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed p-3.5">
      {step === "ready" ? (
        <Button size="xl" className="w-full sm:w-auto" disabled={busy} onClick={onConnect}>
          {busy ? <Spinner /> : <BellRingIcon />} Get alerts on this device
        </Button>
      ) : (
        <p className="text-[0.8125rem] text-muted-foreground">{hint[step]}</p>
      )}
    </div>
  );
}

function NtfyPanel({
  topic,
  onSave,
  onTest,
}: {
  topic: string | null;
  onSave: (topic: string | null) => Promise<void>;
  onTest: (topic: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(!!topic);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(topic ?? "");
  const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    await run(fn, ok);
    setBusy(false);
  };

  return (
    <div className="mt-4 border-t pt-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        Separate notifications app (ntfy)
        <span className="flex items-center gap-2">
          {topic && <span className="text-xs text-success">On</span>}
          <ChevronDownIcon className={cn("size-4 transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open &&
        (editing || !topic ? (
          <div className="space-y-3 pt-2">
            <Input
              aria-label="Connection code"
              className="font-mono"
              spellCheck={false}
              autoComplete="off"
              placeholder="Your code"
              value={draft}
              aria-invalid={!!draft && !isValidTopic(draft)}
              onChange={(e) => setDraft(e.target.value.trim())}
            />
            <p className="text-[0.8125rem] text-muted-foreground">Add the code in the app before saving, or alerts won't arrive there.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="xl" disabled={!isValidTopic(draft) || busy} onClick={() => act(async () => { await onSave(draft); setEditing(false); }, "Saved.")}>
                {busy && <Spinner />} Save code
              </Button>
              <Button variant="outline" size="xl" onClick={() => setDraft(randomTopic())}>
                <RefreshCwIcon /> Generate
              </Button>
              {topic && (
                <Button variant="ghost" size="xl" onClick={() => { setEditing(false); setDraft(topic); }}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <TopicDisplay topic={topic} />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="xl" disabled={busy} onClick={() => act(() => onTest(topic), "Test alert sent. Check your phone.")}>
                {busy ? <Spinner /> : <SendIcon />} Send test
              </Button>
              <Button variant="ghost" size="xl" onClick={() => setEditing(true)}>
                Change code
              </Button>
              <Button variant="ghost" size="xl" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => act(() => onSave(null), "Removed.")}>
                Remove
              </Button>
            </div>
          </div>
        ))}
    </div>
  );
}

export function NotificationsSection({
  channels,
  thisDeviceStep,
  connecting,
  onConnect,
  onRemoveDevice,
  onTestThisDevice,
  onSaveTopic,
  onTestTopic,
}: {
  channels: Channels;
  thisDeviceStep: PushStep | "unconfigured";
  connecting: boolean;
  onConnect: () => void;
  onRemoveDevice: (d: Device) => Promise<void>;
  onTestThisDevice: () => Promise<void>;
  onSaveTopic: (topic: string | null) => Promise<void>;
  onTestTopic: (topic: string) => Promise<void>;
}) {
  const connectedHere = channels.devices.some((d) => d.endpoint === channels.thisEndpoint);
  const nothing = !channels.devices.length && !channels.topic;

  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground [&_svg]:size-4.5">
          <BellRingIcon />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Notifications</h2>
          <p className="text-[0.8125rem] text-muted-foreground">
            {nothing ? "Nothing is connected, so alerts can't reach you." : "Every new episode is sent to all of these."}
          </p>
        </div>
        {connectedHere && (
          <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={() => run(onTestThisDevice)}>
            <SendIcon /> Test
          </Button>
        )}
      </div>

      {channels.devices.length > 0 && (
        <ul className="divide-y">
          {channels.devices.map((d) => (
            <DeviceRow key={d.id} d={d} current={d.endpoint === channels.thisEndpoint} onRemove={() => onRemoveDevice(d)} />
          ))}
        </ul>
      )}

      {!connectedHere && <ThisDevice step={thisDeviceStep} busy={connecting} onConnect={onConnect} />}

      <NtfyPanel topic={channels.topic} onSave={onSaveTopic} onTest={onTestTopic} />
    </section>
  );
}
