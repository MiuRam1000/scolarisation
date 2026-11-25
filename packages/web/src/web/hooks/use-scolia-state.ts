import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { modules, gradeValues, type DemoRow } from "../lib/demo-data";
import { groups, downloadCsv, downloadCsvContent, useStored } from "../components/scolia-ui";
import {
  exportAuditCsv,
  exportFinancePaymentsCsv,
  exportStudentsCsv,
} from "../lib/exports";
import { logoutRequest, roleToProfile } from "../lib/auth";
import { client } from "../lib/api";
import {
  addStudentGuardian,
  archiveStudent,
  buildReferentielRows,
  buildScolariteRows,
  changeStudentStatus,
  createReferentielRow,
  createScolariteRow,
  decideStudentAdmission,
  downloadStudentDocument,
  downloadSubjectProgram,
  enrollStudent,
  isReferentielModule,
  reinscribeStudent,
  removeStaff,
  removeStudentDocument,
  removeStudentGuardian,
  removeSubjectProgram,
  transferStudent,
  transferOutStudent,
  updateReferentielRow,
  updateScolariteRow,
  updateStudentGuardian,
  updateStudentRecord,
  uploadStudentDocument,
  uploadSubjectProgram,
  type ReferentielModule,
  type ScolariteModule,
  type SnapshotStudent,
} from "../lib/scolarite";
import { useSessionQuery } from "../queries/auth";
import {
  useAttendanceSnapshot,
  useAuditLogs,
  useCommunicationSnapshot,
  useDisciplineSnapshot,
  useFinanceSnapshot,
  usePedagogieSnapshot,
  usePlanningSnapshot,
  useReferentielSnapshot,
  useScolariteSnapshot,
  useAdministrativeDocumentsSnapshot,
  useNotificationsSnapshot,
  useLessonsSnapshot,
  useExamsSnapshot,
} from "../queries/scolarite";
import {
  createEvaluation as createEvaluationRequest,
  generateReportCards,
  publishReportCards,
  saveGrades as saveGradesRequest,
  validateEvaluation as validateEvaluationRequest,
  validateReportCards,
} from "../lib/pedagogie";
import {
  createTimeSlot,
  createTimetableEntry,
  deleteTimetableEntry,
  generatePlanningProposal,
  publishPlanning,
  validatePlanning,
} from "../lib/planning";
import {
  createDisciplineIncident as createDisciplineIncidentRequest,
  saveAttendance as saveAttendanceRequest,
  updateDisciplineIncident as updateDisciplineIncidentRequest,
  type AttendanceDraft,
} from "../lib/vie-scolaire";
import {
  cancelPayment as cancelPaymentRequest,
  closeCash as closeCashRequest,
  createInvoice as createInvoiceRequest,
  recordPayment as recordPaymentRequest,
} from "../lib/finance";
import {
  archiveAnnouncement as archiveAnnouncementRequest,
  createAnnouncement as createAnnouncementRequest,
  publishAnnouncement as publishAnnouncementRequest,
} from "../lib/communication";
import {
  importStudents as importStudentsRequest,
  type StudentImportResult,
} from "../lib/imports";
import {
  markAllNotificationsRead as markAllNotificationsReadRequest,
  markNotificationRead as markNotificationReadRequest,
} from "../lib/notifications";
import {
  createExam as createExamRequest,
  removeExam as removeExamRequest,
  updateExam as updateExamRequest,
  type ExamInput,
} from "../lib/exams";
import {
  createLesson as createLessonRequest,
  removeLesson as removeLessonRequest,
  updateLesson as updateLessonRequest,
  type LessonInput,
} from "../lib/lessons";
import {
  cancelAdministrativeDocument as cancelAdministrativeDocumentRequest,
  generateAdministrativeDocument as generateAdministrativeDocumentRequest,
  validateAdministrativeDocument as validateAdministrativeDocumentRequest,
  type AdministrativeDocumentKind,
} from "../lib/documents";

export function useScoliaState() {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const session = useSessionQuery();
  const [attendanceClassId, setAttendanceClassId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [attendanceDraft, setAttendanceDraft] = useState<AttendanceDraft>({});
  const scolarite = useScolariteSnapshot();
  const referentiel = useReferentielSnapshot();
  const pedagogie = usePedagogieSnapshot();
  const planning = usePlanningSnapshot();
  const role = session.data?.user.role;
  const financeAllowed =
    Boolean(role) &&
    [
      "direction",
      "administration",
      "accountant",
      "parent",
      "student",
    ].includes(role ?? "");
  const finance = useFinanceSnapshot(financeAllowed);
  const communicationAllowed =
    Boolean(role) &&
    [
      "direction",
      "administration",
      "teacher",
      "supervisor",
      "accountant",
      "parent",
      "student",
    ].includes(role ?? "");
  const communication = useCommunicationSnapshot(communicationAllowed);
  const documentsAllowed =
    Boolean(role) &&
    ["direction", "administration", "teacher", "supervisor", "accountant", "parent", "student"].includes(
      role ?? "",
    );
  const administrativeDocuments = useAdministrativeDocumentsSnapshot(documentsAllowed);
  const notificationsEnabled =
    Boolean(role) &&
    ["direction", "administration", "teacher", "supervisor", "accountant", "parent", "student"].includes(
      role ?? "",
    );
  const notificationsQuery = useNotificationsSnapshot(notificationsEnabled);
  const lessonsEnabled =
    Boolean(role) &&
    ["direction", "administration", "teacher", "supervisor", "parent", "student"].includes(
      role ?? "",
    );
  const lessonsQuery = useLessonsSnapshot(lessonsEnabled);
  const examsEnabled =
    Boolean(role) &&
    ["direction", "administration", "teacher", "supervisor"].includes(role ?? "");
  const examsQuery = useExamsSnapshot(examsEnabled);
  const attendanceAllowed =
    Boolean(role) &&
    [
      "direction",
      "administration",
      "supervisor",
      "teacher",
      "parent",
      "student",
    ].includes(role ?? "");
  const disciplineAllowed =
    Boolean(role) &&
    ["direction", "administration", "supervisor", "teacher"].includes(role ?? "");
  const attendance = useAttendanceSnapshot(
    { classId: attendanceClassId || undefined, date: attendanceDate },
    attendanceAllowed,
  );
  const discipline = useDisciplineSnapshot(disciplineAllowed);
  const audit = useAuditLogs(
    session.data?.user.role === "direction" ||
      session.data?.user.role === "administration" ||
      session.data?.user.role === "platform",
  );
  const current = location.replace("/", "") || "dashboard";
  const realProfile = roleToProfile(session.data?.user.role);
  const [profile, setProfile] = useState(realProfile);
  const [school, setSchool] = useState(
    session.data?.establishment?.name ?? "Mon établissement",
  );
  const [year, setYear] = useState("2026–2027");
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<{
    kind: string;
    name?: string;
    row?: DemoRow;
    reportCardId?: string;
  } | null>(null);
  const [detail, setDetail] = useState<DemoRow | null>(null);
  const [detailTab, setDetailTab] = useState("Informations");
  const [customRows, setCustomRows] = useStored<Record<string, DemoRow[]>>("scolia-rows", {});
  const [filter, setFilter] = useState("Tous");
  const [checked, setChecked] = useState<string[]>([]);
  const [notes, setNotes] = useStored<(number | null)[]>("scolia-notes", gradeValues);
  const [gradeStage, setGradeStage] = useState("Brouillon");
  const [reportStage, setReportStage] = useState("Brouillon");
  const [selectedEvaluationId, setSelectedEvaluationId] = useState("");
  const [reportPeriodId, setReportPeriodId] = useState("");
  const [reportClassId, setReportClassId] = useState("");
  const [scheduleStage, setScheduleStage] = useState("Publié");
  const [week, setWeek] = useState(0);
  const [scheduleView, setScheduleView] = useState("4e A");
  const [scheduleClassId, setScheduleClassId] = useState("");
  const [attend, setAttend] = useStored<Record<string, string>>("scolia-attendance", {});
  const [settings, setSettings] = useStored("scolia-settings", {
    name: "Institution Saint-Exupéry",
    email: "contact@saint-exupery.example.com",
    phone: "+33 1 00 00 00 00",
    address: "24, avenue des Écoles",
    currency: "EUR — Euro",
    period: "Trimestres",
    rounding: "2 décimales",
  });
  const [settingsTab, setSettingsTab] = useState("Identité");
  const [importRows, setImportRows] = useState<string[][]>([]);
  const [importError, setImportError] = useState("");
  const [importFile, setImportFile] = useState("");
  const [importResult, setImportResult] = useState<StudentImportResult | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [portalTab, setPortalTab] = useState("Synthèse");
  const [receipt, setReceipt] = useState<DemoRow | null>(null);
  const notify = (s: string) => setToast(s);
  const liveRows = useMemo(() => buildScolariteRows(scolarite.data), [scolarite.data]);
  const referentielRows = useMemo(
    () => buildReferentielRows(referentiel.data),
    [referentiel.data],
  );
  const auditRows = useMemo<DemoRow[]>(
    () =>
      (audit.data ?? []).map((entry) => ({
        name: entry.action,
        sub: entry.target || "—",
        fields: [
          entry.actor || "Système",
          "Scolarité",
          new Date(entry.createdAt).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        ],
        status: "Journalisé",
      })),
    [audit.data],
  );
  useEffect(() => setProfile(realProfile), [realProfile]);
  useEffect(() => {
    if (session.data?.establishment?.name) setSchool(session.data.establishment.name);
  }, [session.data?.establishment?.name]);
  useEffect(() => {
    const server = referentiel.data?.settings;
    if (!server) return;
    setSettings((current) => ({
      ...current,
      name: server.name,
      email: server.email,
      phone: server.phone,
      address: server.address,
      currency: server.currency,
      period: server.periodType,
      rounding: server.rounding,
    }));
  }, [referentiel.data?.settings, setSettings]);
  useEffect(() => {
    const data = attendance.data;
    if (!data) return;
    const family = role === "parent" || role === "student";
    const draft: AttendanceDraft = {};
    for (const student of data.students) {
      draft[student.id] = {
        status: student.status || (family ? "" : "Présent"),
        minutesLate: student.minutesLate || 0,
        reason: student.reason || "",
        justification: student.justification || "",
      };
    }
    setAttendanceDraft(draft);
  }, [attendance.data, role]);
  useEffect(() => {
    if (!modal && !receipt && !detail) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLDialogElement>("dialog.modal, dialog.drawer");
    if (!dialog) return;
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]",
        ),
      ).filter((el) => el.offsetParent !== null && el.tabIndex >= 0);
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      if (previous?.isConnected) previous.focus();
    };
  }, [modal, receipt, detail]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    setSearch("");
    setFilter("Tous");
    setChecked([]);
    setMobile(false);
    setDetail(null);
  }, [current]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setReceipt(null);
        setModal(null);
        setDetail(null);
        setNotifications(false);
        setMobile(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const go = (id: string) => navigate("/" + id);
  const isFamily = profile === "Parent" || profile === "Élève";
  const isPlatform = profile === "Plateforme SaaS";
  const baseGroups = isPlatform
    ? [
        {
          label: "ESPACE PLATEFORME",
          ids: ["dashboard", "tenants", "subscriptions", "support", "health", "audit"],
        },
        { label: "DÉMONSTRATION", ids: ["settings", "login"] },
      ]
    : isFamily
      ? [
          {
            label: "MON ESPACE",
            ids: [
              "portal",
              "schedule",
              "grades",
              "reports",
              "attendance",
              "lessons",
              "messages",
              "documents",
              ...(profile === "Parent" ? ["payments"] : []),
            ],
          },
        ]
      : profile === "Enseignant"
        ? [
            {
              label: "ESPACE ENSEIGNANT",
              ids: [
                "dashboard",
                "schedule",
                "classes",
                "lessons",
                "grades",
                "reports",
                "attendance",
                "messages",
              ],
            },
          ]
        : profile === "Comptable"
          ? [
              {
                label: "ESPACE COMPTABLE",
                ids: ["dashboard", "payments", "fees", "cash", "documents", "messages"],
              },
            ]
          : profile === "Surveillant"
            ? [
                {
                  label: "VIE SCOLAIRE",
                  ids: ["dashboard", "attendance", "discipline", "classes", "messages"],
                },
              ]
            : groups.filter((g) => g.label !== "PLATEFORME");
  const extraSectionGroups = (label: string) =>
    groups
      .filter((g) => g.label === label)
      .map((g) => ({
        ...g,
        ids: g.ids.filter((id) => !baseGroups.some((b) => b.ids.includes(id))),
      }))
      .filter((g) => g.ids.length > 0);
  // Les sections SCOLARITÉ et PÉDAGOGIE restent allumées pour tous les profils de
  // démonstration, sans dupliquer les écrans déjà présents dans le menu du profil.
  const visibleGroups = isPlatform
    ? baseGroups
    : [...baseGroups, ...extraSectionGroups("SCOLARITÉ"), ...extraSectionGroups("PÉDAGOGIE")];
  const module = modules.find((m) => m.id === current);
  const scolariteModule = module && (module.section === "SCOLARITÉ" ? module.id : null);
  const allRows = module
    ? scolariteModule
      ? liveRows[scolariteModule as ScolariteModule]
      : current === "audit"
        ? auditRows
        : isReferentielModule(current)
          ? referentielRows[current]
          : customRows[current] || module.rows
    : [];
  const filtered = allRows.filter(
    (r) =>
      (!isFamily || current !== "documents" || r.fields.includes("Emma Laurent")) &&
      (r.name + " " + r.sub + " " + r.fields.join(" "))
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "Tous" || r.status === filter || r.fields.includes(filter)),
  );
  function setNewProfile(p: string) {
    if (p !== profile) {
      notify("Le rôle est déterminé par votre compte : la direction peut le modifier.");
    }
    go(p === "Parent" || p === "Élève" ? "portal" : "dashboard");
  }
  async function signOut() {
    await logoutRequest();
    queryClient.clear();
    queryClient.setQueryData(["session"], null);
  }
  async function saveScolariteRow(moduleId: ScolariteModule, values: Record<string, string>) {
    await createScolariteRow(moduleId, values, scolarite.data);
    await scolarite.refetch();
  }
  async function saveReferentielRow(moduleId: ReferentielModule, values: Record<string, string>) {
    const result = await createReferentielRow(moduleId, values);
    await referentiel.refetch();
    return result;
  }
  async function updateReferentiel(moduleId: ReferentielModule, id: string, values: Record<string, string>) {
    const result = await updateReferentielRow(moduleId, id, values);
    await referentiel.refetch();
    return result;
  }
  async function updateScolarite(moduleId: ScolariteModule, id: string, values: Record<string, string>) {
    const result = await updateScolariteRow(moduleId, id, values);
    await scolarite.refetch();
    return result;
  }
  async function deleteStaffRecord(id: string) {
    await removeStaff(id);
    await scolarite.refetch();
  }
  async function saveSettings(values: Record<string, string>) {
    await client.referentiel.updateSettings({
      name: (values.name ?? "").trim(),
      email: (values.email ?? "").trim().toLowerCase(),
      phone: (values.phone ?? "").trim(),
      address: (values.address ?? "").trim(),
      currency: (values.currency ?? "").trim(),
      periodType: (values.period ?? "").trim(),
      rounding: (values.rounding ?? "").trim(),
    });
    await referentiel.refetch();
    if (values.name) setSchool(values.name);
  }
  async function saveStudent(values: Record<string, string>) {
    const result = await enrollStudent(values, scolarite.data);
    await scolarite.refetch();
    return result;
  }
  async function updateStudent(values: Record<string, string>) {
    const result = await updateStudentRecord(values, scolarite.data);
    await scolarite.refetch();
    return result;
  }
  async function setStudentStatus(id: string, status: Parameters<typeof changeStudentStatus>[1]) {
    await changeStudentStatus(id, status);
    await scolarite.refetch();
  }
  async function decideAdmission(
    id: string,
    decision: "accepté" | "refusé" | "liste d'attente",
    note = "",
    classId?: string,
  ) {
    await decideStudentAdmission(id, decision, note, classId);
    await scolarite.refetch();
  }
  async function reinscribe(values: {
    id: string;
    schoolYear: string;
    classId?: string;
    enrolledAt?: string;
    note?: string;
  }) {
    await reinscribeStudent(values);
    await scolarite.refetch();
  }
  async function transferToClass(id: string, classId: string, reason = "") {
    await transferStudent(id, classId, reason);
    await scolarite.refetch();
  }
  async function transferOut(id: string, destination: string, reason = "") {
    await transferOutStudent(id, destination, reason);
    await scolarite.refetch();
  }
  async function archiveRecord(id: string, reason = "") {
    await archiveStudent(id, reason);
    await scolarite.refetch();
  }
  async function saveStudentGuardian(values: {
    studentId: string;
    guardianId?: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    relation?: string;
  }) {
    if (values.guardianId) {
      await updateStudentGuardian({ ...values, guardianId: values.guardianId });
    } else {
      await addStudentGuardian(values);
    }
    await scolarite.refetch();
  }
  async function deleteStudentGuardian(studentId: string, guardianId: string) {
    await removeStudentGuardian(studentId, guardianId);
    await scolarite.refetch();
  }
  async function uploadDocument(studentId: string, kind: string, file: File) {
    await uploadStudentDocument(studentId, kind, file);
    await scolarite.refetch();
  }
  async function deleteDocument(id: string) {
    await removeStudentDocument(id);
    await scolarite.refetch();
  }
  async function downloadDocument(id: string) {
    await downloadStudentDocument(id);
  }
  async function uploadProgram(subjectId: string, file: File) {
    await uploadSubjectProgram(subjectId, file);
    await referentiel.refetch();
  }
  async function deleteProgram(id: string) {
    await removeSubjectProgram(id);
    await referentiel.refetch();
  }
  async function downloadProgram(id: string) {
    await downloadSubjectProgram(id);
  }
  async function createEvaluationRecord(values: {
    classId: string;
    subjectId: string;
    periodId?: string;
    name: string;
    coefficient: number;
    maxScore: number;
    date?: string;
  }) {
    const result = await createEvaluationRequest(values);
    await pedagogie.refetch();
    return result;
  }
  async function saveEvaluationGrades(
    evaluationId: string,
    entries: Parameters<typeof saveGradesRequest>[1],
  ) {
    await saveGradesRequest(evaluationId, entries);
    await pedagogie.refetch();
  }
  async function validateEvaluationRecord(id: string) {
    const result = await validateEvaluationRequest(id);
    await pedagogie.refetch();
    return result;
  }
  async function generateReports(periodId: string, classId: string) {
    const result = await generateReportCards(periodId, classId);
    await pedagogie.refetch();
    return result;
  }
  async function validateReports(periodId: string, classId: string) {
    const result = await validateReportCards(periodId, classId);
    await pedagogie.refetch();
    return result;
  }
  async function publishReports(periodId: string, classId: string) {
    const result = await publishReportCards(periodId, classId);
    await pedagogie.refetch();
    return result;
  }
  async function createScheduleSlot(values: Parameters<typeof createTimeSlot>[0]) {
    const result = await createTimeSlot(values);
    await planning.refetch();
    return result;
  }
  async function createScheduleEntry(values: Parameters<typeof createTimetableEntry>[0]) {
    const result = await createTimetableEntry(values);
    await planning.refetch();
    return result;
  }
  async function removeScheduleEntry(id: string) {
    const result = await deleteTimetableEntry(id);
    await planning.refetch();
    return result;
  }
  async function generateSchedule(classId: string) {
    const result = await generatePlanningProposal(classId);
    await planning.refetch();
    return result;
  }
  async function validateSchedulePlan() {
    const result = await validatePlanning();
    await planning.refetch();
    return result;
  }
  async function publishSchedulePlan() {
    const result = await publishPlanning();
    await planning.refetch();
    return result;
  }
  async function saveAttendanceSheet(validate: boolean) {
    const data = attendance.data;
    if (!data?.classId) throw new Error("Aucune classe sélectionnée.");
    const records = data.students.map((student) => {
      const entry = attendanceDraft[student.id] ?? {
        status: "Présent",
        minutesLate: 0,
        reason: "",
        justification: "",
      };
      return {
        studentId: student.id,
        status: entry.status,
        minutesLate: entry.minutesLate,
        reason: entry.reason,
        justification: entry.justification,
      };
    });
    const result = await saveAttendanceRequest({
      classId: data.classId,
      date: data.date,
      validate,
      records,
    });
    await attendance.refetch();
    return result;
  }
  async function createDisciplineIncident(
    values: Parameters<typeof createDisciplineIncidentRequest>[0],
  ) {
    const result = await createDisciplineIncidentRequest(values);
    await Promise.all([discipline.refetch(), scolarite.refetch()]);
    return result;
  }
  async function updateDisciplineIncident(
    values: Parameters<typeof updateDisciplineIncidentRequest>[0],
  ) {
    const result = await updateDisciplineIncidentRequest(values);
    await Promise.all([discipline.refetch(), scolarite.refetch()]);
    return result;
  }
  async function createFinanceInvoice(
    values: Parameters<typeof createInvoiceRequest>[0],
  ) {
    const result = await createInvoiceRequest(values);
    await Promise.all([finance.refetch(), scolarite.refetch()]);
    return result;
  }
  async function recordFinancePayment(
    values: Parameters<typeof recordPaymentRequest>[0],
  ) {
    const result = await recordPaymentRequest(values);
    await Promise.all([finance.refetch(), scolarite.refetch()]);
    return result;
  }
  async function cancelFinancePayment(id: string, reason: string) {
    const result = await cancelPaymentRequest(id, reason);
    await Promise.all([finance.refetch(), scolarite.refetch()]);
    return result;
  }
  async function closeCashRegister(date: string, note?: string) {
    const result = await closeCashRequest(date, note);
    await finance.refetch();
    return result;
  }
  async function createAnnouncement(
    values: Parameters<typeof createAnnouncementRequest>[0],
  ) {
    const result = await createAnnouncementRequest(values);
    await communication.refetch();
    return result;
  }
  async function publishAnnouncement(id: string) {
    const result = await publishAnnouncementRequest(id);
    await communication.refetch();
    return result;
  }
  async function archiveAnnouncement(id: string) {
    const result = await archiveAnnouncementRequest(id);
    await communication.refetch();
    return result;
  }
  async function generateAdministrativeDocument(values: {
    kind: AdministrativeDocumentKind;
    studentId?: string;
    classId?: string;
  }) {
    const result = await generateAdministrativeDocumentRequest(values);
    await administrativeDocuments.refetch();
    return result;
  }
  async function validateAdministrativeDocument(id: string) {
    const result = await validateAdministrativeDocumentRequest(id);
    await administrativeDocuments.refetch();
    return result;
  }
  async function cancelAdministrativeDocument(id: string, reason: string) {
    const result = await cancelAdministrativeDocumentRequest(id, reason);
    await administrativeDocuments.refetch();
    return result;
  }
  async function markNotificationRead(id: string) {
    const result = await markNotificationReadRequest(id);
    await notificationsQuery.refetch();
    return result;
  }
  async function markAllNotificationsRead() {
    const result = await markAllNotificationsReadRequest();
    await notificationsQuery.refetch();
    return result;
  }
  async function createLesson(values: LessonInput) {
    const result = await createLessonRequest(values);
    await lessonsQuery.refetch();
    return result;
  }
  async function updateLesson(values: LessonInput & { id: string }) {
    const result = await updateLessonRequest(values);
    await lessonsQuery.refetch();
    return result;
  }
  async function removeLesson(id: string) {
    const result = await removeLessonRequest(id);
    await lessonsQuery.refetch();
    return result;
  }
  async function createExam(values: ExamInput) {
    const result = await createExamRequest(values);
    await examsQuery.refetch();
    return result;
  }
  async function updateExam(values: ExamInput & { id: string }) {
    const result = await updateExamRequest(values);
    await examsQuery.refetch();
    return result;
  }
  async function removeExam(id: string) {
    const result = await removeExamRequest(id);
    await examsQuery.refetch();
    return result;
  }
  async function importStudentRows(
    rows: Array<{ name: string; className: string; guardianName: string }>,
  ) {
    setImportBusy(true);
    try {
      const result = await importStudentsRequest(rows);
      setImportResult(result);
      await scolarite.refetch();
      return result;
    } finally {
      setImportBusy(false);
    }
  }
  async function exportModule() {
    if (!module) return;
    if (current === "audit") {
      try {
        const result = await exportAuditCsv();
        downloadCsvContent(result.filename, result.content);
        notify(`Export CSV du journal d'audit téléchargé (${result.count} ligne(s)).`);
      } catch (error) {
        notify(
          error instanceof Error
            ? `Export impossible : ${error.message}`
            : "Export du journal d'audit impossible.",
        );
      }
      return;
    }
    if (current === "students") {
      try {
        const result = await exportStudentsCsv();
        downloadCsvContent(result.filename, result.content);
        notify(`Export CSV des élèves téléchargé (${result.count} ligne(s)).`);
      } catch {
        downloadCsv(
          current,
          module.columns,
          filtered.map((r) => [r.name, ...r.fields, r.status]),
        );
        notify("Export CSV téléchargé.");
      }
      return;
    }
    downloadCsv(
      current,
      module.columns,
      filtered.map((r) => [r.name, ...r.fields, r.status]),
    );
    notify(
      isScolariteModule(current) || isReferentielModule(current)
        ? "Export CSV téléchargé."
        : "Export CSV téléchargé : données fictives affichées.",
    );
  }
  const moduleButton = () => {
    if (current === "audit") void exportModule();
    else if (current === "cash")
      setModal({ kind: "confirm", name: "Clôturer la caisse de démonstration ?" });
    else if (current === "students") setModal({ kind: "student", name: "Inscrire un élève" });
    else setModal({ kind: "generic", name: module?.action });
  };
  function allStudentNames() {
    return liveRows.students.map((r) => r.name);
  }
  function studentHistory(reference: string) {
    const student = scolarite.data?.students.find((s) => s.reference === reference);
    return student?.history ?? [];
  }
  function getStudent(reference: string): SnapshotStudent | undefined {
    return scolarite.data?.students.find((s) => s.reference === reference);
  }
  const canManage =
    session.data?.user.role === "direction" || session.data?.user.role === "administration";

  return {
    current,
    profile,
    setProfile,
    school,
    setSchool,
    year,
    setYear,
    mobile,
    setMobile,
    search,
    setSearch,
    notifications,
    setNotifications,
    toast,
    setToast,
    modal,
    setModal,
    detail,
    setDetail,
    detailTab,
    setDetailTab,
    customRows,
    setCustomRows,
    filter,
    setFilter,
    checked,
    setChecked,
    notes,
    setNotes,
    gradeStage,
    setGradeStage,
    reportStage,
    setReportStage,
    evaluations: pedagogie.data?.evaluations ?? [],
    grades: pedagogie.data?.grades ?? [],
    reportCards: pedagogie.data?.reportCards ?? [],
    periods: referentiel.data?.periods ?? [],
    subjects: referentiel.data?.subjects ?? [],
    programDocuments: referentiel.data?.programDocuments ?? [],
    selectedEvaluationId,
    setSelectedEvaluationId,
    reportPeriodId,
    setReportPeriodId,
    reportClassId,
    setReportClassId,
    pedagogieLoading: pedagogie.isLoading,
    pedagogieError: pedagogie.error instanceof Error ? pedagogie.error.message : "",
    createEvaluationRecord,
    saveEvaluationGrades,
    validateEvaluationRecord,
    generateReports,
    validateReports,
    publishReports,
    scheduleSlots: planning.data?.slots ?? [],
    scheduleEntries: planning.data?.entries ?? [],
    scheduleConflicts: planning.data?.conflicts ?? [],
    scheduleSubjects: planning.data?.subjects ?? [],
    scheduleStaff: planning.data?.staff ?? [],
    scheduleRooms: planning.data?.rooms ?? [],
    scheduleClasses: planning.data?.classes ?? [],
    scheduleStats: planning.data?.stats ?? {
      total: 0,
      draft: 0,
      validated: 0,
      published: 0,
    },
    scheduleClassId,
    setScheduleClassId,
    planningLoading: planning.isLoading,
    planningError: planning.error instanceof Error ? planning.error.message : "",
    createScheduleSlot,
    createScheduleEntry,
    removeScheduleEntry,
    generateSchedule,
    validateSchedulePlan,
    publishSchedulePlan,
    attendanceSnapshot: attendance.data,
    attendanceLoading: attendance.isLoading,
    attendanceError: attendance.error instanceof Error ? attendance.error.message : "",
    attendanceClassId,
    setAttendanceClassId,
    attendanceDate,
    setAttendanceDate,
    attendanceDraft,
    setAttendanceDraft,
    saveAttendanceSheet,
    disciplineSnapshot: discipline.data,
    disciplineLoading: discipline.isLoading,
    disciplineError: discipline.error instanceof Error ? discipline.error.message : "",
    createDisciplineIncident,
    updateDisciplineIncident,
    financeSnapshot: finance.data,
    financeLoading: finance.isLoading,
    financeError: finance.error instanceof Error ? finance.error.message : "",
    createFinanceInvoice,
    recordFinancePayment,
    cancelFinancePayment,
    closeCashRegister,
    communicationSnapshot: communication.data,
    communicationLoading: communication.isLoading,
    communicationError: communication.error instanceof Error ? communication.error.message : "",
    createAnnouncement,
    publishAnnouncement,
    archiveAnnouncement,
    administrativeDocumentsSnapshot: administrativeDocuments.data,
    administrativeDocumentsLoading: administrativeDocuments.isLoading,
    administrativeDocumentsError:
      administrativeDocuments.error instanceof Error ? administrativeDocuments.error.message : "",
    generateAdministrativeDocument,
    validateAdministrativeDocument,
    cancelAdministrativeDocument,
    notificationsSnapshot: notificationsQuery.data,
    notificationsLoading: notificationsQuery.isLoading,
    notificationsError:
      notificationsQuery.error instanceof Error ? notificationsQuery.error.message : "",
    markNotificationRead,
    markAllNotificationsRead,
    lessonsSnapshot: lessonsQuery.data,
    lessonsLoading: lessonsQuery.isLoading,
    lessonsError: lessonsQuery.error instanceof Error ? lessonsQuery.error.message : "",
    createLesson,
    updateLesson,
    removeLesson,
    examsSnapshot: examsQuery.data,
    examsLoading: examsQuery.isLoading,
    examsError: examsQuery.error instanceof Error ? examsQuery.error.message : "",
    createExam,
    updateExam,
    removeExam,
    scheduleStage,
    setScheduleStage,
    week,
    setWeek,
    scheduleView,
    setScheduleView,
    attend,
    setAttend,
    settings,
    setSettings,
    settingsTab,
    setSettingsTab,
    importRows,
    setImportRows,
    importError,
    setImportError,
    importFile,
    setImportFile,
    importResult,
    setImportResult,
    importBusy,
    importStudentRows,
    portalTab,
    setPortalTab,
    receipt,
    setReceipt,
    notify,
    go,
    isFamily,
    isPlatform,
    visibleGroups,
    module,
    allRows,
    filtered,
    setNewProfile,
    exportModule,
    moduleButton,
    allStudentNames,
    studentHistory,
    getStudent,
    canManage,
    session: session.data,
    signOut,
    saveScolariteRow,
    saveReferentielRow,
    updateReferentiel,
    updateScolarite,
    deleteStaffRecord,
    saveSettings,
    saveStudent,
    updateStudent,
    setStudentStatus,
    decideAdmission,
    reinscribe,
    transferToClass,
    transferOut,
    archiveRecord,
    saveStudentGuardian,
    deleteStudentGuardian,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    uploadProgram,
    deleteProgram,
    downloadProgram,
    classOptions: liveRows.classes.map((r) => r.name),
    classList: scolarite.data?.classes ?? [],
    studentsData: scolarite.data?.students ?? [],
    staffData: scolarite.data?.staff ?? [],
    scolariteLoading: scolarite.isLoading,
    scolariteError: scolarite.error instanceof Error ? scolarite.error.message : "",
  };
}
export type ScoliaState = ReturnType<typeof useScoliaState>;
