import type { AuthUser } from "./api";

const TOKEN_KEY = "Kreli_token";
const USER_KEY  = "Kreli_user";
const SEVEN_DAYS = 7 * 24 * 60 * 60;

function clearStores(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

/**
 * Persist auth.
 * @param rememberMe  true  → localStorage + 7-day cookie (survives browser restart)
 *                    false → sessionStorage + session cookie (cleared when browser closes)
 *                    undefined → keep the storage already in use (for profile updates)
 */
export function saveAuth(token: string, user: AuthUser, rememberMe?: boolean): void {
  if (typeof window === "undefined") return;

  let persistent: boolean;
  if (rememberMe === undefined) {
    persistent = sessionStorage.getItem(TOKEN_KEY) !== null ? false : true;
  } else {
    persistent = rememberMe;
  }

  clearStores();

  const store = persistent ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, token);
  store.setItem(USER_KEY, JSON.stringify(user));

  document.cookie = persistent
    ? `Kreli_token=${token}; path=/; max-age=${SEVEN_DAYS}; SameSite=Lax`
    : `Kreli_token=${token}; path=/; SameSite=Lax`;
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  clearStores();
  document.cookie = "Kreli_token=; path=/; max-age=0";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
