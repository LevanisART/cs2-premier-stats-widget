declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
  }
}

export function trackEvent(
  event: string,
  props?: Record<string, string | number | boolean>,
) {
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    // analytics must never break the app
  }
}
