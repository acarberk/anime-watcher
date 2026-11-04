import { MailIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authMessage } from "@/lib/auth-errors";
import { appUrl, supabase } from "@/lib/supabase";

const COOLDOWN_S = 60; // free Supabase mail is a few per hour; don't let the button burn it

export function ResendConfirmation({ email, variant = "outline" }: { email: string; variant?: "outline" | "link" }) {
  const [sending, setSending] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (!wait) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function resend() {
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: appUrl("auth/callback") },
    });
    setSending(false);
    if (error) return toast.error(authMessage(error));
    toast.success("Confirmation email sent again.");
    setWait(COOLDOWN_S);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={variant === "link" ? "default" : "xl"}
      className={variant === "link" ? "h-auto p-0" : "w-full"}
      disabled={!email || sending || wait > 0}
      onClick={resend}
    >
      {sending ? <Spinner /> : variant === "outline" && <MailIcon />}
      {wait > 0 ? `Resend available in ${wait}s` : "Resend confirmation email"}
    </Button>
  );
}
