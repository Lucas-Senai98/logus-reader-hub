const KEY = "diario_admin_auth_token";

function getApiUrl(path: string) {
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  return `${base}${path}`;
}

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(KEY);
}

export async function loginAdmin(user: string, pass: string): Promise<void> {
  const response = await fetch(getApiUrl("/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user, pass }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    token?: string;
    error?: string;
  };

  if (!response.ok || !data.token) {
    throw new Error(data.error || "Nao foi possivel fazer login.");
  }

  setAdminToken(data.token);
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  const response = await fetch(getApiUrl("/api/auth/session"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    clearAdminToken();
    return false;
  }

  return true;
}

export async function logoutAdmin(): Promise<void> {
  const token = getAdminToken();

  try {
    if (token) {
      await fetch(getApiUrl("/api/auth/logout"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch {
    // Mesmo que a requisicao falhe, encerramos a sessao local.
  } finally {
    clearAdminToken();
  }
}
