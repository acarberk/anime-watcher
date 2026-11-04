import { useRegisterSW } from "virtual:pwa-register/react";

const HOUR = 60 * 60 * 1000;

/** Registers the service worker; updates apply on their own (autoUpdate). Long-lived tabs and the installed app also
 *  check for a new build every hour instead of only on the next launch. */
export function UpdatePrompt() {
  useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update().catch(() => {}), HOUR);
    },
  });
  return null;
}
