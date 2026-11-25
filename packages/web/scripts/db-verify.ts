import { createClient } from "@libsql/client";
import {
  copyFileSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { assertReadableFile, fileUrl } from "./db-path";

/**
 * Vérifie une sauvegarde sans toucher à la base active : copie dans un dossier
 * temporaire, contrôle l'intégrité et les tables attendues.
 * Usage : bun scripts/db-verify.ts [chemin-du-fichier.db]
 */
function latestBackup() {
  const directory = path.resolve("backups");
  const files = readdirSync(directory)
    .filter((name) => name.endsWith(".db"))
    .map((name) => path.join(directory, name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return files[0] ?? "";
}

const source = path.resolve(process.argv[2] ?? latestBackup());
if (!source) {
  console.error("Aucune sauvegarde trouvée. Lancez d'abord bun scripts/db-backup.ts.");
  process.exit(1);
}
assertReadableFile(source, "Sauvegarde");

const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "scolia-restore-"));
const copy = path.join(temporaryDirectory, "restauration.db");
copyFileSync(source, copy);

try {
  const client = createClient({ url: fileUrl(copy) });
  try {
    const integrity = await client.execute("PRAGMA integrity_check");
    const status = String(integrity.rows[0]?.integrity_check ?? "");
    if (status !== "ok") throw new Error(`Intégrité invalide : ${status}`);
    const expected = [
      "establishments",
      "users",
      "students",
      "classes",
      "audit_logs",
      "payments",
      "announcements",
      "administrative_documents",
    ];
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    );
    const names = new Set(tables.rows.map((row) => String(row.name)));
    const missing = expected.filter((name) => !names.has(name));
    if (missing.length) throw new Error(`Tables absentes : ${missing.join(", ")}`);
    const counts = await Promise.all(
      ["establishments", "students", "payments"].map(async (table) => {
        const result = await client.execute(`SELECT COUNT(*) AS n FROM ${table}`);
        return `${table}=${result.rows[0]?.n ?? 0}`;
      }),
    );
    console.log(`Sauvegarde vérifiée : ${source}`);
    console.log(`Intégrité : ok · Tables : ${names.size} · ${counts.join(" · ")}`);
  } finally {
    client.close();
  }
} finally {
  await Bun.sleep(200);
  try {
    rmSync(temporaryDirectory, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
  } catch {
    console.warn(`Copie temporaire conservée (verrou Windows) : ${temporaryDirectory}`);
  }
}
