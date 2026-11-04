import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const KEY = ["profile"] as const;
export const NTFY_URL = "https://ntfy.sh";

export function useProfile() {
  const { session } = useAuth();
  return useQuery({
    queryKey: KEY,
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("ntfy_topic").maybeSingle();
      if (error) throw error;
      return data as { ntfy_topic: string | null } | null;
    },
  });
}

export function useSaveTopic() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (topic: string) => {
      const { error } = await supabase.from("profiles").upsert({ user_id: session!.user.id, ntfy_topic: topic });
      if (error) throw error;
    },
    onSuccess: (_d, topic) => qc.setQueryData(KEY, { ntfy_topic: topic }),
  });
}

/** Long and unguessable: on ntfy.sh, anyone who knows a topic can read it */
export function randomTopic(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789"; // no look-alikes (l/1, o/0)
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return "anime-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export const isValidTopic = (t: string) => /^[A-Za-z0-9_-]{8,64}$/.test(t);

export async function sendTestNotification(topic: string) {
  const res = await fetch(NTFY_URL, {
    method: "POST",
    body: JSON.stringify({
      topic,
      title: "🆕 Anime Watcher",
      message: "Test notification — you're all set.",
      tags: ["tv"],
    }),
  });
  if (!res.ok) throw new Error(`ntfy responded with ${res.status}`);
}
