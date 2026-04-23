import { v4 as uuidv4 } from "uuid";

export interface Edicao {
  id: string;
  numero: number;
  titulo: string;
  data: string; // ISO yyyy-mm-dd
  capaBase64?: string;
  pdfKey?: string; // chave no localStorage onde o base64 do PDF está salvo
  demo?: boolean;
}

const KEY = "diario_edicoes";

const SEED: Edicao[] = [
  {
    id: "demo-243",
    numero: 243,
    titulo: "Edição nº 243",
    data: "2026-02-15",
    demo: true,
  },
  {
    id: "demo-244",
    numero: 244,
    titulo: "Edição nº 244",
    data: "2026-03-10",
    demo: true,
  },
  {
    id: "demo-245",
    numero: 245,
    titulo: "Edição nº 245",
    data: "2026-04-23",
    demo: true,
  },
];

export function getEdicoes(): Edicao[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return [...SEED];
    }
    const parsed = JSON.parse(raw) as Edicao[];
    return parsed.sort((a, b) => b.numero - a.numero);
  } catch {
    return [...SEED];
  }
}

export function saveEdicoes(list: Edicao[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addEdicao(e: Omit<Edicao, "id">): Edicao {
  const list = getEdicoes();
  const novo: Edicao = { ...e, id: uuidv4() };
  list.push(novo);
  saveEdicoes(list);
  return novo;
}

export function removeEdicao(id: string) {
  const list = getEdicoes().filter((e) => e.id !== id);
  saveEdicoes(list);
  // remove pdf
  const pdfKey = `diario_pdf_${id}`;
  localStorage.removeItem(pdfKey);
}

export function getEdicaoById(id: string): Edicao | undefined {
  return getEdicoes().find((e) => e.id === id);
}

export function getPdf(id: string): string | null {
  return localStorage.getItem(`diario_pdf_${id}`);
}

export function savePdf(id: string, dataUrl: string) {
  localStorage.setItem(`diario_pdf_${id}`, dataUrl);
}

export function formatarData(iso: string): string {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}