import { SparklesIcon } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

// ponytail: placeholder for the design checkpoint; the watchlist screen replaces it in the next step
export function HomePage() {
  return (
    <Empty className="bg-glow min-h-[60dvh] rounded-3xl border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SparklesIcon />
        </EmptyMedia>
        <EmptyTitle>Your account is ready</EmptyTitle>
        <EmptyDescription>Your watchlist and notification setup will appear here in the next update.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
