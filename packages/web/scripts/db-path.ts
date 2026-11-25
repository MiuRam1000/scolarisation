import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";

export function databasePath() {
  const url = process.env.DATABASE_URL ?? "file:./.data/scolia.db";
  if (!url.startsWith("file:")) {
    throw new Error(
      "Sauvegarde locale uniquement : DATABASE_URL doit pointer vers un fichier SQLite (file:...).",
    );
  }
  const raw = url.slice("file:".length).replace(/^\/\//, "");
  if (!raw || raw === ":memory:") {
    throw new Error("Sauvegarde impossible pour une base en mémoire.");
  }
  return path.resolve(raw);
}

export function ensureDirectory(directory: string) {
  mkdirSync(directory, { recursive: true });
  return directory;
}

export function fileUrl(filePath: string) {
  return `file:${filePath.replaceAll("\\", "/")}`;
}

export function assertReadableFile(filePath: string, label: string) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    throw new Error(`${label} introuvable : ${filePath}`);
  }
}
