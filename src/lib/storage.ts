export interface Edicao {
  id: string;
  numero: number;
  titulo: string;
  data: string;
  capaBase64?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  pdfSizeBytes?: number;
  createdAt?: string;
}

export interface CreateEdicaoInput {
  titulo: string;
  numero: number;
  data: string;
  pdfFile: File;
  capaBase64?: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function getApiUrl(path: string) {
  return `${API_BASE}${path}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Nao foi possivel concluir a requisicao.";

    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // fallback para mensagem padrao
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function getAuthHeaders() {
  const token = sessionStorage.getItem("diario_admin_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getEdicoes(): Promise<Edicao[]> {
  const response = await fetch(getApiUrl("/api/edicoes"));
  return parseResponse<Edicao[]>(response);
}

export async function getEdicaoById(id: string): Promise<Edicao | undefined> {
  const response = await fetch(getApiUrl(`/api/edicoes/${id}`));

  if (response.status === 404) {
    return undefined;
  }

  return parseResponse<Edicao>(response);
}

export async function addEdicao(input: CreateEdicaoInput): Promise<Edicao> {
  const formData = new FormData();
  formData.append("titulo", input.titulo);
  formData.append("numero", String(input.numero));
  formData.append("data", input.data);
  formData.append("pdf", input.pdfFile);

  if (input.capaBase64) {
    formData.append("capaBase64", input.capaBase64);
  }

  const response = await fetch(getApiUrl("/api/edicoes"), {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  return parseResponse<Edicao>(response);
}

export async function removeEdicao(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/api/edicoes/${id}`), {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    let message = "Nao foi possivel excluir a edicao.";

    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // fallback para mensagem padrao
    }

    throw new Error(message);
  }
}

export function formatarData(iso: string): string {
  try {
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
