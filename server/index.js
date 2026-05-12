import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(__dirname, "data");
const uploadsDir = path.join(__dirname, "uploads");
const pdfDir = path.join(uploadsDir, "pdfs");
const dataFile = path.join(dataDir, "edicoes.json");
const distDir = path.join(rootDir, "dist");
const maxPdfBytes = 50 * 1024 * 1024;

const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3001);
const adminUser = process.env.ADMIN_USER || "admin";
const adminPass = process.env.ADMIN_PASS || (isProduction ? "" : "diario2025");
const authSecret = process.env.ADMIN_SECRET || (isProduction ? "" : "troque-esta-chave-secreta-em-producao");
const tokenTtlMs = Number(process.env.ADMIN_TOKEN_TTL_MS || 1000 * 60 * 60 * 12);

if (isProduction && (!adminPass || !authSecret)) {
  console.error("Defina ADMIN_PASS e ADMIN_SECRET no ambiente de producao.");
  process.exit(1);
}

const app = express();

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

ensureDir(dataDir);
ensureDir(uploadsDir);
ensureDir(pdfDir);

if (!existsSync(dataFile)) {
  await fs.writeFile(dataFile, "[]\n", "utf8");
}

function sanitizeFileName(fileName) {
  const ext = path.extname(fileName).toLowerCase() || ".pdf";
  const base = path
    .basename(fileName, ext)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `${base || "edicao"}-${Date.now()}${ext}`;
}

async function readEdicoes() {
  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeEdicoes(edicoes) {
  await fs.writeFile(dataFile, JSON.stringify(edicoes, null, 2), "utf8");
}

function toPublicEdicao(edicao) {
  return {
    id: edicao.id,
    numero: edicao.numero,
    titulo: edicao.titulo,
    data: edicao.data,
    capaBase64: edicao.capaBase64,
    pdfFileName: edicao.pdfFileName,
    pdfSizeBytes: edicao.pdfSizeBytes,
    createdAt: edicao.createdAt,
    pdfUrl: edicao.pdfStoredName ? `/uploads/pdfs/${edicao.pdfStoredName}` : undefined,
  };
}

function encodeBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

function signPayload(payload) {
  return createHmac("sha256", authSecret).update(payload).digest("base64url");
}

function createAdminToken() {
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: adminUser,
      exp: Date.now() + tokenTtlMs,
      nonce: randomUUID(),
    }),
  );

  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function verifyAdminToken(token) {
  if (!token || !token.includes(".")) {
    return false;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return false;
  }

  const expected = signPayload(payload);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const data = JSON.parse(decodeBase64Url(payload));
    return data?.sub === adminUser && typeof data?.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

function requireAdminAuth(req, res, next) {
  const token = extractBearerToken(req);

  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: "Acesso administrativo nao autorizado." });
    return;
  }

  next();
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, pdfDir);
  },
  filename: (_req, file, cb) => {
    cb(null, sanitizeFileName(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxPdfBytes },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      path.extname(file.originalname).toLowerCase() === ".pdf";

    if (!isPdf) {
      cb(new Error("Envie um arquivo PDF valido."));
      return;
    }

    cb(null, true);
  },
});

app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", (req, res) => {
  const { user, pass } = req.body ?? {};

  if (user !== adminUser || pass !== adminPass) {
    res.status(401).json({ error: "Usuario ou senha incorretos." });
    return;
  }

  res.json({ token: createAdminToken() });
});

app.get("/api/auth/session", requireAdminAuth, (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/logout", (_req, res) => {
  res.status(204).send();
});

app.get("/api/edicoes", async (_req, res, next) => {
  try {
    const edicoes = await readEdicoes();
    const ordered = edicoes
      .sort((a, b) => {
        if (a.data === b.data) return b.numero - a.numero;
        return a.data < b.data ? 1 : -1;
      })
      .map(toPublicEdicao);

    res.json(ordered);
  } catch (error) {
    next(error);
  }
});

app.get("/api/edicoes/:id", async (req, res, next) => {
  try {
    const edicoes = await readEdicoes();
    const edicao = edicoes.find((item) => item.id === req.params.id);

    if (!edicao) {
      res.status(404).json({ error: "Edicao nao encontrada." });
      return;
    }

    res.json(toPublicEdicao(edicao));
  } catch (error) {
    next(error);
  }
});

app.post("/api/edicoes", requireAdminAuth, upload.single("pdf"), async (req, res, next) => {
  try {
    const { titulo, numero, data, capaBase64 } = req.body;
    const pdfFile = req.file;

    if (!titulo || !numero || !data || !pdfFile) {
      if (pdfFile) {
        await fs.unlink(pdfFile.path).catch(() => undefined);
      }

      res.status(400).json({ error: "Preencha titulo, numero, data e PDF." });
      return;
    }

    const edicoes = await readEdicoes();
    const edicao = {
      id: randomUUID(),
      titulo: String(titulo),
      numero: Number(numero),
      data: String(data),
      capaBase64: typeof capaBase64 === "string" && capaBase64.trim() ? capaBase64 : undefined,
      pdfStoredName: pdfFile.filename,
      pdfFileName: pdfFile.originalname,
      pdfSizeBytes: pdfFile.size,
      createdAt: new Date().toISOString(),
    };

    edicoes.push(edicao);
    await writeEdicoes(edicoes);

    res.status(201).json(toPublicEdicao(edicao));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/edicoes/:id", requireAdminAuth, async (req, res, next) => {
  try {
    const edicoes = await readEdicoes();
    const index = edicoes.findIndex((item) => item.id === req.params.id);

    if (index < 0) {
      res.status(404).json({ error: "Edicao nao encontrada." });
      return;
    }

    const [removed] = edicoes.splice(index, 1);
    await writeEdicoes(edicoes);

    if (removed?.pdfStoredName) {
      const pdfPath = path.join(pdfDir, removed.pdfStoredName);
      await fs.unlink(pdfPath).catch(() => undefined);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

if (existsSync(distDir)) {
  app.use(express.static(distDir));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
      next();
      return;
    }

    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: "O PDF excede o limite de 50 MB." });
    return;
  }

  const message = error instanceof Error ? error.message : "Erro interno do servidor.";
  res.status(500).json({ error: message });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
