import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BellRingIcon,
  CircleCheckBigIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  SendIcon,
  SmartphoneIcon,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { isValidTopic, NTFY_URL, randomTopic } from "./api";
import { TopicDisplay } from "./topic-display";

const STORES = [
  { name: "App Store", note: "iPhone & iPad", href: "https://apps.apple.com/app/ntfy/id1625396347" },
  { name: "Google Play", note: "Android", href: "https://play.google.com/store/apps/details?id=io.heckel.ntfy" },
  { name: "F-Droid", note: "Android, open source", href: "https://f-droid.org/packages/io.heckel.ntfy/" },
];

function Steps({ step }: { step: number }) {
  return (
    <div className="mb-6 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Step {step} of 3</p>
      <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((s) => (
          <span key={s} className={cn("h-1.5 rounded-full transition-colors", s <= step ? "bg-primary" : "bg-muted")} />
        ))}
      </div>
    </div>
  );
}

function Heading({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">{title}</h1>
      <p className="text-[0.9375rem] text-pretty text-muted-foreground">{children}</p>
    </div>
  );
}

export function SetupFlow({
  initialTopic,
  initialStep = 1,
  onTest,
  onFinish,
  finishing,
}: {
  initialTopic?: string | null;
  initialStep?: 1 | 2 | 3;
  onTest: (topic: string) => Promise<void>;
  onFinish: (topic: string) => void;
  finishing: boolean;
}) {
  const [step, setStep] = useState<number>(initialStep);
  const [source, setSource] = useState<"new" | "own">(initialTopic ? "own" : "new");
  const [generated, setGenerated] = useState(() => randomTopic());
  const [own, setOwn] = useState(initialTopic ?? "");
  const [testState, setTestState] = useState<"idle" | "sending" | "sent" | "missing">("idle");
  const topic = source === "new" ? generated : own.trim();
  const topicOk = isValidTopic(topic);

  async function test() {
    setTestState("sending");
    try {
      await onTest(topic);
      setTestState("sent");
    } catch (e) {
      setTestState("idle");
      toast.error(e instanceof Error ? e.message : "Couldn't reach ntfy.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <Steps step={step} />

      {step === 1 && (
        <>
          <Heading title="Get the ntfy app">
            Notifications are delivered by ntfy, a free push app. No account needed — you'll subscribe to a private topic in the
            next step.
          </Heading>
          <ul className="grid gap-2 sm:grid-cols-3">
            {STORES.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-full items-center justify-between gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 sm:flex-col sm:items-start"
                >
                  <span>
                    <span className="block font-medium">{s.name}</span>
                    <span className="block text-[0.8125rem] text-muted-foreground">{s.note}</span>
                  </span>
                  <ExternalLinkIcon className="size-4 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
          <Button size="xl" className="mt-8 w-full sm:w-auto" onClick={() => setStep(2)}>
            I have the app <ArrowRightIcon />
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <Heading title="Subscribe to your topic">
            A topic is your private notification channel. Anyone who knows it can read it, so keep it long and unguessable.
          </Heading>

          <ToggleGroup
            type="single"
            variant="outline"
            value={source}
            onValueChange={(v) => v && setSource(v as "new" | "own")}
            className="mb-4 w-full"
            aria-label="Topic"
          >
            <ToggleGroupItem value="new" className="h-10 flex-1">Create a new one</ToggleGroupItem>
            <ToggleGroupItem value="own" className="h-10 flex-1">I already have one</ToggleGroupItem>
          </ToggleGroup>

          {source === "new" ? (
            <div className="space-y-2">
              <TopicDisplay topic={generated} />
              <Button variant="link" className="h-auto px-0 text-muted-foreground" onClick={() => setGenerated(randomTopic())}>
                <RefreshCwIcon /> Generate another
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Input
                aria-label="Your ntfy topic"
                placeholder="anime-…"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
                value={own}
                aria-invalid={!!own && !topicOk}
                onChange={(e) => setOwn(e.target.value)}
              />
              {own && !topicOk && (
                <p className="text-sm text-destructive">Use 8–64 letters, numbers, dashes or underscores.</p>
              )}
            </div>
          )}

          <div className="mt-6 grid gap-4 rounded-2xl border bg-card p-4 md:grid-cols-[auto_1fr] md:items-center md:gap-6 md:p-5">
            {/* desktop: scan from the phone; phones: open the app directly */}
            {topicOk && (
              <div className="hidden rounded-xl bg-white p-3 md:block">
                <QRCodeSVG value={`${NTFY_URL}/${topic}`} size={136} marginSize={0} aria-label="QR code for your topic" />
              </div>
            )}
            <ol className="space-y-2.5 text-sm">
              <li className="hidden md:block">
                <span className="font-medium">Scan the code with your phone</span>, or in the ntfy app:
              </li>
              <li>
                <span className="text-muted-foreground">1.</span> Tap <span className="font-medium">+</span> to subscribe to a topic
              </li>
              <li>
                <span className="text-muted-foreground">2.</span> Paste the topic and keep the server <span className="font-medium">ntfy.sh</span>
              </li>
              <li>
                <span className="text-muted-foreground">3.</span> Tap <span className="font-medium">Subscribe</span>
              </li>
            </ol>
            {topicOk && (
              <Button asChild variant="outline" size="xl" className="md:hidden">
                <a href={`ntfy://ntfy.sh/${topic}`}>
                  <SmartphoneIcon /> Open in ntfy (Android)
                </a>
              </Button>
            )}
          </div>

          <div className="mt-8 flex gap-2">
            <Button variant="ghost" size="xl" onClick={() => setStep(1)}>
              <ArrowLeftIcon /> Back
            </Button>
            <Button size="xl" className="flex-1 sm:flex-none" disabled={!topicOk} onClick={() => setStep(3)}>
              I've subscribed <ArrowRightIcon />
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <Heading title="Send a test">Make sure notifications reach your phone before you add any anime.</Heading>

          <div className="rounded-2xl border bg-card p-5 text-center">
            {testState === "sent" ? (
              <div className="space-y-4">
                <CircleCheckBigIcon className="mx-auto size-10 text-success" />
                <p className="font-medium">Sent! Did it show up on your phone?</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button size="xl" disabled={finishing} onClick={() => onFinish(topic)}>
                    {finishing && <Spinner />} Yes, finish setup
                  </Button>
                  <Button variant="outline" size="xl" onClick={() => setTestState("missing")}>
                    No, nothing arrived
                  </Button>
                </div>
              </div>
            ) : testState === "missing" ? (
              <div className="space-y-4 text-left">
                <p className="font-medium">Let's check a few things</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• The topic in the app must match exactly: <code className="font-mono text-foreground">{topic}</code></li>
                  <li>• The server in the app should be ntfy.sh.</li>
                  <li>• Notifications for ntfy must be allowed in your phone's settings.</li>
                  <li>• On Android, battery saver can delay notifications for a few minutes.</li>
                </ul>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button size="xl" onClick={test}>
                    <SendIcon /> Send again
                  </Button>
                  <Button variant="ghost" size="xl" onClick={() => setStep(2)}>
                    Change topic
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <BellRingIcon className="mx-auto size-10 text-primary" />
                <p className="text-sm text-muted-foreground">
                  We'll send a notification to <code className="font-mono text-foreground">{topic}</code>.
                </p>
                <Button size="xl" disabled={testState === "sending"} onClick={test}>
                  {testState === "sending" ? <Spinner /> : <SendIcon />} Send test notification
                </Button>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" size="xl" onClick={() => setStep(2)}>
              <ArrowLeftIcon /> Back
            </Button>
            {testState !== "sent" && (
              <Button variant="link" className="text-muted-foreground" disabled={finishing} onClick={() => onFinish(topic)}>
                Skip the test and finish
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
