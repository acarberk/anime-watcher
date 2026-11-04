import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function TopicDisplay({ topic }: { topic: string }) {
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
      <code className="min-w-0 flex-1 truncate font-mono text-[0.9375rem] select-all">{topic}</code>
      <Button type="button" variant="secondary" className="h-10 shrink-0" onClick={copy} aria-label="Copy code">
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
