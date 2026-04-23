const KEY = "logus_admin_auth";

export const ADMIN_USER = "admin";
export const ADMIN_PASS = "logus2025";

export function isAdminAuthed(): boolean {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.logado === true;
  } catch {
    return false;
  }
}

export function loginAdmin() {
  sessionStorage.setItem(KEY, JSON.stringify({ logado: true }));
}

export function logoutAdmin() {
  sessionStorage.removeItem(KEY);
}