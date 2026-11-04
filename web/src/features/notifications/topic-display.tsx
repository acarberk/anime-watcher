import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** `wrap`: break long values onto the next line instead of truncating (for text people need to read, like a URL) */
export function TopicDisplay({ topic, wrap = false }: { topic: string; wrap?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(topic);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Select the code and copy it manually.");
    }
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-1.5 pl-3.5">
      <code className={cn("min-w-0 flex-1 font-mono text-[0.9375rem] select-all", wrap ? "break-all" : "truncate")}>{topic}</code>
      <Button type="button" variant="secondary" className="h-10 shrink-0" onClick={copy} aria-label="Copy code">
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
