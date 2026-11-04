import { z } from "zod";

// .env is optional: CI injects env directly
try {
  process.loadEnvFile();
} catch {}

// unset GitHub secrets arrive as "" — treat them as missing
const blank = (v: unknown) => (v === "" ? undefined : v);
const optional = z.preprocess(blank, z.string().optional());

const schema = z
  .object({
    SUPABASE_URL: z.preprocess(blank, z.url()),
    SUPABASE_SERVICE_ROLE_KEY: z.preprocess(blank, z.string()),
    NOTIFY_CHANNELS: z
      .preprocess(blank, z.string().default("ntfy"))
      .transform((s) => s.split(",").map((c) => c.trim()).filter(Boolean))
      .pipe(z.array(z.enum(["ntfy", "telegram"])).min(1)),
    NTFY_URL: z.preprocess(blank, z.url().default("https://ntfy.sh")),
    NTFY_TOPIC: optional,
    NTFY_TOKEN: optional,
    TELEGRAM_BOT_TOKEN: optional,
    TELEGRAM_CHAT_ID: optional,
    // Web Push (VAPID). Without both keys the push channel is skipped, it doesn't crash the run.
    VAPID_PUBLIC_KEY: optional,
    VAPID_PRIVATE_KEY: optional,
    // must be an https: or mailto: URL; Apple's push service rejects anything else
    VAPID_SUBJECT: z.preprocess(blank, z.url().default("https://github.com/acarberk/anime-watcher")),
    REQUEST_DELAY_MS: z.preprocess(blank, z.coerce.number().int().nonnegative().default(1500)),
    // not z.coerce.boolean(): "false" would coerce to true
    DRY_RUN: z.preprocess(blank, z.string().default("false")).transform((s) => s.toLowerCase() === "true"),
  })
  .superRefine((c, ctx) => {
    const need = (channel: string, keys: (keyof typeof c)[]) => {
      for (const k of keys)
        if (!c[k]) ctx.addIssue({ code: "custom", path: [k], message: `${channel} channel is selected but ${k} is empty` });
    };
    if (c.NOTIFY_CHANNELS.includes("ntfy")) need("ntfy", ["NTFY_TOPIC"]);
    if (c.NOTIFY_CHANNELS.includes("telegram")) need("telegram", ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]);
  });

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Configuration error:");
  for (const i of parsed.error.issues) console.error(`  ${i.path.join(".")}: ${i.message}`);
  process.exit(1);
}

export const config = parsed.data;
export type Channel = (typeof config.NOTIFY_CHANNELS)[number];
