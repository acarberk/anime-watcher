// One-time Web Push setup: generates the VAPID key pair and stores it in the GitHub repo.
//   node scripts/setup-vapid.mjs
// The private key goes straight into a repo secret and is never printed. The public key becomes a repo variable,
// used by the cron (check.yml) and baked into the web app (pages.yml).
// Refuses to run twice: every device subscription is bound to the public key, so a new pair would silently
// disconnect all of them.
import { execFileSync } from "node:child_process";
import webpush from "web-push";

const gh = (args, input) =>
  execFileSync("gh", args, { input, encoding: "utf8", stdio: [input ? "pipe" : "ignore", "pipe", "inherit"] });

const existing = gh(["variable", "list", "--json", "name", "--jq", ".[].name"]).split("\n").map((s) => s.trim());
if (existing.includes("VAPID_PUBLIC_KEY")) {
  console.error("VAPID_PUBLIC_KEY already exists. Keys are already set up; regenerating them would disconnect every device.");
  process.exit(1);
}

const { publicKey, privateKey } = webpush.generateVAPIDKeys();
gh(["secret", "set", "VAPID_PRIVATE_KEY"], privateKey);
gh(["variable", "set", "VAPID_PUBLIC_KEY", "--body", publicKey]);
console.log("✓ VAPID_PRIVATE_KEY secret and VAPID_PUBLIC_KEY variable are set.");
console.log("Next: re-run the pages workflow so the web app picks up the public key:");
console.log("  gh workflow run pages.yml");
