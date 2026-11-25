import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { authRoutes } from "./routes/auth";
import { ping } from "./routes/ping";
import { scolarite } from "./routes/scolarite";
import { studentDocumentsApi } from "./routes/scolarite-documents";
import { subjectDocumentsApi } from "./routes/subject-documents";
import { auditApi } from "./routes/audit";
import { referentiel } from "./routes/referentiel";
import { pedagogie } from "./routes/pedagogie";
import { planning } from "./routes/planning";
import { vieScolaire } from "./routes/vie-scolaire";
import { finance } from "./routes/finance";
import { communication } from "./routes/communication";
import { imports } from "./routes/imports";
import { administrativeDocumentsApi } from "./routes/documents";
import { notificationsApi } from "./routes/notifications";
import { exportsApi } from "./routes/exports";
import { lessonsApi } from "./routes/lessons";
import { examsApi } from "./routes/exams";

// API features are oRPC procedures, one file per feature in ./routes/,
// composed into this router — typed end-to-end via the clients
// (web: src/web/lib/api.ts, mobile: lib/api.ts).
// Keep each routes/ file under 500 lines (`bun run lint` enforces this);
// split into more feature files as they grow.
// Patterns and examples: skills/app/references/api.md
export const router = {
  ping,
  scolarite,
  studentDocuments: studentDocumentsApi,
  subjectPrograms: subjectDocumentsApi,
  audit: auditApi,
  referentiel,
  pedagogie,
  planning,
  vieScolaire,
  finance,
  communication,
  imports,
  documents: administrativeDocumentsApi,
  notifications: notificationsApi,
  exports: exportsApi,
  lessons: lessonsApi,
  exams: examsApi,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);
// Authentification réelle (inscription, connexion, session, déconnexion).
app.route("/api/auth", authRoutes);

export default app;
