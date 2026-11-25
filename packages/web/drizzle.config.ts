import { defineConfig } from "drizzle-kit";

// Base réelle : fichier SQLite local par défaut (aucun service à payer),
// surchargeable par DATABASE_URL (ex. Turso en production).
const url = process.env.DATABASE_URL ?? "file:./.data/scolia.db";
const schema = "./src/api/database/schema.ts";
const out = "./drizzle";

export default url.startsWith("file:")
  ? defineConfig({ dialect: "sqlite", schema, out, dbCredentials: { url } })
  : defineConfig({
      dialect: "turso",
      schema,
      out,
      dbCredentials: { url, authToken: process.env.DATABASE_AUTH_TOKEN ?? "" },
    });
