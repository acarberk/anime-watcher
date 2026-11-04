import { ArrowLeftIcon, ArrowRightIcon, BellRingIcon, CircleCheckBigIcon, ExternalLinkIcon, SendIcon, SmartphoneIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { isValidTopic, randomTopic } from "./api";
import { TopicDisplay } from "./topic-display";

// The delivery app (ntfy) and its "topic" are implementation details: the user only installs an app and connects
// their phone. The topic is generated for them and only surfaces as a "code" where iOS needs it pasted by hand.

const STORES = [
  { name: "App Store", note: "iPhone & iPad", href: "https://apps.apple.com/app/ntfy/id1625396347" },
  { name: "Google Play", note: "Android", href: "https://play.google.com/store/apps/details?id=io.heckel.ntfy" },
];

export type Platform = "ios" | "android" | "desktop";
const detectPlatform = (): Platform =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    ? "ios"
    : /Android/i.test(navigator.userAgent)
      ? "android"
      : "desktop";

const connectLink = (code: string) => `ntfy://ntfy.sh/${code}`;

function Steps({ step }: { step: number }) {
  return (
    <div className="mb-6 grid grid-cols-3 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step} aria-label={`Step ${step} of 3`}>
      {[1, 2, 3].map((s) => (
        <span key={s} className={cn("h-1.5 rounded-full transition-colors", s <= step ? "bg-primary" : "bg-muted")} />
      ))}
    </div>
  );
}

function Heading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">{title}</h1>
      {children && <p className="text-[0.9375rem] text-pretty text-muted-foreground">{children}</p>}
    </div>
  );
}

function ConnectStep({ code, platform }: { code: string; platform: Platform }) {
  if (platform === "android") {
    return (
      <div className="space-y-4">
        <Button asChild size="xl" className="w-full">
          <a href={connectLink(code)}>
            <SmartphoneIcon /> Connect this phone
          </a>
        </Button>
        <p className="text-center text-[0.8125rem] text-muted-foreground">Tap Subscribe when the app opens.</p>
      </div>
    );
  }
  if (platform === "ios") {
    return (
      <div className="space-y-4">
        <TopicDisplay topic={code} />
        <ol className="space-y-2 text-[0.9375rem]">
          <li><span className="text-muted-foreground">1.</span> Open the app and tap <span className="font-medium">+</span></li>
          <li><span className="text-muted-foreground">2.</span> Paste the code and tap <span className="font-medium">Subscribe</span></li>
        </ol>
      </div>
    );
  }
  return (
    <div className="grid gap-5 rounded-2xl border bg-card p-5 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="mx-auto rounded-xl bg-white p-3">
        <QRCodeSVG value={connectLink(code)} size={148} marginSize={0} aria-label="QR code to connect your phone" />
      </div>
      <div className="space-y-3 text-[0.9375rem]">
        <p><span className="font-medium">Android:</span> scan the code with your camera, then tap Subscribe.</p>
        <p><span className="font-medium">iPhone:</span> open the app, tap +, and enter this code:</p>
        <TopicDisplay topic={code} />
      </div>
    </div>
  );
}

export function SetupFlow({
  initialTopic,
  initialStep = 1,
  platform: forcedPlatform,
  onTest,
  onFinish,
  finishing,
}: {
  initialTopic?: string | null;
  initialStep?: 1 | 2 | 3;
  platform?: Platform;
  onTest: (topic: string) => Promise<void>;
  onFinish: (topic: string) => void;
  finishing: boolean;
}) {
  const [platform] = useState<Platform>(() => forcedPlatform ?? detectPlatform());
  const [step, setStep] = useState<number>(initialStep);
  const [code, setCode] = useState(() => initialTopic ?? randomTopic());
  const [usingOwn, setUsingOwn] = useState(false);
  const [testState, setTestState] = useState<"idle" | "sending" | "sent" | "missing">("idle");
  const codeOk = isValidTopic(code);

  async function test() {
    setTestState("sending");
    try {
      await onTest(code);
      setTestState("sent");
    } catch {
      setTestState("idle");
      toast.error("Couldn't send the test. Check your connection and try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <Steps step={step} />

      {step === 1 && (
        <>
          <Heading title="Get alerts on your phone">Install the free app that delivers your episode alerts.</Heading>
          <ul className="grid gap-2 sm:grid-cols-2">
            {STORES.filter((s) => platform === "desktop" || (platform === "ios") === (s.name === "App Store")).map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
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
            I've installed it <ArrowRightIcon />
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <Heading title="Connect your phone" />
          {usingOwn ? (
            <div className="space-y-1.5">
              <Input
                aria-label="Your code"
                placeholder="Paste your code"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
                value={code}
                aria-invalid={!!code && !codeOk}
                onChange={(e) => setCode(e.target.value.trim())}
              />
              {code && !codeOk && <p className="text-sm text-destructive">That code doesn't look right.</p>}
            </div>
          ) : (
            <ConnectStep code={code} platform={platform} />
          )}

          <div className="mt-8 flex gap-2">
            <Button variant="ghost" size="xl" onClick={() => setStep(1)}>
              <ArrowLeftIcon /> Back
            </Button>
            <Button size="xl" className="flex-1 sm:flex-none" disabled={!codeOk} onClick={() => setStep(3)}>
              Done <ArrowRightIcon />
            </Button>
          </div>
          <button
            type="button"
            className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => {
              setUsingOwn((u) => !u);
              setCode(usingOwn ? randomTopic() : "");
            }}
          >
            {usingOwn ? "Use a new code instead" : "Already connected the app before? Use your existing code"}
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <Heading title="Send a test" />
          <div className="rounded-2xl border bg-card p-5 text-center">
            {testState === "sent" ? (
              <div className="space-y-4">
                <CircleCheckBigIcon className="mx-auto size-10 text-success" />
                <p className="font-medium">Did it show up on your phone?</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button size="xl" disabled={finishing} onClick={() => onFinish(code)}>
                    {finishing && <Spinner />} Yes, I'm all set
                  </Button>
                  <Button variant="outline" size="xl" onClick={() => setTestState("missing")}>
                    No
                  </Button>
                </div>
              </div>
            ) : testState === "missing" ? (
              <div className="space-y-4 text-left">
                <p className="font-medium">A few things to check</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• The app shows your code in its list.</li>
                  <li>• Notifications for the app are allowed in your phone's settings.</li>
                  <li>• Battery saver can delay alerts by a few minutes.</li>
                </ul>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button size="xl" onClick={test}>
                    <SendIcon /> Try again
                  </Button>
                  <Button variant="ghost" size="xl" onClick={() => setStep(2)}>
                    Reconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <BellRingIcon className="mx-auto size-10 text-primary" />
                <Button size="xl" disabled={testState === "sending"} onClick={test}>
                  {testState === "sending" ? <Spinner /> : <SendIcon />} Send a test alert
                </Button>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" size="xl" onClick={() => setStep(2)}>
              <ArrowLeftIcon /> Back
            </Button>
            {testState !== "sent" && (
              <Button variant="link" className="text-muted-foreground" disabled={finishing || !codeOk} onClick={() => onFinish(code)}>
                Skip
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
