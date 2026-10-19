/**
 * Shares a link with the native share sheet when available, otherwise copies
 * it. Returns "copied" so the caller can confirm with a toast.
 */
export async function shareLink(data: { url: string; title?: string; text?: string }): Promise<
  "shared" | "copied" | "cancelled" | "failed"
> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    return "copied";
  } catch {
    return "failed";
  }
}
