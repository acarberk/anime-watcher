import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { deviceLabel } from "@/lib/platform";
import { currentSubscription, subscribeThisDevice, unsubscribeThisDevice } from "@/lib/push";
import { supabase } from "@/lib/supabase";

const KEY = ["channels"] as const;
export const NTFY_URL = "https://ntfy.sh";

export interface Device {
  id: string;
  endpoint: string;
  device_label: string | null;
  created_at: string;
  last_success_at: string | null;
  last_error: string | null;
}

export interface Channels {
  topic: string | null;
  devices: Device[];
  /** endpoint of this browser's push subscription, if any */
  thisEndpoint: string | null;
}

/** A user can be reached through their ntfy topic or any connected device */
export const hasChannel = (c: Channels | undefined) => !!c && (!!c.topic || c.devices.length > 0);

export function useChannels() {
  const { session } = useAuth();
  return useQuery({
    queryKey: KEY,
    enabled: !!session,
    queryFn: async (): Promise<Channels> => {
      const [profile, devices, sub] = await Promise.all([
        supabase.from("profiles").select("ntfy_topic").maybeSingle(),
        supabase
          .from("push_subscriptions")
          .select("id, endpoint, device_label, created_at, last_success_at, last_error")
          .order("created_at"),
        currentSubscription().catch(() => null),
      ]);
      if (profile.error) throw profile.error;
      if (devices.error) throw devices.error;
      return { topic: profile.data?.ntfy_topic ?? null, devices: devices.data as Device[], thisEndpoint: sub?.endpoint ?? null };
    },
  });
}

// a profile row has to exist first: subscriptions and the watchlist reference it
async function ensureProfile(userId: string) {
  const { error } = await supabase.from("profiles").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) throw error;
}

export function useConnectThisDevice() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const sub = await subscribeThisDevice();
      await ensureProfile(session!.user.id);
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({ ...sub, device_label: deviceLabel() }, { onConflict: "endpoint" });
      // the same browser is still registered to another account (RLS hides and protects that row)
      if (error?.code === "42501") throw new Error("This browser is still connected to another account. Sign out there first.");
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Device) => {
      const { error } = await supabase.from("push_subscriptions").delete().eq("id", d.id);
      if (error) throw error;
      if (d.endpoint === (await currentSubscription())?.endpoint) await unsubscribeThisDevice();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSaveTopic() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (topic: string | null) => {
      const { error } = await supabase.from("profiles").upsert({ user_id: session!.user.id, ntfy_topic: topic });
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Signing out also disconnects this browser, so a shared device stops getting the previous account's alerts */
export async function signOut() {
  try {
    const sub = await currentSubscription();
    if (sub) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
  } catch {
    // never block signing out
  }
  await supabase.auth.signOut();
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
  if (!res.ok) throw new Error("Couldn't send the test alert. Try again in a moment.");
}
