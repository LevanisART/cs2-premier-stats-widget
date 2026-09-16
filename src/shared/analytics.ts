declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number | boolean>) => void;
    };
  }
}

export function trackEvent(
  event: string,
  props?: Record<string, string | number | boolean>,
) {
  try {
    window.umami?.track(event, props);
  } catch {
    // analytics must never break the app
  }
}
