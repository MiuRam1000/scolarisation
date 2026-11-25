import { createClient } from "@libsql/client";
import { statSync } from "node:fs";
import path from "node:path";
import { databasePath, ensureDirectory, fileUrl } from "./db-path";

/**
 * Crée une copie compacte et cohérente de la base locale avec VACUUM INTO.
 * Usage : bun scripts/db-backup.ts [dossier-de-destination]
 */
const source = databasePath();
const destinationDirectory = path.resolve(process.argv[2] ?? "backups");
ensureDirectory(destinationDirectory);

const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\..+$/, "");
const destination = path.join(destinationDirectory, `scolia-${stamp}.db`);
const client = createClient({ url: fileUrl(source) });

try {
  const integrity = await client.execute("PRAGMA integrity_check");
  const status = String(integrity.rows[0]?.integrity_check ?? "");
  if (status !== "ok") throw new Error(`Base source corrompue : ${status}`);
  const escaped = destination.replaceAll("'", "''");
  await client.execute(`VACUUM INTO '${escaped}'`);
  const size = statSync(destination).size;
  console.log(`Sauvegarde créée : ${destination} (${size} octets)`);
} finally {
  client.close();
}
