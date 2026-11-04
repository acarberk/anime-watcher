import { LogoMark } from "@/components/brand";
import { Spinner } from "@/components/ui/spinner";

export function FullScreenSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="bg-glow grid min-h-dvh place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <LogoMark className="size-12" />
        <Spinner />
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
