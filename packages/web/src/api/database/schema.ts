import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Schéma métier Scolia — un établissement (tenant) par ligne dans
 * `establishments`, toutes les autres tables portent `establishmentId` afin que
 * chaque requête serveur soit isolée par établissement.
 * Appliquer avec `bun run db:push` depuis packages/web.
 */

const id = () => text("id").primaryKey();
const createdAt = () => integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date());
const tenant = () =>
  text("establishment_id")
    .notNull()
    .references(() => establishments.id, { onDelete: "cascade" });

export const establishments = sqliteTable(
  "establishments",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    address: text("address").notNull().default(""),
    currency: text("currency").notNull().default("EUR — Euro"),
    periodType: text("period_type").notNull().default("Trimestres"),
    rounding: text("rounding").notNull().default("2 décimales"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("establishments_slug_idx").on(t.slug)],
);

/** Rôles applicatifs. `platform` est réservé à l'exploitant du SaaS. */
export const roles = [
  "direction",
  "administration",
  "teacher",
  "supervisor",
  "accountant",
  "parent",
  "student",
  "platform",
] as const;
export type Role = (typeof roles)[number];

export const users = sqliteTable(
  "users",
  {
    id: id(),
    establishmentId: text("establishment_id").references(() => establishments.id, {
      onDelete: "cascade",
    }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: text("role", { enum: roles }).notNull().default("direction"),
    passwordHash: text("password_hash").notNull(),
    lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), index("users_tenant_idx").on(t.establishmentId)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    /** SHA-256 du jeton : le jeton en clair n'est jamais stocké. */
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const classes = sqliteTable(
  "classes",
  {
    id: id(),
    establishmentId: tenant(),
    name: text("name").notNull(),
    level: text("level").notNull().default(""),
    room: text("room").notNull().default(""),
    capacity: integer("capacity").notNull().default(30),
    mainTeacher: text("main_teacher").notNull().default(""),
    status: text("status").notNull().default("Actif"),
    createdAt: createdAt(),
  },
  (t) => [index("classes_tenant_idx").on(t.establishmentId)],
);

/** Enseignants et personnel de l'établissement. */
export const staff = sqliteTable(
  "staff",
  {
    id: id(),
    establishmentId: tenant(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("Enseignant"),
    specialty: text("specialty").notNull().default(""),
    /** Affectations libres, ex. « 4e A · 3e B ». */
    assignments: text("assignments").notNull().default(""),
    weeklyHours: integer("weekly_hours").notNull().default(0),
    email: text("email").notNull().default(""),
    status: text("status").notNull().default("Actif"),
    createdAt: createdAt(),
  },
  (t) => [index("staff_tenant_idx").on(t.establishmentId)],
);

export const students = sqliteTable(
  "students",
  {
    id: id(),
    establishmentId: tenant(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    reference: text("reference").notNull(),
    classId: text("class_id").references(() => classes.id, { onDelete: "set null" }),
    birthDate: text("birth_date").notNull().default(""),
    sex: text("sex").notNull().default(""),
    address: text("address").notNull().default(""),
    phone: text("phone").notNull().default(""),
    schoolYear: text("school_year").notNull().default(""),
    enrolledAt: text("enrolled_at").notNull().default(""),
    /** Pièces justificatives : nom du fichier déposé, ou chaîne vide si absent. */
    photo: text("photo").notNull().default(""),
    birthCertificate: text("birth_certificate").notNull().default(""),
    transferCertificate: text("transfer_certificate").notNull().default(""),
    status: text("status").notNull().default("En attente de validation"),
    /** Décision d'admission : accepté | refusé | liste d'attente. */
    admissionDecision: text("admission_decision").notNull().default(""),
    admissionNote: text("admission_note").notNull().default(""),
    archivedAt: text("archived_at").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("students_tenant_idx").on(t.establishmentId),
    uniqueIndex("students_reference_idx").on(t.establishmentId, t.reference),
  ],
);

/** Inscriptions annuelles et mouvements d'un élève (§10.3). */
export const enrollments = sqliteTable(
  "enrollments",
  {
    id: id(),
    establishmentId: tenant(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    academicYearId: text("academic_year_id"),
    schoolYear: text("school_year").notNull().default(""),
    classId: text("class_id").references(() => classes.id, { onDelete: "set null" }),
    enrolledAt: text("enrolled_at").notNull().default(""),
    /** inscription | reinscription | transfert | archivage */
    kind: text("kind").notNull().default("inscription"),
    status: text("status").notNull().default("Inscrit"),
    note: text("note").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("enrollments_tenant_idx").on(t.establishmentId),
    index("enrollments_student_idx").on(t.studentId),
  ],
);

export const guardians = sqliteTable(
  "guardians",
  {
    id: id(),
    establishmentId: tenant(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    address: text("address").notNull().default(""),
    status: text("status").notNull().default("Actif"),
    createdAt: createdAt(),
  },
  (t) => [index("guardians_tenant_idx").on(t.establishmentId)],
);

export const studentGuardians = sqliteTable(
  "student_guardians",
  {
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => guardians.id, { onDelete: "cascade" }),
    relation: text("relation").notNull().default("Responsable légal"),
  },
  (t) => [
    index("student_guardians_student_idx").on(t.studentId),
    index("student_guardians_guardian_idx").on(t.guardianId),
  ],
);

/** Journal des événements du dossier d'un élève (création, changement de statut…). */
export const studentHistory = sqliteTable(
  "student_history",
  {
    id: id(),
    establishmentId: tenant(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    detail: text("detail").notNull().default(""),
    actor: text("actor").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("student_history_tenant_idx").on(t.establishmentId),
    index("student_history_student_idx").on(t.studentId),
  ],
);

/** Pièces jointes du dossier élève, stockées en base (contenu base64). */
export const studentDocuments = sqliteTable(
  "student_documents",
  {
    id: id(),
    establishmentId: tenant(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    /** photo | birth_certificate | transfer_certificate | other */
    kind: text("kind").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull().default(""),
    size: integer("size").notNull().default(0),
    content: text("content").notNull().default(""),
    uploadedBy: text("uploaded_by").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("student_documents_tenant_idx").on(t.establishmentId),
    index("student_documents_student_idx").on(t.studentId),
  ],
);

/** Années scolaires (§8) : une année peut contenir plusieurs périodes. */
export const academicYears = sqliteTable(
  "academic_years",
  {
    id: id(),
    establishmentId: tenant(),
    label: text("label").notNull(),
    startsOn: text("starts_on").notNull().default(""),
    endsOn: text("ends_on").notNull().default(""),
    status: text("status").notNull().default("Active"),
    createdAt: createdAt(),
  },
  (t) => [
    index("academic_years_tenant_idx").on(t.establishmentId),
    uniqueIndex("academic_years_label_idx").on(t.establishmentId, t.label),
  ],
);

/** Périodes d'une année (trimestres, semestres…) et fenêtre de saisie des notes. */
export const periods = sqliteTable(
  "periods",
  {
    id: id(),
    establishmentId: tenant(),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    startsOn: text("starts_on").notNull().default(""),
    endsOn: text("ends_on").notNull().default(""),
    gradesDeadline: text("grades_deadline").notNull().default(""),
    status: text("status").notNull().default("Planifiée"),
    createdAt: createdAt(),
  },
  (t) => [
    index("periods_tenant_idx").on(t.establishmentId),
    index("periods_year_idx").on(t.academicYearId),
  ],
);

/** Matières et coefficients (§13). */
export const subjects = sqliteTable(
  "subjects",
  {
    id: id(),
    establishmentId: tenant(),
    name: text("name").notNull(),
    level: text("level").notNull().default(""),
    program: text("program").notNull().default(""),
    coefficient: integer("coefficient").notNull().default(1),
    weeklyHours: integer("weekly_hours").notNull().default(0),
    status: text("status").notNull().default("Actif"),
    createdAt: createdAt(),
  },
  (t) => [
    index("subjects_tenant_idx").on(t.establishmentId),
    uniqueIndex("subjects_name_level_program_idx").on(
      t.establishmentId,
      t.name,
      t.level,
      t.program,
    ),
  ],
);

/** Programme d'une matière, stocké en base (contenu base64). */
export const subjectProgramDocuments = sqliteTable(
  "subject_program_documents",
  {
    id: id(),
    establishmentId: tenant(),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull().default(""),
    size: integer("size").notNull().default(0),
    content: text("content").notNull().default(""),
    uploadedBy: text("uploaded_by").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("subject_program_documents_tenant_idx").on(t.establishmentId),
    uniqueIndex("subject_program_documents_subject_idx").on(t.subjectId),
  ],
);

/** Salles et disponibilités (§9). */
export const rooms = sqliteTable(
  "rooms",
  {
    id: id(),
    establishmentId: tenant(),
    name: text("name").notNull(),
    type: text("type").notNull().default("Salle de cours"),
    capacity: integer("capacity").notNull().default(30),
    equipment: text("equipment").notNull().default(""),
    building: text("building").notNull().default(""),
    status: text("status").notNull().default("Disponible"),
    createdAt: createdAt(),
  },
  (t) => [index("rooms_tenant_idx").on(t.establishmentId)],
);

/** Créneaux horaires du planning (§14.1). */
export const timeSlots = sqliteTable(
  "time_slots",
  {
    id: id(),
    establishmentId: tenant(),
    academicYearId: text("academic_year_id").references(() => academicYears.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull().default(""),
    dayOfWeek: integer("day_of_week").notNull().default(1),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at").notNull(),
    /** Cours | Pause */
    kind: text("kind").notNull().default("Cours"),
    status: text("status").notNull().default("Actif"),
    createdAt: createdAt(),
  },
  (t) => [
    index("time_slots_tenant_idx").on(t.establishmentId),
    index("time_slots_day_idx").on(t.dayOfWeek),
  ],
);

/** Séances du planning (§14.2). Les conflits sont détectés côté serveur. */
export const timetableEntries = sqliteTable(
  "timetable_entries",
  {
    id: id(),
    establishmentId: tenant(),
    academicYearId: text("academic_year_id").references(() => academicYears.id, {
      onDelete: "set null",
    }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    staffId: text("staff_id").references(() => staff.id, { onDelete: "set null" }),
    roomId: text("room_id").references(() => rooms.id, { onDelete: "set null" }),
    slotId: text("slot_id")
      .notNull()
      .references(() => timeSlots.id, { onDelete: "cascade" }),
    /** Brouillon | Validé | Publié */
    status: text("status").notNull().default("Brouillon"),
    note: text("note").notNull().default(""),
    publishedAt: text("published_at").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("timetable_tenant_idx").on(t.establishmentId),
    index("timetable_class_idx").on(t.classId),
    index("timetable_staff_idx").on(t.staffId),
    index("timetable_room_idx").on(t.roomId),
  ],
);

/** Appels et feuilles de présence (§20). */
export const attendanceSessions = sqliteTable(
  "attendance_sessions",
  {
    id: id(),
    establishmentId: tenant(),
    academicYearId: text("academic_year_id").references(() => academicYears.id, {
      onDelete: "set null",
    }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    slotId: text("slot_id").references(() => timeSlots.id, { onDelete: "set null" }),
    subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    takenByUserId: text("taken_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    takenByName: text("taken_by_name").notNull().default(""),
    /** Brouillon | Validé */
    status: text("status").notNull().default("Brouillon"),
    note: text("note").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("attendance_sessions_tenant_idx").on(t.establishmentId),
    index("attendance_sessions_class_date_idx").on(t.classId, t.date),
  ],
);

/** Statut de présence d'un élève pour une session (§20). */
export const attendanceRecords = sqliteTable(
  "attendance_records",
  {
    id: id(),
    establishmentId: tenant(),
    sessionId: text("session_id")
      .notNull()
      .references(() => attendanceSessions.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    /** Présent | Absent | Retard | Absence justifiée | Dispensé */
    status: text("status").notNull().default("Présent"),
    minutesLate: integer("minutes_late").notNull().default(0),
    reason: text("reason").notNull().default(""),
    justification: text("justification").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: text("updated_at").notNull().default(""),
  },
  (t) => [
    index("attendance_records_tenant_idx").on(t.establishmentId),
    index("attendance_records_session_idx").on(t.sessionId),
    uniqueIndex("attendance_records_session_student_idx").on(t.sessionId, t.studentId),
  ],
);

/** Incidents et suivi éducatif (§21). */
export const disciplineIncidents = sqliteTable(
  "discipline_incidents",
  {
    id: id(),
    establishmentId: tenant(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    /** Observation | Avertissement | Sanction | Incident */
    type: text("type").notNull().default("Observation"),
    severity: text("severity").notNull().default("Moyenne"),
    description: text("description").notNull().default(""),
    location: text("location").notNull().default(""),
    responsibleStaffId: text("responsible_staff_id").references(() => staff.id, {
      onDelete: "set null",
    }),
    responsibleName: text("responsible_name").notNull().default(""),
    measures: text("measures").notNull().default(""),
    /** Ouvert | En cours | Résolu | Archivé */
    status: text("status").notNull().default("Ouvert"),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdByName: text("created_by_name").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: text("updated_at").notNull().default(""),
  },
  (t) => [
    index("discipline_tenant_idx").on(t.establishmentId),
    index("discipline_student_idx").on(t.studentId),
    index("discipline_status_idx").on(t.status),
  ],
);

/** Évaluations d'une classe pour une matière et une période (§16). */
export const evaluations = sqliteTable(
  "evaluations",
  {
    id: id(),
    establishmentId: tenant(),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    periodId: text("period_id").references(() => periods.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    coefficient: integer("coefficient").notNull().default(1),
    maxScore: integer("max_score").notNull().default(20),
    date: text("date").notNull().default(""),
    status: text("status").notNull().default("Brouillon"),
    createdBy: text("created_by").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("evaluations_tenant_idx").on(t.establishmentId),
    index("evaluations_class_idx").on(t.classId),
    index("evaluations_period_idx").on(t.periodId),
  ],
);

/** Notes d'une évaluation, une ligne par élève (§16). */
export const grades = sqliteTable(
  "grades",
  {
    id: id(),
    establishmentId: tenant(),
    evaluationId: text("evaluation_id")
      .notNull()
      .references(() => evaluations.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    score: real("score"),
    comment: text("comment").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("grades_tenant_idx").on(t.establishmentId),
    index("grades_evaluation_idx").on(t.evaluationId),
    uniqueIndex("grades_evaluation_student_idx").on(t.evaluationId, t.studentId),
  ],
);

/** Cahier de textes : séances de cours et devoirs (§15). */
export const lessons = sqliteTable(
  "lessons",
  {
    id: id(),
    establishmentId: tenant(),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    teacherName: text("teacher_name").notNull().default(""),
    date: text("date").notNull().default(""),
    startTime: text("start_time").notNull().default(""),
    endTime: text("end_time").notNull().default(""),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    homework: text("homework").notNull().default(""),
    /** Planifié | Réalisé | Annulé */
    status: text("status").notNull().default("Planifié"),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("lessons_tenant_idx").on(t.establishmentId),
    index("lessons_class_idx").on(t.classId),
    index("lessons_date_idx").on(t.date),
  ],
);

/** Bulletins calculés et versionnés par période (§18). */
export const reportCards = sqliteTable(
  "report_cards",
  {
    id: id(),
    establishmentId: tenant(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id, { onDelete: "cascade" }),
    classId: text("class_id").references(() => classes.id, { onDelete: "set null" }),
    average: real("average"),
    /** Brouillon | Validé | Publié */
    status: text("status").notNull().default("Brouillon"),
    generatedAt: text("generated_at").notNull().default(""),
    publishedAt: text("published_at").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("report_cards_tenant_idx").on(t.establishmentId),
    index("report_cards_period_idx").on(t.periodId),
    uniqueIndex("report_cards_student_period_idx").on(t.studentId, t.periodId),
  ],
);

/** Frais et échéances par élève (§22). */
export const feeInvoices = sqliteTable(
  "fee_invoices",
  {
    id: id(),
    establishmentId: tenant(),
    academicYearId: text("academic_year_id").references(() => academicYears.id, {
      onDelete: "set null",
    }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    amountCents: integer("amount_cents").notNull().default(0),
    dueDate: text("due_date").notNull().default(""),
    /** À payer | Partiel | Payé | Annulé */
    status: text("status").notNull().default("À payer"),
    note: text("note").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: text("updated_at").notNull().default(""),
  },
  (t) => [
    index("fee_invoices_tenant_idx").on(t.establishmentId),
    index("fee_invoices_student_idx").on(t.studentId),
    index("fee_invoices_status_idx").on(t.status),
  ],
);

/** Encaissements et reçus (§22). */
export const payments = sqliteTable(
  "payments",
  {
    id: id(),
    establishmentId: tenant(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => feeInvoices.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull().default(0),
    method: text("method").notNull().default("Espèces"),
    reference: text("reference").notNull().default(""),
    paidAt: text("paid_at").notNull(),
    receivedByUserId: text("received_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    receivedByName: text("received_by_name").notNull().default(""),
    /** Validé | Annulé */
    status: text("status").notNull().default("Validé"),
    receiptNumber: text("receipt_number").notNull(),
    note: text("note").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("payments_tenant_idx").on(t.establishmentId),
    index("payments_invoice_idx").on(t.invoiceId),
    index("payments_student_idx").on(t.studentId),
    uniqueIndex("payments_receipt_idx").on(t.establishmentId, t.receiptNumber),
  ],
);

/** Clôtures quotidiennes de caisse (§22). */
export const cashClosures = sqliteTable(
  "cash_closures",
  {
    id: id(),
    establishmentId: tenant(),
    date: text("date").notNull(),
    totalCents: integer("total_cents").notNull().default(0),
    paymentCount: integer("payment_count").notNull().default(0),
    closedByUserId: text("closed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    closedByName: text("closed_by_name").notNull().default(""),
    note: text("note").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("cash_closures_tenant_idx").on(t.establishmentId),
    uniqueIndex("cash_closures_tenant_date_idx").on(t.establishmentId, t.date),
  ],
);

/** Annonces et communication institutionnelle (§24). */
export const announcements = sqliteTable(
  "announcements",
  {
    id: id(),
    establishmentId: tenant(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    /** Tous | Parents | Élèves | Enseignants | Personnel | Classe */
    audience: text("audience").notNull().default("Tous"),
    classId: text("class_id").references(() => classes.id, { onDelete: "set null" }),
    /** Brouillon | Publié | Archivé */
    status: text("status").notNull().default("Brouillon"),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdByName: text("created_by_name").notNull().default(""),
    publishedAt: text("published_at").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: text("updated_at").notNull().default(""),
  },
  (t) => [
    index("announcements_tenant_idx").on(t.establishmentId),
    index("announcements_status_idx").on(t.status),
    index("announcements_audience_idx").on(t.audience),
  ],
);

/** Notifications internes par utilisateur (§24). */
export const notifications = sqliteTable(
  "notifications",
  {
    id: id(),
    establishmentId: tenant(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    /** Annonce | Vie scolaire | Finance | Pédagogie | Système */
    category: text("category").notNull().default("Annonce"),
    /** Page cible dans l'application (messages, fees, reports…). */
    link: text("link").notNull().default("messages"),
    announcementId: text("announcement_id").references(() => announcements.id, {
      onDelete: "cascade",
    }),
    readAt: text("read_at").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("notifications_tenant_idx").on(t.establishmentId),
    index("notifications_user_idx").on(t.userId),
    index("notifications_read_idx").on(t.readAt),
  ],
);

/** Documents administratifs générés et numérotés (§25). */
export const administrativeDocuments = sqliteTable(
  "administrative_documents",
  {
    id: id(),
    establishmentId: tenant(),
    /** certificate | enrollment | class_list */
    kind: text("kind").notNull(),
    reference: text("reference").notNull(),
    title: text("title").notNull(),
    studentId: text("student_id").references(() => students.id, { onDelete: "set null" }),
    classId: text("class_id").references(() => classes.id, { onDelete: "set null" }),
    recipient: text("recipient").notNull().default(""),
    /** Brouillon | Validé | Annulé */
    status: text("status").notNull().default("Brouillon"),
    /** Instantané JSON des données imprimées, figé à la génération. */
    snapshot: text("snapshot").notNull().default("{}"),
    issuedByUserId: text("issued_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    issuedByName: text("issued_by_name").notNull().default(""),
    issuedAt: text("issued_at").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("administrative_documents_tenant_idx").on(t.establishmentId),
    index("administrative_documents_kind_idx").on(t.kind),
    uniqueIndex("administrative_documents_reference_idx").on(t.establishmentId, t.reference),
  ],
);

/** Journal d'audit global (§39) : connexions, actions sensibles, exports. */
export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: id(),
    establishmentId: text("establishment_id").references(() => establishments.id, {
      onDelete: "set null",
    }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    actor: text("actor").notNull().default(""),
    action: text("action").notNull(),
    target: text("target").notNull().default(""),
    detail: text("detail").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_logs_tenant_idx").on(t.establishmentId),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);

/** Examens et délibérations (§19). */
export const exams = sqliteTable(
  "exams",
  {
    id: id(),
    establishmentId: tenant(),
    academicYearId: text("academic_year_id").references(() => academicYears.id, {
      onDelete: "set null",
    }),
    periodId: text("period_id").references(() => periods.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    /** Examen | Conseil de classe | Délibération | Autre */
    type: text("type").notNull().default("Examen"),
    classesLabel: text("classes_label").notNull().default(""),
    datesLabel: text("dates_label").notNull().default(""),
    candidatesCount: integer("candidates_count").notNull().default(0),
    /** Brouillon | Planifié | En cours | Terminé | Archivé */
    status: text("status").notNull().default("Brouillon"),
    notes: text("notes").notNull().default(""),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdByName: text("created_by_name").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("exams_tenant_idx").on(t.establishmentId),
    index("exams_status_idx").on(t.status),
  ],
);

export type Establishment = typeof establishments.$inferSelect;
export type User = typeof users.$inferSelect;
export type ClassRow = typeof classes.$inferSelect;
export type StaffRow = typeof staff.$inferSelect;
export type StudentRow = typeof students.$inferSelect;
export type GuardianRow = typeof guardians.$inferSelect;
