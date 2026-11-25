import { afterAll, beforeAll, expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Hono } from "hono";

const base = "http://localhost";
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "scolia-tests-"));
const databaseFile = path.join(temporaryDirectory, "test.db");
const databaseUrl = `file:${databaseFile.replaceAll("\\", "/")}`;
const drizzleDirectory = fileURLToPath(new URL("../drizzle", import.meta.url));
let app: Hono;
let client: ReturnType<typeof createClient>;

function cookieFrom(response: Response) {
  const header = response.headers.get("set-cookie");
  return header ? header.split(";")[0] : "";
}

async function request(pathname: string, body: unknown, cookie = "") {
  const rpc = pathname.startsWith("/api/rpc/");
  const response = await app.request(base + pathname, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: base,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(rpc ? { json: body } : body),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  return {
    status: response.status,
    cookie: cookieFrom(response),
    body: (payload?.json ?? payload) as Record<string, unknown>,
  };
}

async function register(schoolName: string, email: string) {
  const result = await request("/api/auth/register", {
    schoolName,
    name: "Directeur Test",
    email,
    password: "MotDePasse123!",
    address: "1 rue des Tests",
  });
  expect([200, 201]).toContain(result.status);
  const establishment = result.body.establishment as { id: string };
  return { cookie: result.cookie, establishmentId: establishment.id };
}

async function applyMigrations() {
  client = createClient({ url: databaseUrl });
  await client.execute("PRAGMA foreign_keys = ON");
  const files = readdirSync(drizzleDirectory)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = readFileSync(path.join(drizzleDirectory, file), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (trimmed) await client.execute(trimmed);
    }
  }
}

beforeAll(async () => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.WEBSITE_URL = base;
  process.env.NODE_ENV = "test";
  await applyMigrations();
  const module = await import("../src/api");
  app = module.default as Hono;
});

afterAll(async () => {
  client.close();
  try {
    rmSync(temporaryDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    // Windows peut conserver un verrou quelques instants sur le fichier SQLite.
  }
});

test("isolation multi-tenant et documents administratifs", async () => {
  const stamp = Date.now();
  const schoolA = await register("École Test A", `direction-a-${stamp}@example.test`);
  const schoolB = await register("École Test B", `direction-b-${stamp}@example.test`);
  const cookieA = schoolA.cookie;
  const cookieB = schoolB.cookie;
  expect(cookieA).not.toBe("");
  expect(cookieB).not.toBe("");

  const createdClass = await request(
    "/api/rpc/scolarite/createClass",
    { name: "6e Test", level: "6e", room: "A1", capacity: 24, mainTeacher: "", status: "Actif" },
    cookieA,
  );
  expect(createdClass.status).toBe(200);
  const classId = createdClass.body.id as string;

  const imported = await request(
    "/api/rpc/imports/importStudents",
    { rows: [{ name: "Léa Test", className: "6e Test", guardianName: "Parent Test" }] },
    cookieA,
  );
  expect(imported.status).toBe(200);
  const importedRows = imported.body.imported as Array<{ id: string }>;
  const studentId = importedRows[0]!.id;

  const document = await request(
    "/api/rpc/documents/generate",
    { kind: "certificate", studentId, classId: "" },
    cookieA,
  );
  expect(document.status).toBe(200);
  const documentId = document.body.id as string;
  const reference = document.body.reference as string;
  expect(reference).toMatch(/^CERT-\d{4}-0001$/);

  const validated = await request("/api/rpc/documents/validate", { id: documentId }, cookieA);
  expect(validated.status).toBe(200);

  const content = await request("/api/rpc/documents/content", { id: documentId }, cookieB);
  expect(content.status).not.toBe(200);
  expect(JSON.stringify(content.body)).toContain("introuvable");

  const snapshotB = await request("/api/rpc/scolarite/snapshot", {}, cookieB);
  expect(snapshotB.status).toBe(200);
  expect((snapshotB.body.classes as unknown[]).length).toBe(0);
  expect((snapshotB.body.students as unknown[]).length).toBe(0);

  const snapshotA = await request("/api/rpc/scolarite/snapshot", {}, cookieA);
  expect((snapshotA.body.classes as unknown[]).length).toBe(1);
  expect((snapshotA.body.students as unknown[]).length).toBe(1);

  const documentSnapshot = await request("/api/rpc/documents/snapshot", {}, cookieA);
  expect(documentSnapshot.status).toBe(200);
  const rows = documentSnapshot.body.documents as Array<{ status: string }>;
  expect(rows[0]?.status).toBe("Validé");

  const { db } = await import("../src/api/database");
  const { users, guardians } = await import("../src/api/database/schema");
  const { createSession } = await import("../src/api/auth/session");
  const teacherId = crypto.randomUUID();
  await db.insert(users).values({
    id: teacherId,
    establishmentId: schoolA.establishmentId,
    email: `teacher-${stamp}@example.test`,
    name: "Enseignant Test",
    role: "teacher",
    passwordHash: "test",
  });
  const teacherSession = await createSession(teacherId);
  const cookieTeacher = `scolia_session=${teacherSession.token}`;

  const teacherRead = await request("/api/rpc/documents/snapshot", {}, cookieTeacher);
  expect(teacherRead.status).toBe(200);
  const teacherGenerate = await request(
    "/api/rpc/documents/generate",
    { kind: "certificate", studentId, classId: "" },
    cookieTeacher,
  );
  expect(teacherGenerate.status).not.toBe(200);
  expect(JSON.stringify(teacherGenerate.body).toLowerCase()).toContain("r");

  const docParentId = crypto.randomUUID();
  await db.insert(users).values({
    id: docParentId,
    establishmentId: schoolA.establishmentId,
    email: `parent-doc-${stamp}@example.test`,
    name: "Parent Document",
    role: "parent",
    passwordHash: "test",
  });
  await db
    .update(guardians)
    .set({ userId: docParentId })
    .where(eq(guardians.establishmentId, schoolA.establishmentId));
  const cookieDocParent = `scolia_session=${(await createSession(docParentId)).token}`;

  const parentDocs = await request("/api/rpc/documents/snapshot", {}, cookieDocParent);
  expect(parentDocs.status).toBe(200);
  const parentRows = parentDocs.body.documents as Array<{ id: string; kind: string; status: string }>;
  expect(parentRows.some((row) => row.id === documentId && row.status === "Validé")).toBe(true);

  const parentContent = await request("/api/rpc/documents/content", { id: documentId }, cookieDocParent);
  expect(parentContent.status).toBe(200);

  const draftDoc = await request(
    "/api/rpc/documents/generate",
    { kind: "enrollment", studentId, classId: "" },
    cookieA,
  );
  expect(draftDoc.status).toBe(200);
  const draftId = draftDoc.body.id as string;
  const parentDraft = await request("/api/rpc/documents/content", { id: draftId }, cookieDocParent);
  expect(parentDraft.status).not.toBe(200);

  const classListDoc = await request(
    "/api/rpc/documents/generate",
    { kind: "class_list", studentId: "", classId },
    cookieA,
  );
  expect(classListDoc.status).toBe(200);
  const classListId = classListDoc.body.id as string;
  const classListValidated = await request("/api/rpc/documents/validate", { id: classListId }, cookieA);
  expect(classListValidated.status).toBe(200);
  const parentAfterClassList = await request("/api/rpc/documents/snapshot", {}, cookieDocParent);
  const parentRows2 = parentAfterClassList.body.documents as Array<{ id: string; kind: string }>;
  expect(parentRows2.some((row) => row.id === classListId)).toBe(false);

  const announcement = await request(
    "/api/rpc/communication/create",
    { title: "Réunion pédagogique", body: "Réunion jeudi à 17h.", audience: "Enseignants", classId: "" },
    cookieA,
  );
  expect(announcement.status).toBe(200);
  const announcementId = announcement.body.id as string;
  const published = await request(
    "/api/rpc/communication/publish",
    { id: announcementId },
    cookieA,
  );
  expect(published.status).toBe(200);
  expect(published.body.notified as number).toBeGreaterThanOrEqual(1);

  const teacherNotifications = await request("/api/rpc/notifications/snapshot", {}, cookieTeacher);
  expect(teacherNotifications.status).toBe(200);
  expect(teacherNotifications.body.unreadCount as number).toBeGreaterThanOrEqual(1);
  const notifications = teacherNotifications.body.notifications as Array<{ id: string }>;
  const notificationId = notifications[0]!.id;

  // Un autre établissement ne peut pas marquer comme lue une notification qui ne lui appartient pas.
  const otherTenant = await request("/api/rpc/notifications/markRead", { id: notificationId }, cookieB);
  expect(otherTenant.status).toBe(200);
  const stillUnread = await request("/api/rpc/notifications/snapshot", {}, cookieTeacher);
  expect(stillUnread.body.unreadCount as number).toBeGreaterThanOrEqual(1);

  const read = await request("/api/rpc/notifications/markRead", { id: notificationId }, cookieTeacher);
  expect(read.status).toBe(200);
  const afterRead = await request("/api/rpc/notifications/snapshot", {}, cookieTeacher);
  expect(afterRead.body.unreadCount as number).toBe(0);

  const auditExport = await request("/api/rpc/exports/audit", {}, cookieA);
  expect(auditExport.status).toBe(200);
  expect(auditExport.body.content as string).toContain("Action");
  expect(auditExport.body.count as number).toBeGreaterThanOrEqual(1);

  const auditExportTeacher = await request("/api/rpc/exports/audit", {}, cookieTeacher);
  expect(auditExportTeacher.status).not.toBe(200);
  expect(JSON.stringify(auditExportTeacher.body)).toContain("rôle");

  const lessonPayload = {
    classId,
    subjectId: "",
    teacherName: "Mme Test",
    date: "2026-11-19",
    startTime: "08:00",
    endTime: "09:00",
    title: "Séance test",
    content: "Contenu de la séance.",
    homework: "Exercices 1 et 2.",
    status: "Réalisé",
  };
  const lesson = await request("/api/rpc/lessons/create", lessonPayload, cookieA);
  expect(lesson.status).toBe(200);
  const lessonId = lesson.body.id as string;

  const lessonSnapshotA = await request("/api/rpc/lessons/snapshot", {}, cookieA);
  expect(lessonSnapshotA.status).toBe(200);
  expect((lessonSnapshotA.body.lessons as unknown[]).length).toBe(1);
  const lessonSnapshotB = await request("/api/rpc/lessons/snapshot", {}, cookieB);
  expect((lessonSnapshotB.body.lessons as unknown[]).length).toBe(0);

  const teacherLesson = await request("/api/rpc/lessons/create", lessonPayload, cookieTeacher);
  expect(teacherLesson.status).toBe(200);
  const lessonUpdate = await request(
    "/api/rpc/lessons/update",
    { id: lessonId, ...lessonPayload, status: "Planifié" },
    cookieA,
  );
  expect(lessonUpdate.status).toBe(200);
  const lessonRemove = await request("/api/rpc/lessons/remove", { id: lessonId }, cookieA);
  expect(lessonRemove.status).toBe(200);

  const parentId = crypto.randomUUID();
  await db.insert(users).values({
    id: parentId,
    establishmentId: schoolA.establishmentId,
    email: `parent-${stamp}@example.test`,
    name: "Parent Test",
    role: "parent",
    passwordHash: "test",
  });
  await db
    .update(guardians)
    .set({ userId: parentId })
    .where(eq(guardians.establishmentId, schoolA.establishmentId));
  const parentSession = await createSession(parentId);
  const cookieParent = `scolia_session=${parentSession.token}`;

  const attendanceDate = "2026-11-19";
  const savedAttendance = await request(
    "/api/rpc/vieScolaire/saveAttendance",
    {
      classId,
      date: attendanceDate,
      validate: true,
      note: "Appel test",
      records: [
        {
          studentId,
          status: "Absent",
          minutesLate: 0,
          reason: "Fièvre",
          justification: "",
        },
      ],
    },
    cookieA,
  );
  expect(savedAttendance.status).toBe(200);
  expect(savedAttendance.body.status).toBe("Validé");

  const parentNotifications = await request("/api/rpc/notifications/snapshot", {}, cookieParent);
  expect(parentNotifications.status).toBe(200);
  expect(parentNotifications.body.unreadCount as number).toBeGreaterThanOrEqual(1);
  const parentNotes = parentNotifications.body.notifications as Array<{
    category: string;
    title: string;
    link: string;
  }>;
  expect(parentNotes.some((n) => n.category === "Vie scolaire" && n.link === "attendance")).toBe(
    true,
  );
  expect(parentNotes.some((n) => n.title === "Absence signalée")).toBe(true);
});

test("référentiel : matières, niveaux et programmes", async () => {
  const stamp = `${Date.now()}-ref`;
  const school = await register("École Référentiel", `direction-ref-${stamp}@example.test`);
  const cookie = school.cookie;

  const first = await request(
    "/api/rpc/referentiel/createSubject",
    {
      name: "Mathématiques",
      level: "4e",
      program: "Programme 2026–2027",
      coefficient: 4,
      weeklyHours: 4,
      status: "Actif",
    },
    cookie,
  );
  expect(first.status).toBe(200);

  const second = await request(
    "/api/rpc/referentiel/createSubject",
    {
      name: "Mathématiques",
      level: "4e",
      program: "Programme 2027–2028",
      coefficient: 4,
      weeklyHours: 4,
      status: "Actif",
    },
    cookie,
  );
  expect(second.status).toBe(200);

  const duplicate = await request(
    "/api/rpc/referentiel/createSubject",
    {
      name: "Mathématiques",
      level: "4e",
      program: "Programme 2026–2027",
      coefficient: 4,
      weeklyHours: 4,
      status: "Actif",
    },
    cookie,
  );
  expect(duplicate.status).toBe(400);

  const snapshot = await request("/api/rpc/referentiel/snapshot", {}, cookie);
  expect(snapshot.status).toBe(200);
  const programs = (snapshot.body.subjects as Array<{ program: string }>)
    .map((s) => s.program)
    .sort();
  expect(programs).toEqual(["Programme 2026–2027", "Programme 2027–2028"]);

  const programText = "Programme de test — contenu texte";
  const uploaded = await request(
    "/api/rpc/subjectPrograms/upload",
    {
      subjectId: first.body.id as string,
      fileName: "programme-test.txt",
      mimeType: "text/plain",
      size: Buffer.byteLength(programText, "utf8"),
      content: Buffer.from(programText, "utf8").toString("base64"),
    },
    cookie,
  );
  expect(uploaded.status).toBe(200);

  const withFile = await request("/api/rpc/referentiel/snapshot", {}, cookie);
  const docs = withFile.body.programDocuments as Array<{
    id: string;
    subjectId: string;
    fileName: string;
  }>;
  expect(docs.length).toBe(1);
  expect(docs[0]?.fileName).toBe("programme-test.txt");
  expect(docs[0]?.subjectId).toBe(first.body.id as string);
  const firstAfterUpload = (withFile.body.subjects as Array<{ id: string; program: string }>).find(
    (s) => s.id === (first.body.id as string),
  );
  expect(firstAfterUpload?.program).toBe("programme-test.txt");

  const downloaded = await request(
    "/api/rpc/subjectPrograms/content",
    { id: docs[0]!.id },
    cookie,
  );
  expect(downloaded.status).toBe(200);
  expect(Buffer.from(String(downloaded.body.content), "base64").toString("utf8")).toBe(programText);

  const { db } = await import("../src/api/database");
  const { users } = await import("../src/api/database/schema");
  const { createSession } = await import("../src/api/auth/session");
  const parentId = crypto.randomUUID();
  await db.insert(users).values({
    id: parentId,
    establishmentId: school.establishmentId,
    email: `parent-ref-${stamp}@example.test`,
    name: "Parent Référentiel",
    role: "parent",
    passwordHash: "test",
  });
  const parentSession = await createSession(parentId);
  const parentCookie = `scolia_session=${parentSession.token}`;
  const parentDownload = await request(
    "/api/rpc/subjectPrograms/content",
    { id: docs[0]!.id },
    parentCookie,
  );
  expect(parentDownload.status).not.toBe(200);

  const replaced = await request(
    "/api/rpc/subjectPrograms/upload",
    {
      subjectId: first.body.id as string,
      fileName: "programme-remplace.txt",
      mimeType: "text/plain",
      size: Buffer.byteLength(programText, "utf8"),
      content: Buffer.from(programText, "utf8").toString("base64"),
    },
    cookie,
  );
  expect(replaced.status).toBe(200);
  const afterReplace = await request("/api/rpc/referentiel/snapshot", {}, cookie);
  expect((afterReplace.body.programDocuments as unknown[]).length).toBe(1);

  const removed = await request(
    "/api/rpc/subjectPrograms/remove",
    { id: replaced.body.id as string },
    cookie,
  );
  expect(removed.status).toBe(200);
  const afterRemove = await request("/api/rpc/referentiel/snapshot", {}, cookie);
  expect((afterRemove.body.programDocuments as unknown[]).length).toBe(0);

  const revised = await request(
    "/api/rpc/referentiel/updateSubject",
    {
      id: second.body.id as string,
      name: "Mathématiques",
      level: "4e",
      program: "Programme 2027–2028 révisé",
      coefficient: 5,
      weeklyHours: 5,
      status: "Actif",
    },
    cookie,
  );
  expect(revised.status).toBe(200);

  const after = await request("/api/rpc/referentiel/snapshot", {}, cookie);
  const updated = (after.body.subjects as Array<{ id: string; program: string; coefficient: number }>).find(
    (s) => s.id === (second.body.id as string),
  );
  expect(updated?.program).toBe("Programme 2027–2028 révisé");
  expect(updated?.coefficient).toBe(5);
});

test("pédagogie : notes, bulletins et visibilité famille", async () => {
  const stamp = `${Date.now()}-ped`;
  const school = await register("École Pédagogie", `direction-ped-${stamp}@example.test`);
  const cookie = school.cookie;

  const createdClass = await request(
    "/api/rpc/scolarite/createClass",
    { name: "5e A", level: "5e", room: "B1", capacity: 30, mainTeacher: "", status: "Actif" },
    cookie,
  );
  expect(createdClass.status).toBe(200);
  const classId = createdClass.body.id as string;

  const imported = await request(
    "/api/rpc/imports/importStudents",
    { rows: [{ name: "Noah Pedago", className: "5e A", guardianName: "Parent Pedago" }] },
    cookie,
  );
  expect(imported.status).toBe(200);
  const studentId = ((imported.body.imported as Array<{ id: string }>)[0] ?? { id: "" }).id;
  expect(studentId).not.toBe("");

  const subject = await request(
    "/api/rpc/referentiel/createSubject",
    { name: "Mathématiques", level: "5e", coefficient: 2, weeklyHours: 4, status: "Actif" },
    cookie,
  );
  expect(subject.status).toBe(200);
  const subjectId = subject.body.id as string;

  const period = await request(
    "/api/rpc/referentiel/createPeriod",
    {
      academicYearLabel: "2026-2027",
      name: "Trimestre 1",
      startsOn: "2026-09-01",
      endsOn: "2026-12-15",
      gradesDeadline: "2026-12-10",
      status: "Active",
    },
    cookie,
  );
  expect(period.status).toBe(200);
  const periodId = period.body.id as string;

  const evaluation = await request(
    "/api/rpc/pedagogie/createEvaluation",
    {
      classId,
      subjectId,
      periodId,
      name: "Contrôle 1",
      coefficient: 1,
      maxScore: 20,
      date: "2026-10-10",
    },
    cookie,
  );
  expect(evaluation.status).toBe(200);
  const evaluationId = evaluation.body.id as string;

  const saved = await request(
    "/api/rpc/pedagogie/saveGrades",
    { evaluationId, entries: [{ studentId, score: 15, comment: "Bien" }] },
    cookie,
  );
  expect(saved.status).toBe(200);

  const validatedEval = await request(
    "/api/rpc/pedagogie/validateEvaluation",
    { id: evaluationId },
    cookie,
  );
  expect(validatedEval.status).toBe(200);
  expect(validatedEval.body.status).toBe("Validé");

  const generated = await request(
    "/api/rpc/pedagogie/generateReportCards",
    { periodId, classId },
    cookie,
  );
  expect(generated.status).toBe(200);
  expect(generated.body.count as number).toBe(1);

  const validatedReports = await request(
    "/api/rpc/pedagogie/validateReportCards",
    { periodId, classId },
    cookie,
  );
  expect(validatedReports.status).toBe(200);

  const { db } = await import("../src/api/database");
  const { guardians, users } = await import("../src/api/database/schema");
  const { createSession } = await import("../src/api/auth/session");

  const parentId = crypto.randomUUID();
  await db.insert(users).values({
    id: parentId,
    establishmentId: school.establishmentId,
    email: `parent-ped-${stamp}@example.test`,
    name: "Parent Pedago",
    role: "parent",
    passwordHash: "test",
  });
  await db
    .update(guardians)
    .set({ userId: parentId })
    .where(eq(guardians.establishmentId, school.establishmentId));
  const parentCookie = `scolia_session=${(await createSession(parentId)).token}`;

  const beforePublish = await request("/api/rpc/pedagogie/snapshot", {}, parentCookie);
  expect(beforePublish.status).toBe(200);
  expect((beforePublish.body.reportCards as unknown[]).length).toBe(0);

  const published = await request(
    "/api/rpc/pedagogie/publishReportCards",
    { periodId, classId },
    cookie,
  );
  expect(published.status).toBe(200);

  const afterPublish = await request("/api/rpc/pedagogie/snapshot", {}, parentCookie);
  expect(afterPublish.status).toBe(200);
  const familyReports = afterPublish.body.reportCards as Array<{
    status: string;
    average: number | null;
  }>;
  expect(familyReports.length).toBe(1);
  expect(familyReports[0]?.status).toBe("Publié");
  expect(familyReports[0]?.average).toBe(15);

  const parentNotifications = await request("/api/rpc/notifications/snapshot", {}, parentCookie);
  expect(parentNotifications.status).toBe(200);
  const notes = parentNotifications.body.notifications as Array<{ title: string; link: string }>;
  expect(notes.some((n) => n.title === "Bulletins publiés" && n.link === "reports")).toBe(true);
});

test("finance : paiements, annulation, clôture et contrôles", async () => {
  const stamp = `${Date.now()}-fin`;
  const school = await register("École Finance", `direction-fin-${stamp}@example.test`);
  const cookie = school.cookie;

  const createdClass = await request(
    "/api/rpc/scolarite/createClass",
    { name: "CM2 Finance", level: "CM2", room: "D1", capacity: 25, mainTeacher: "", status: "Actif" },
    cookie,
  );
  expect(createdClass.status).toBe(200);

  const imported = await request(
    "/api/rpc/imports/importStudents",
    { rows: [{ name: "Emma Finance", className: "CM2 Finance", guardianName: "Parent Finance" }] },
    cookie,
  );
  expect(imported.status).toBe(200);
  const studentId = ((imported.body.imported as Array<{ id: string }>)[0] ?? { id: "" }).id;

  const invoice = await request(
    "/api/rpc/finance/createInvoice",
    {
      studentId,
      label: "Frais de scolarité T1",
      amountCents: 10000,
      dueDate: "2026-10-31",
      note: "",
    },
    cookie,
  );
  expect(invoice.status).toBe(200);
  const invoiceId = invoice.body.id as string;

  const payment = await request(
    "/api/rpc/finance/recordPayment",
    {
      invoiceId,
      amountCents: 6000,
      method: "Espèces",
      reference: `REF-${stamp}`,
      paidAt: "2026-11-10",
      note: "Acompte",
    },
    cookie,
  );
  expect(payment.status).toBe(200);
  const paymentId = payment.body.id as string;
  expect(payment.body.receiptNumber as string).toMatch(/^REC-\d{4}-/);

  const snapshot = await request("/api/rpc/finance/snapshot", {}, cookie);
  expect(snapshot.status).toBe(200);
  const invoices = snapshot.body.invoices as Array<{
    id: string;
    paidCents: number;
    balanceCents: number;
    status: string;
  }>;
  const inv = invoices.find((i) => i.id === invoiceId);
  expect(inv?.paidCents).toBe(6000);
  expect(inv?.balanceCents).toBe(4000);
  expect(inv?.status).toBe("Partiel");

  const { db } = await import("../src/api/database");
  const { users } = await import("../src/api/database/schema");
  const { createSession } = await import("../src/api/auth/session");
  const accountantId = crypto.randomUUID();
  await db.insert(users).values({
    id: accountantId,
    establishmentId: school.establishmentId,
    email: `compta-${stamp}@example.test`,
    name: "Comptable Test",
    role: "accountant",
    passwordHash: "test",
  });
  const accountantCookie = `scolia_session=${(await createSession(accountantId)).token}`;

  const cancelByAccountant = await request(
    "/api/rpc/finance/cancelPayment",
    { id: paymentId, reason: "Erreur" },
    accountantCookie,
  );
  expect(cancelByAccountant.status).not.toBe(200);

  const cancelled = await request(
    "/api/rpc/finance/cancelPayment",
    { id: paymentId, reason: "Erreur de saisie" },
    cookie,
  );
  expect(cancelled.status).toBe(200);

  const afterCancel = await request("/api/rpc/finance/snapshot", {}, cookie);
  const invAfter = (afterCancel.body.invoices as Array<{ id: string; paidCents: number; balanceCents: number; status: string }>).find(
    (i) => i.id === invoiceId,
  );
  expect(invAfter?.paidCents).toBe(0);
  expect(invAfter?.balanceCents).toBe(10000);
  expect(invAfter?.status).toBe("À payer");

  const closed = await request(
    "/api/rpc/finance/closeCash",
    { date: "2026-11-10", note: "Clôture test" },
    cookie,
  );
  expect(closed.status).toBe(200);
  expect(closed.body.totalCents).toBe(0);
  expect(closed.body.paymentCount).toBe(0);

  const closeAgain = await request(
    "/api/rpc/finance/closeCash",
    { date: "2026-11-10", note: "Doublon" },
    cookie,
  );
  expect(closeAgain.status).not.toBe(200);
});

test("planning : conflits, publication et visibilité famille", async () => {
  const stamp = `${Date.now()}-plan`;
  const school = await register("École Planning", `direction-plan-${stamp}@example.test`);
  const cookie = school.cookie;

  const createdClass = await request(
    "/api/rpc/scolarite/createClass",
    { name: "4e B", level: "4e", room: "C1", capacity: 28, mainTeacher: "", status: "Actif" },
    cookie,
  );
  expect(createdClass.status).toBe(200);
  const classId = createdClass.body.id as string;

  const imported = await request(
    "/api/rpc/imports/importStudents",
    { rows: [{ name: "Lina Planning", className: "4e B", guardianName: "Parent Planning" }] },
    cookie,
  );
  expect(imported.status).toBe(200);
  const studentId = ((imported.body.imported as Array<{ id: string }>)[0] ?? { id: "" }).id;

  const subjectA = await request(
    "/api/rpc/referentiel/createSubject",
    { name: "Français", level: "4e", coefficient: 2, weeklyHours: 4, status: "Actif" },
    cookie,
  );
  const subjectB = await request(
    "/api/rpc/referentiel/createSubject",
    { name: "Histoire", level: "4e", coefficient: 1, weeklyHours: 2, status: "Actif" },
    cookie,
  );
  expect(subjectA.status).toBe(200);
  expect(subjectB.status).toBe(200);
  const subjectAId = subjectA.body.id as string;
  const subjectBId = subjectB.body.id as string;

  const slot = await request(
    "/api/rpc/planning/createSlot",
    { name: "Lundi 08h", dayOfWeek: 1, startsAt: "08:00", endsAt: "09:00", kind: "Cours" },
    cookie,
  );
  expect(slot.status).toBe(200);
  const slotId = slot.body.id as string;

  const entryA = await request(
    "/api/rpc/planning/createEntry",
    { classId, subjectId: subjectAId, slotId, note: "Cours A" },
    cookie,
  );
  const entryB = await request(
    "/api/rpc/planning/createEntry",
    { classId, subjectId: subjectBId, slotId, note: "Cours B (conflit)" },
    cookie,
  );
  expect(entryA.status).toBe(200);
  expect(entryB.status).toBe(200);
  const entryBId = entryB.body.id as string;

  const validateWithConflict = await request("/api/rpc/planning/validateSchedule", {}, cookie);
  expect(validateWithConflict.status).not.toBe(200);

  const removed = await request("/api/rpc/planning/deleteEntry", { id: entryBId }, cookie);
  expect(removed.status).toBe(200);

  const validated = await request("/api/rpc/planning/validateSchedule", {}, cookie);
  expect(validated.status).toBe(200);

  const { db } = await import("../src/api/database");
  const { guardians, users } = await import("../src/api/database/schema");
  const { createSession } = await import("../src/api/auth/session");
  const parentId = crypto.randomUUID();
  await db.insert(users).values({
    id: parentId,
    establishmentId: school.establishmentId,
    email: `parent-plan-${stamp}@example.test`,
    name: "Parent Planning",
    role: "parent",
    passwordHash: "test",
  });
  await db
    .update(guardians)
    .set({ userId: parentId })
    .where(eq(guardians.establishmentId, school.establishmentId));
  const parentCookie = `scolia_session=${(await createSession(parentId)).token}`;

  const beforePublish = await request("/api/rpc/planning/snapshot", {}, parentCookie);
  expect(beforePublish.status).toBe(200);
  expect((beforePublish.body.entries as unknown[]).length).toBe(0);

  const published = await request("/api/rpc/planning/publishSchedule", {}, cookie);
  expect(published.status).toBe(200);
  expect(published.body.count as number).toBe(1);

  const afterPublish = await request("/api/rpc/planning/snapshot", {}, parentCookie);
  expect(afterPublish.status).toBe(200);
  const familyEntries = afterPublish.body.entries as Array<{ status: string; classId: string }>;
  expect(familyEntries.length).toBe(1);
  expect(familyEntries[0]?.status).toBe("Publié");
  expect(familyEntries[0]?.classId).toBe(classId);
  expect(afterPublish.body.conflicts as unknown[]).toEqual([]);
});

test("scolarité : admission, réinscription et transferts", async () => {
  const stamp = `${Date.now()}-adm`;
  const school = await register("École Admissions", `direction-adm-${stamp}@example.test`);
  const cookie = school.cookie;

  const classA = await request(
    "/api/rpc/scolarite/createClass",
    { name: "CM1 A", level: "CM1", room: "A1", capacity: 30, mainTeacher: "", status: "Actif" },
    cookie,
  );
  expect(classA.status).toBe(200);
  const classAId = classA.body.id as string;

  const classB = await request(
    "/api/rpc/scolarite/createClass",
    { name: "CM2 B", level: "CM2", room: "B1", capacity: 30, mainTeacher: "", status: "Actif" },
    cookie,
  );
  expect(classB.status).toBe(200);
  const classBId = classB.body.id as string;

  const imported = await request(
    "/api/rpc/imports/importStudents",
    { rows: [{ name: "Inès Admission", className: "CM1 A", guardianName: "Parent Admission" }] },
    cookie,
  );
  expect(imported.status).toBe(200);
  const studentId = ((imported.body.imported as Array<{ id: string }>)[0] ?? { id: "" }).id;
  expect(studentId).not.toBe("");

  const decided = await request(
    "/api/rpc/scolarite/decideAdmission",
    { id: studentId, decision: "accepté", note: "Dossier complet", classId: classAId },
    cookie,
  );
  expect(decided.status).toBe(200);

  let snap = await request("/api/rpc/scolarite/snapshot", {}, cookie);
  let student = (snap.body.students as Array<Record<string, unknown>>).find((s) => s.id === studentId);
  expect(student?.status).toBe("Inscrit");
  expect(student?.admissionDecision).toBe("accepté");
  expect(student?.classId).toBe(classAId);

  const reinscribed = await request(
    "/api/rpc/scolarite/reinscribeStudent",
    { id: studentId, schoolYear: "2027-2028", classId: classBId, note: "Passage en CM2" },
    cookie,
  );
  expect(reinscribed.status).toBe(200);

  snap = await request("/api/rpc/scolarite/snapshot", {}, cookie);
  student = (snap.body.students as Array<Record<string, unknown>>).find((s) => s.id === studentId);
  expect(student?.status).toBe("Inscrit");
  expect(student?.schoolYear).toBe("2027-2028");
  expect(student?.classId).toBe(classBId);
  expect(student?.className).toBe("CM2 B");

  const transferred = await request(
    "/api/rpc/scolarite/transferStudent",
    { id: studentId, classId: classAId, reason: "Rééquilibrage" },
    cookie,
  );
  expect(transferred.status).toBe(200);

  snap = await request("/api/rpc/scolarite/snapshot", {}, cookie);
  student = (snap.body.students as Array<Record<string, unknown>>).find((s) => s.id === studentId);
  expect(student?.classId).toBe(classAId);

  const out = await request(
    "/api/rpc/scolarite/transferOutStudent",
    { id: studentId, destination: "Collège voisin", reason: "Déménagement" },
    cookie,
  );
  expect(out.status).toBe(200);

  snap = await request("/api/rpc/scolarite/snapshot", {}, cookie);
  student = (snap.body.students as Array<Record<string, unknown>>).find((s) => s.id === studentId);
  expect(student?.status).toBe("Transféré");
  const history = (student?.history as Array<{ action: string }>) ?? [];
  expect(history.some((h) => h.action.includes("admission") || h.action.includes("Admission"))).toBe(true);
  expect(history.some((h) => h.action.includes("Réinscription"))).toBe(true);
  expect(history.some((h) => h.action.includes("Transfert"))).toBe(true);
});

test("auth : limitation des tentatives de connexion", async () => {
  const email = `locked-${Date.now()}@example.test`;
  for (let i = 0; i < 5; i += 1) {
    const result = await request("/api/auth/login", { email, password: "MauvaisMotDePasse123!" });
    expect(result.status).toBe(401);
  }
  const blocked = await request("/api/auth/login", { email, password: "MauvaisMotDePasse123!" });
  expect(blocked.status).toBe(429);
  expect(JSON.stringify(blocked.body)).toContain("Trop de tentatives");
}, 15000);

test("exports serveur : élèves et paiements", async () => {
  const stamp = `${Date.now()}-exp`;
  const school = await register("École Exports", `direction-exp-${stamp}@example.test`);
  const cookie = school.cookie;

  const createdClass = await request(
    "/api/rpc/scolarite/createClass",
    { name: "CE2 Export", level: "CE2", room: "E1", capacity: 25, mainTeacher: "", status: "Actif" },
    cookie,
  );
  expect(createdClass.status).toBe(200);
  const imported = await request(
    "/api/rpc/imports/importStudents",
    { rows: [{ name: "Mila Export", className: "CE2 Export", guardianName: "Parent Export" }] },
    cookie,
  );
  expect(imported.status).toBe(200);
  const studentId = ((imported.body.imported as Array<{ id: string }>)[0] ?? { id: "" }).id;

  const invoice = await request(
    "/api/rpc/finance/createInvoice",
    { studentId, label: "Frais Export", amountCents: 5000, dueDate: "2026-11-30", note: "" },
    cookie,
  );
  expect(invoice.status).toBe(200);
  const payment = await request(
    "/api/rpc/finance/recordPayment",
    {
      invoiceId: invoice.body.id as string,
      amountCents: 5000,
      method: "Espèces",
      reference: `EXP-${stamp}`,
      paidAt: "2026-11-15",
      note: "",
    },
    cookie,
  );
  expect(payment.status).toBe(200);

  const studentsExport = await request("/api/rpc/exports/students", {}, cookie);
  expect(studentsExport.status).toBe(200);
  expect(studentsExport.body.count as number).toBeGreaterThanOrEqual(1);
  expect(studentsExport.body.content as string).toContain("Mila");

  const paymentsExport = await request("/api/rpc/exports/financePayments", {}, cookie);
  expect(paymentsExport.status).toBe(200);
  expect(paymentsExport.body.count as number).toBeGreaterThanOrEqual(1);
  expect(paymentsExport.body.content as string).toContain("Frais Export");

  const invoicesExport = await request("/api/rpc/exports/financeInvoices", {}, cookie);
  expect(invoicesExport.status).toBe(200);
  expect(invoicesExport.body.count as number).toBeGreaterThanOrEqual(1);
  expect(invoicesExport.body.content as string).toContain("Frais Export");

  const attendanceExport = await request("/api/rpc/exports/attendance", {}, cookie);
  expect(attendanceExport.status).toBe(200);
  expect(typeof attendanceExport.body.count).toBe("number");
  expect(attendanceExport.body.content as string).toContain("Date");

  const disciplineExport = await request("/api/rpc/exports/discipline", {}, cookie);
  expect(disciplineExport.status).toBe(200);
  expect(typeof disciplineExport.body.count).toBe("number");
  expect(disciplineExport.body.content as string).toContain("Date");

  const examsExport = await request("/api/rpc/exports/exams", {}, cookie);
  expect(examsExport.status).toBe(200);
  expect(typeof examsExport.body.count).toBe("number");
  expect(examsExport.body.content as string).toContain("Titre");

  const { db } = await import("../src/api/database");
  const { users } = await import("../src/api/database/schema");
  const { createSession } = await import("../src/api/auth/session");
  const teacherId = crypto.randomUUID();
  await db.insert(users).values({
    id: teacherId,
    establishmentId: school.establishmentId,
    email: `teacher-exp-${stamp}@example.test`,
    name: "Enseignant Export",
    role: "teacher",
    passwordHash: "test",
  });
  const teacherCookie = `scolia_session=${(await createSession(teacherId)).token}`;
  const denied = await request("/api/rpc/exports/students", {}, teacherCookie);
  expect(denied.status).not.toBe(200);
});

test("examens et délibérations : planification réelle", async () => {
  const stamp = `${Date.now()}-exam`;
  const school = await register("École Examens", `direction-exam-${stamp}@example.test`);
  const cookie = school.cookie;

  const created = await request(
    "/api/rpc/exams/create",
    {
      title: "Conseil de classe T1",
      type: "Conseil de classe",
      classesLabel: "4e A",
      datesLabel: "15 déc.",
      candidatesCount: 30,
      status: "Planifié",
      notes: "Préparation trimestre 1",
      periodId: "",
      academicYearId: "",
    },
    cookie,
  );
  expect(created.status).toBe(200);
  const examId = created.body.id as string;
  expect(typeof examId).toBe("string");

  const snap1 = await request("/api/rpc/exams/snapshot", {}, cookie);
  expect(snap1.status).toBe(200);
  const exams1 = (snap1.body.exams as Array<Record<string, unknown>>) ?? [];
  expect(exams1.some((e) => e.id === examId && e.title === "Conseil de classe T1")).toBe(true);

  const updated = await request(
    "/api/rpc/exams/update",
    {
      id: examId,
      title: "Conseil de classe T1 (modifié)",
      type: "Délibération",
      classesLabel: "4e A",
      datesLabel: "16 déc.",
      candidatesCount: 31,
      status: "En cours",
      notes: "Ajusté",
      periodId: "",
      academicYearId: "",
    },
    cookie,
  );
  expect(updated.status).toBe(200);

  const snap2 = await request("/api/rpc/exams/snapshot", {}, cookie);
  const exams2 = (snap2.body.exams as Array<Record<string, unknown>>) ?? [];
  expect(exams2.some((e) => e.id === examId && e.status === "En cours" && e.candidatesCount === 31)).toBe(true);

  const removed = await request("/api/rpc/exams/remove", { id: examId }, cookie);
  expect(removed.status).toBe(200);

  const snap3 = await request("/api/rpc/exams/snapshot", {}, cookie);
  const exams3 = (snap3.body.exams as Array<Record<string, unknown>>) ?? [];
  expect(exams3.some((e) => e.id === examId)).toBe(false);
});
