export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const isAndroid = () => /Android/i.test(navigator.userAgent);

/** Opened from the Home Screen / as an installed app rather than in a browser tab */
export const isStandalone = () =>
  matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

export const isBrave = () => "brave" in navigator;

/** "iPhone", "Android · Chrome", "Windows · Brave"… shown in the device list */
export function deviceLabel(): string {
  const ua = navigator.userAgent;
  if (isIOS()) return /iPad/.test(ua) || navigator.platform === "MacIntel" ? "iPad" : "iPhone";
  const os = isAndroid() ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : /Linux|CrOS/.test(ua) ? "Linux" : "Device";
  const browser = isBrave()
    ? "Brave"
    : /Edg\//.test(ua)
      ? "Edge"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /SamsungBrowser/.test(ua)
          ? "Samsung Internet"
          : /Chrome\//.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : "";
  return browser ? `${os} · ${browser}` : os;
}
