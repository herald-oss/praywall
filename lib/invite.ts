// When to show the soft "create an account" invitation. Stored only in this
// browser's localStorage (no cookie, nothing sent to the server). Every
// access is wrapped: storage can be blocked (private mode) and the app must
// work the same without it — then the invite simply isn't shown.

const KEY = "praywall_invite_hidden_until";
const DAY = 86_400_000;

export function shouldShowInvite(): boolean {
  try {
    return Date.now() > Number(window.localStorage.getItem(KEY) ?? 0);
  } catch {
    return false;
  }
}

function hideFor(days: number) {
  try {
    window.localStorage.setItem(KEY, String(Date.now() + days * DAY));
  } catch {
    // storage unavailable — nothing to remember
  }
}

/** Shown once: wait a week before inviting again. */
export const markInviteShown = () => hideFor(7);
/** "Not now": wait a month. */
export const dismissInvite = () => hideFor(30);
