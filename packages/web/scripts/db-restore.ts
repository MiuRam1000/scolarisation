import { createClient } from "@libsql/client";
import {
  copyFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import {
  assertReadableFile,
  databasePath,
  ensureDirectory,
  fileUrl,
} from "./db-path";

/**
 * Restaure une sauvegarde locale après vérification d'intégrité.
 * Usage : bun scripts/db-restore.ts <chemin-du-fichier.db> [--force]
 * Le serveur doit être arrêté avant la restauration.
 */
const source = path.resolve(process.argv[2] ?? "");
const force = process.argv.includes("--force");
if (!process.argv[2]) {
  console.error("Usage : bun scripts/db-restore.ts <chemin-du-fichier.db> [--force]");
  process.exit(1);
}
assertReadableFile(source, "Sauvegarde");

const target = databasePath();
if (path.resolve(source) === target) {
  console.error("La sauvegarde et la base cible sont identiques.");
  process.exit(1);
}

const inspection = createClient({ url: fileUrl(source) });
try {
  const integrity = await inspection.execute("PRAGMA integrity_check");
  const status = String(integrity.rows[0]?.integrity_check ?? "");
  if (status !== "ok") throw new Error(`Sauvegarde corrompue : ${status}`);
  const tables = await inspection.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  const names = tables.rows.map((row) => String(row.name));
  for (const required of ["establishments", "users", "students", "audit_logs"]) {
    if (!names.includes(required)) {
      throw new Error(`Sauvegarde incomplète : table « ${required} » absente.`);
    }
  }
  console.log(`Sauvegarde valide : ${names.length} tables.`);
} finally {
  inspection.close();
}

if (existsSync(target) && !force) {
  const safetyDirectory = ensureDirectory(path.join(path.dirname(target), "backups"));
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+$/, "");
  const safety = path.join(safetyDirectory, `avant-restauration-${stamp}.db`);
  const client = createClient({ url: fileUrl(target) });
  try {
    const escaped = safety.replaceAll("'", "''");
    await client.execute(`VACUUM INTO '${escaped}'`);
    console.log(`Sauvegarde de sécurité : ${safety}`);
  } finally {
    client.close();
  }
}

ensureDirectory(path.dirname(target));
copyFileSync(source, target);
for (const suffix of ["-wal", "-shm"]) {
  rmSync(`${target}${suffix}`, { force: true });
}

const restored = createClient({ url: fileUrl(target) });
try {
  const integrity = await restored.execute("PRAGMA integrity_check");
  const status = String(integrity.rows[0]?.integrity_check ?? "");
  if (status !== "ok") throw new Error(`Restauration invalide : ${status}`);
  const count = await restored.execute(
    "SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
  );
  console.log(`Restauration terminée : ${target} (${count.rows[0]?.n ?? 0} tables).`);
} finally {
  restored.close();
}
