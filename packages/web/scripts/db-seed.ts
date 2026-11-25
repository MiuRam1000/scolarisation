/**
 * Jeu de données de démonstration pour la base locale.
 *
 * Usage (depuis packages/web) :
 *   bun run db:seed          -> insère le jeu si absent
 *   bun run db:seed:reset    -> supprime puis recrée uniquement le tenant de démo
 *
 * Les comptes utilisent tous le mot de passe `Demo1234!`.
 */
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/api/database";
import {
  academicYears,
  administrativeDocuments,
  announcements,
  attendanceRecords,
  attendanceSessions,
  auditLogs,
  cashClosures,
  classes,
  disciplineIncidents,
  enrollments,
  establishments,
  exams,
  feeInvoices,
  guardians,
  lessons,
  notifications,
  periods,
  payments,
  reportCards,
  rooms,
  staff,
  studentDocuments,
  studentGuardians,
  studentHistory,
  students,
  subjects,
  subjectProgramDocuments,
  timeSlots,
  timetableEntries,
  users,
  evaluations,
  grades,
} from "../src/api/database/schema";
import { hashPassword } from "../src/api/auth/password";

const RESET = process.argv.includes("--reset");
const SCHOOL_NAME = "Lycée Démo Scolia";
const SCHOOL_SLUG = "lycee-demo-scolia";
const SCHOOL_EMAIL = "contact@demo.scolia.local";
const YEAR_LABEL = "2026–2027";
const DEMO_PASSWORD = "Demo1234!";

const ID = {
  school: "demo-school-scolia",
  year: "demo-year-2026-2027",
  p1: "demo-period-1",
  p2: "demo-period-2",
  p3: "demo-period-3",
  class6: "demo-class-6a",
  class3: "demo-class-3b",
  classTerminale: "demo-class-terminale-s",
  userDirection: "demo-user-direction",
  userAdmin: "demo-user-administration",
  userTeacher: "demo-user-teacher",
  userSupervisor: "demo-user-supervisor",
  userAccountant: "demo-user-accountant",
  userParent: "demo-user-parent",
  userStudent: "demo-user-student",
  staffTeacher: "demo-staff-teacher",
  staffTeacher2: "demo-staff-teacher-2",
  staffSupervisor: "demo-staff-supervisor",
  staffSecretary: "demo-staff-secretary",
  studentLea: "demo-student-lea",
  studentAdam: "demo-student-adam",
  studentInes: "demo-student-ines",
  studentNoah: "demo-student-noah",
  studentMaya: "demo-student-maya",
  guardianParent: "demo-guardian-parent",
  guardianNadia: "demo-guardian-nadia",
  guardianKarim: "demo-guardian-karim",
  guardianHelene: "demo-guardian-helene",
  subjectMathCollege: "demo-subject-math-college",
  subjectFrenchCollege: "demo-subject-french-college",
  subjectHistoryCollege: "demo-subject-history-college",
  subjectScienceCollege: "demo-subject-science-college",
  subjectEnglishCollege: "demo-subject-english-college",
  subjectMathTerminale: "demo-subject-math-terminale",
  subjectPhysicsTerminale: "demo-subject-physics-terminale",
  subjectPhiloTerminale: "demo-subject-philosophie-terminale",
  roomA1: "demo-room-a1",
  roomB2: "demo-room-b2",
  roomLab: "demo-room-lab",
  roomGym: "demo-room-gym",
  slotMon8: "demo-slot-mon-08",
  slotMon10: "demo-slot-mon-10",
  slotTue9: "demo-slot-tue-09",
  slotWed10: "demo-slot-wed-10",
  slotThu11: "demo-slot-thu-11",
  slotFri14: "demo-slot-fri-14",
  entry1: "demo-entry-1",
  entry2: "demo-entry-2",
  entry3: "demo-entry-3",
  entry4: "demo-entry-4",
  entry5: "demo-entry-5",
  entry6: "demo-entry-6",
  entry7: "demo-entry-7",
  evalMath6: "demo-eval-math-6",
  evalFrench6: "demo-eval-french-6",
  evalHistory6: "demo-eval-history-6",
  evalScience6: "demo-eval-science-6",
  evalEnglish6: "demo-eval-english-6",
  evalMath3: "demo-eval-math-3",
  evalFrench3: "demo-eval-french-3",
  evalMathTerminale: "demo-eval-math-terminale",
  evalPhysicsTerminale: "demo-eval-physics-terminale",
  evalDraft: "demo-eval-draft",
  attendance6: "demo-attendance-6a",
  attendance3: "demo-attendance-3b",
  attendanceTerminale: "demo-attendance-terminale",
  incident1: "demo-incident-1",
  incident2: "demo-incident-2",
  incident3: "demo-incident-3",
  invoiceLea: "demo-invoice-lea",
  invoiceAdam: "demo-invoice-adam",
  invoiceInes: "demo-invoice-ines",
  invoiceNoah: "demo-invoice-noah",
  invoiceMaya: "demo-invoice-maya",
  announcement1: "demo-announcement-1",
  announcement2: "demo-announcement-2",
  announcement3: "demo-announcement-3",
  announcementDraft: "demo-announcement-draft",
  document1: "demo-document-certificate-lea",
  document2: "demo-document-enrollment-ines",
  document3: "demo-document-class-list",
  documentDraft: "demo-document-certificate-adam",
  exam1: "demo-exam-1",
  exam2: "demo-exam-2",
  exam3: "demo-exam-3",
  lesson1: "demo-lesson-1",
  lesson2: "demo-lesson-2",
  lesson3: "demo-lesson-3",
  lesson4: "demo-lesson-4",
  lesson5: "demo-lesson-5",
  lesson6: "demo-lesson-6",
} as const;

const now = new Date();
const nowIso = now.toISOString();
const today = nowIso.slice(0, 10);
const daysAgo = (count: number) => {
  const date = new Date();
  date.setDate(date.getDate() - count);
  return date.toISOString().slice(0, 10);
};
const yesterday = daysAgo(1);

const SUBJECTS = [
  { id: ID.subjectMathCollege, name: "Mathématiques", level: "Collège", program: "Programme national 2026–2027", coefficient: 4, weeklyHours: 4 },
  { id: ID.subjectFrenchCollege, name: "Français", level: "Collège", program: "Programme national 2026–2027", coefficient: 4, weeklyHours: 4 },
  { id: ID.subjectHistoryCollege, name: "Histoire-géographie", level: "Collège", program: "Programme national 2026–2027", coefficient: 3, weeklyHours: 3 },
  { id: ID.subjectScienceCollege, name: "Sciences physiques", level: "Collège", program: "Programme national 2026–2027", coefficient: 2, weeklyHours: 2 },
  { id: ID.subjectEnglishCollege, name: "Anglais", level: "Collège", program: "Programme national 2026–2027", coefficient: 2, weeklyHours: 3 },
  { id: ID.subjectMathTerminale, name: "Mathématiques", level: "Terminale", program: "Programme terminale 2026–2027", coefficient: 5, weeklyHours: 6 },
  { id: ID.subjectPhysicsTerminale, name: "Physique-chimie", level: "Terminale", program: "Programme terminale 2026–2027", coefficient: 4, weeklyHours: 5 },
  { id: ID.subjectPhiloTerminale, name: "Philosophie", level: "Terminale", program: "Programme terminale 2026–2027", coefficient: 3, weeklyHours: 4 },
] as const;

const PROGRAM_FILES = {
  college: {
    fileName: "programme-national-2026-2027.txt",
    text:
      "Programme national 2026–2027 — Collège\n" +
      "Mathématiques, Français, Histoire-géographie, Sciences physiques, Anglais.\n" +
      "Compétences, objectifs annuels et repères d’évaluation.",
  },
  terminale: {
    fileName: "programme-terminale-2026-2027.txt",
    text:
      "Programme terminale 2026–2027\n" +
      "Mathématiques, Physique-chimie, Philosophie.\n" +
      "Thématiques, attendus de fin d’année et préparation aux examens.",
  },
} as const;

const EVALUATIONS = [
  { id: ID.evalMath6, classId: ID.class6, subjectId: ID.subjectMathCollege, name: "Interrogation – chapitre 1", coefficient: 2 },
  { id: ID.evalFrench6, classId: ID.class6, subjectId: ID.subjectFrenchCollege, name: "Rédaction encadrée", coefficient: 1 },
  { id: ID.evalHistory6, classId: ID.class6, subjectId: ID.subjectHistoryCollege, name: "Quiz d’histoire", coefficient: 1 },
  { id: ID.evalScience6, classId: ID.class6, subjectId: ID.subjectScienceCollege, name: "Travaux pratiques", coefficient: 1 },
  { id: ID.evalEnglish6, classId: ID.class6, subjectId: ID.subjectEnglishCollege, name: "Expression orale", coefficient: 1 },
  { id: ID.evalMath3, classId: ID.class3, subjectId: ID.subjectMathCollege, name: "Devoir surveillé 1", coefficient: 2 },
  { id: ID.evalFrench3, classId: ID.class3, subjectId: ID.subjectFrenchCollege, name: "Commentaire de texte", coefficient: 1 },
  { id: ID.evalMathTerminale, classId: ID.classTerminale, subjectId: ID.subjectMathTerminale, name: "Devoir surveillé 1", coefficient: 2 },
  { id: ID.evalPhysicsTerminale, classId: ID.classTerminale, subjectId: ID.subjectPhysicsTerminale, name: "Travaux pratiques", coefficient: 1 },
] as const;

const GRADES: Array<{ evaluationId: string; studentId: string; score: number; comment: string }> = [
  { evaluationId: ID.evalMath6, studentId: ID.studentLea, score: 16, comment: "Très bon raisonnement." },
  { evaluationId: ID.evalFrench6, studentId: ID.studentLea, score: 14, comment: "" },
  { evaluationId: ID.evalHistory6, studentId: ID.studentLea, score: 15, comment: "" },
  { evaluationId: ID.evalScience6, studentId: ID.studentLea, score: 15, comment: "" },
  { evaluationId: ID.evalEnglish6, studentId: ID.studentLea, score: 17, comment: "" },
  { evaluationId: ID.evalMath6, studentId: ID.studentAdam, score: 11, comment: "Progrès à confirmer." },
  { evaluationId: ID.evalFrench6, studentId: ID.studentAdam, score: 12, comment: "" },
  { evaluationId: ID.evalHistory6, studentId: ID.studentAdam, score: 10, comment: "" },
  { evaluationId: ID.evalScience6, studentId: ID.studentAdam, score: 12, comment: "" },
  { evaluationId: ID.evalEnglish6, studentId: ID.studentAdam, score: 13, comment: "" },
  { evaluationId: ID.evalMath3, studentId: ID.studentInes, score: 15, comment: "" },
  { evaluationId: ID.evalFrench3, studentId: ID.studentInes, score: 16, comment: "" },
  { evaluationId: ID.evalMath3, studentId: ID.studentNoah, score: 9, comment: "Soutien proposé." },
  { evaluationId: ID.evalFrench3, studentId: ID.studentNoah, score: 11, comment: "" },
  { evaluationId: ID.evalMathTerminale, studentId: ID.studentMaya, score: 14, comment: "" },
  { evaluationId: ID.evalPhysicsTerminale, studentId: ID.studentMaya, score: 13, comment: "" },
];

const subjectCoefficient = new Map(SUBJECTS.map((subject) => [subject.id, subject.coefficient]));

function averageForStudent(studentId: string) {
  const buckets = new Map<string, { total: number; weight: number }>();
  for (const grade of GRADES.filter((row) => row.studentId === studentId)) {
    const evaluation = EVALUATIONS.find((row) => row.id === grade.evaluationId);
    if (!evaluation) continue;
    const bucket = buckets.get(evaluation.subjectId) ?? { total: 0, weight: 0 };
    bucket.total += (grade.score / 20) * evaluation.coefficient;
    bucket.weight += evaluation.coefficient;
    buckets.set(evaluation.subjectId, bucket);
  }
  let total = 0;
  let weight = 0;
  for (const [subjectId, bucket] of buckets) {
    const coefficient = subjectCoefficient.get(subjectId) ?? 1;
    total += (bucket.total / bucket.weight) * coefficient;
    weight += coefficient;
  }
  return weight ? Math.round((total / weight) * 100) / 100 : null;
}

const schoolSnapshot = {
  name: SCHOOL_NAME,
  email: SCHOOL_EMAIL,
  phone: "+33 1 00 00 00 00",
  address: "12 avenue de la Démonstration, 75000 Paris",
};

const documentTitles = {
  certificate: "Certificat de scolarité",
  enrollment: "Attestation d'inscription",
  class_list: "Liste de classe",
} as const;

function studentDocumentSnapshot(kind: "certificate" | "enrollment", reference: string, student: {
  firstName: string;
  lastName: string;
  reference: string;
  birthDate: string;
  sex: string;
  address: string;
  enrolledAt: string;
  classId: string;
}) {
  const className = student.classId === ID.class6 ? "6e A" : student.classId === ID.class3 ? "3e B" : "Terminale S";
  return JSON.stringify({
    reference,
    kind,
    title: documentTitles[kind],
    issuedOn: nowIso,
    schoolYear: YEAR_LABEL,
    school: schoolSnapshot,
    student: {
      firstName: student.firstName,
      lastName: student.lastName,
      name: `${student.firstName} ${student.lastName}`,
      reference: student.reference,
      birthDate: student.birthDate,
      sex: student.sex,
      address: student.address,
      enrolledAt: student.enrolledAt,
      schoolYear: YEAR_LABEL,
      status: "Actif",
      className,
      level: className.startsWith("Terminale") ? "Terminale" : "Collège",
      mainTeacher: className.startsWith("Terminale") ? "Mme Claire Dubois" : "M. Marc Leroy",
    },
    class: null,
  });
}

function classDocumentSnapshot(reference: string) {
  return JSON.stringify({
    reference,
    kind: "class_list",
    title: documentTitles.class_list,
    issuedOn: nowIso,
    schoolYear: YEAR_LABEL,
    school: schoolSnapshot,
    student: null,
    class: {
      name: "6e A",
      level: "Collège",
      room: "A1",
      mainTeacher: "M. Marc Leroy",
      students: [
        { name: "Léa Moreau", reference: "DEMO-2026-001", birthDate: "2011-05-14", status: "Actif" },
        { name: "Adam Benali", reference: "DEMO-2026-002", birthDate: "2011-08-02", status: "Actif" },
      ],
    },
  });
}

async function resetDemoData() {
  await db.transaction(async (tx) => {
    const establishmentFilter = eq(establishments.id, ID.school);
    await tx.delete(notifications).where(eq(notifications.establishmentId, ID.school));
    await tx.delete(auditLogs).where(eq(auditLogs.establishmentId, ID.school));
    await tx.delete(administrativeDocuments).where(eq(administrativeDocuments.establishmentId, ID.school));
    await tx.delete(announcements).where(eq(announcements.establishmentId, ID.school));
    await tx.delete(cashClosures).where(eq(cashClosures.establishmentId, ID.school));
    await tx.delete(payments).where(eq(payments.establishmentId, ID.school));
    await tx.delete(feeInvoices).where(eq(feeInvoices.establishmentId, ID.school));
    await tx.delete(reportCards).where(eq(reportCards.establishmentId, ID.school));
    await tx.delete(grades).where(eq(grades.establishmentId, ID.school));
    await tx.delete(evaluations).where(eq(evaluations.establishmentId, ID.school));
    await tx.delete(lessons).where(eq(lessons.establishmentId, ID.school));
    await tx.delete(disciplineIncidents).where(eq(disciplineIncidents.establishmentId, ID.school));
    await tx.delete(attendanceRecords).where(eq(attendanceRecords.establishmentId, ID.school));
    await tx.delete(attendanceSessions).where(eq(attendanceSessions.establishmentId, ID.school));
    await tx.delete(timetableEntries).where(eq(timetableEntries.establishmentId, ID.school));
    await tx.delete(timeSlots).where(eq(timeSlots.establishmentId, ID.school));
    await tx.delete(rooms).where(eq(rooms.establishmentId, ID.school));
    await tx
      .delete(subjectProgramDocuments)
      .where(eq(subjectProgramDocuments.establishmentId, ID.school));
    await tx.delete(subjects).where(eq(subjects.establishmentId, ID.school));
    await tx.delete(enrollments).where(eq(enrollments.establishmentId, ID.school));
    await tx.delete(studentDocuments).where(eq(studentDocuments.establishmentId, ID.school));
    await tx.delete(studentHistory).where(eq(studentHistory.establishmentId, ID.school));
    await tx.delete(studentGuardians).where(
      inArray(studentGuardians.studentId, [
        ID.studentLea,
        ID.studentAdam,
        ID.studentInes,
        ID.studentNoah,
        ID.studentMaya,
      ]),
    );
    await tx.delete(students).where(eq(students.establishmentId, ID.school));
    await tx.delete(guardians).where(eq(guardians.establishmentId, ID.school));
    await tx.delete(staff).where(eq(staff.establishmentId, ID.school));
    await tx.delete(periods).where(eq(periods.establishmentId, ID.school));
    await tx.delete(academicYears).where(eq(academicYears.establishmentId, ID.school));
    await tx.delete(classes).where(eq(classes.establishmentId, ID.school));
    await tx.delete(users).where(eq(users.establishmentId, ID.school));
    await tx.delete(establishments).where(establishmentFilter);
  });
}

async function main() {
  const existing = await db
    .select({ id: establishments.id })
    .from(establishments)
    .where(eq(establishments.slug, SCHOOL_SLUG))
    .limit(1);

  if (existing.length && !RESET) {
    console.log(`Le jeu de démonstration « ${SCHOOL_NAME} » est déjà présent.`);
    console.log(`Lancez « bun run db:seed:reset » pour le recréer.`);
    return;
  }

  if (RESET) {
    await resetDemoData();
    console.log("Ancien jeu de démonstration supprimé.");
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  await db.transaction(async (tx) => {
    await tx.insert(establishments).values({
      id: ID.school,
      name: SCHOOL_NAME,
      slug: SCHOOL_SLUG,
      email: SCHOOL_EMAIL,
      phone: "+33 1 00 00 00 00",
      address: schoolSnapshot.address,
      currency: "EUR — Euro",
      periodType: "Trimestres",
      rounding: "2 décimales",
    }).onConflictDoNothing();

    await tx.insert(users).values([
      { id: ID.userDirection, establishmentId: ID.school, email: "direction@demo.scolia.local", name: "Camille Direction", role: "direction", passwordHash },
      { id: ID.userAdmin, establishmentId: ID.school, email: "administration@demo.scolia.local", name: "Alex Administration", role: "administration", passwordHash },
      { id: ID.userTeacher, establishmentId: ID.school, email: "professeur@demo.scolia.local", name: "Marc Leroy", role: "teacher", passwordHash },
      { id: ID.userSupervisor, establishmentId: ID.school, email: "surveillant@demo.scolia.local", name: "Nadia Surveillante", role: "supervisor", passwordHash },
      { id: ID.userAccountant, establishmentId: ID.school, email: "comptable@demo.scolia.local", name: "Jean Comptable", role: "accountant", passwordHash },
      { id: ID.userParent, establishmentId: ID.school, email: "parent@demo.scolia.local", name: "Sophie Moreau", role: "parent", passwordHash },
      { id: ID.userStudent, establishmentId: ID.school, email: "eleve@demo.scolia.local", name: "Léa Moreau", role: "student", passwordHash },
    ]).onConflictDoNothing();

    await tx.insert(academicYears).values({
      id: ID.year,
      establishmentId: ID.school,
      label: YEAR_LABEL,
      startsOn: "2026-09-01",
      endsOn: "2027-07-02",
      status: "Active",
    }).onConflictDoNothing();

    await tx.insert(periods).values([
      { id: ID.p1, establishmentId: ID.school, academicYearId: ID.year, name: "Premier trimestre", startsOn: "2026-09-01", endsOn: "2026-12-18", gradesDeadline: "2026-12-12", status: "En cours" },
      { id: ID.p2, establishmentId: ID.school, academicYearId: ID.year, name: "Deuxième trimestre", startsOn: "2027-01-04", endsOn: "2027-03-26", gradesDeadline: "2027-03-20", status: "Planifiée" },
      { id: ID.p3, establishmentId: ID.school, academicYearId: ID.year, name: "Troisième trimestre", startsOn: "2027-04-12", endsOn: "2027-07-02", gradesDeadline: "2027-06-26", status: "Planifiée" },
    ]).onConflictDoNothing();

    await tx.insert(classes).values([
      { id: ID.class6, establishmentId: ID.school, name: "6e A", level: "Collège", room: "A1", capacity: 28, mainTeacher: "M. Marc Leroy", status: "Actif" },
      { id: ID.class3, establishmentId: ID.school, name: "3e B", level: "Collège", room: "B2", capacity: 30, mainTeacher: "Mme Julie Petit", status: "Actif" },
      { id: ID.classTerminale, establishmentId: ID.school, name: "Terminale S", level: "Terminale", room: "Labo", capacity: 24, mainTeacher: "Mme Claire Dubois", status: "Actif" },
    ]).onConflictDoNothing();

    await tx.insert(staff).values([
      { id: ID.staffTeacher, establishmentId: ID.school, userId: ID.userTeacher, name: "Marc Leroy", type: "Enseignant", specialty: "Mathématiques", assignments: "6e A · 3e B", weeklyHours: 18, email: "professeur@demo.scolia.local", status: "Actif" },
      { id: ID.staffTeacher2, establishmentId: ID.school, name: "Julie Petit", type: "Enseignant", specialty: "Français", assignments: "6e A · 3e B", weeklyHours: 16, email: "julie.petit@demo.scolia.local", status: "Actif" },
      { id: ID.staffSupervisor, establishmentId: ID.school, userId: ID.userSupervisor, name: "Nadia Surveillante", type: "Surveillance", specialty: "Vie scolaire", assignments: "6e A · 3e B · Terminale S", weeklyHours: 12, email: "surveillant@demo.scolia.local", status: "Actif" },
      { id: ID.staffSecretary, establishmentId: ID.school, userId: ID.userAdmin, name: "Alex Administration", type: "Secrétariat", specialty: "Scolarité", assignments: "", weeklyHours: 35, email: "administration@demo.scolia.local", status: "Actif" },
    ]).onConflictDoNothing();

    await tx.insert(students).values([
      { id: ID.studentLea, establishmentId: ID.school, userId: ID.userStudent, firstName: "Léa", lastName: "Moreau", reference: "DEMO-2026-001", classId: ID.class6, birthDate: "2011-05-14", sex: "Féminin", address: "8 rue des Écoles, Paris", phone: "06 00 00 00 01", schoolYear: YEAR_LABEL, enrolledAt: "2026-09-01", status: "Actif" },
      { id: ID.studentAdam, establishmentId: ID.school, firstName: "Adam", lastName: "Benali", reference: "DEMO-2026-002", classId: ID.class6, birthDate: "2011-08-02", sex: "Masculin", address: "14 rue des Écoles, Paris", phone: "06 00 00 00 02", schoolYear: YEAR_LABEL, enrolledAt: "2026-09-01", status: "Actif" },
      { id: ID.studentInes, establishmentId: ID.school, firstName: "Inès", lastName: "Fontaine", reference: "DEMO-2026-003", classId: ID.class3, birthDate: "2010-03-22", sex: "Féminin", address: "21 avenue du Parc, Paris", phone: "06 00 00 00 03", schoolYear: YEAR_LABEL, enrolledAt: "2026-09-01", status: "Actif" },
      { id: ID.studentNoah, establishmentId: ID.school, firstName: "Noah", lastName: "Perrin", reference: "DEMO-2026-004", classId: ID.class3, birthDate: "2010-11-09", sex: "Masculin", address: "5 boulevard Nord, Paris", phone: "06 00 00 00 04", schoolYear: YEAR_LABEL, enrolledAt: "2026-09-01", status: "Actif" },
      { id: ID.studentMaya, establishmentId: ID.school, firstName: "Maya", lastName: "Rousseau", reference: "DEMO-2026-005", classId: ID.classTerminale, birthDate: "2009-01-30", sex: "Féminin", address: "3 place du Marché, Paris", phone: "06 00 00 00 05", schoolYear: YEAR_LABEL, enrolledAt: "2026-09-01", status: "Actif" },
    ]).onConflictDoNothing();

    await tx.insert(guardians).values([
      { id: ID.guardianParent, establishmentId: ID.school, userId: ID.userParent, name: "Sophie Moreau", email: "parent@demo.scolia.local", phone: "06 11 22 33 44", address: "8 rue des Écoles, Paris", status: "Actif" },
      { id: ID.guardianNadia, establishmentId: ID.school, name: "Nadia Benali", email: "nadia.benali@example.com", phone: "06 22 33 44 55", address: "14 rue des Écoles, Paris", status: "Actif" },
      { id: ID.guardianKarim, establishmentId: ID.school, name: "Karim Benali", email: "karim.benali@example.com", phone: "06 33 44 55 66", address: "14 rue des Écoles, Paris", status: "Actif" },
      { id: ID.guardianHelene, establishmentId: ID.school, name: "Hélène Fontaine", email: "helene.fontaine@example.com", phone: "06 44 55 66 77", address: "21 avenue du Parc, Paris", status: "Actif" },
    ]).onConflictDoNothing();

    await tx.insert(studentGuardians).values([
      { studentId: ID.studentLea, guardianId: ID.guardianParent, relation: "Mère" },
      { studentId: ID.studentInes, guardianId: ID.guardianParent, relation: "Tutrice" },
      { studentId: ID.studentLea, guardianId: ID.guardianNadia, relation: "Tutrice" },
      { studentId: ID.studentAdam, guardianId: ID.guardianNadia, relation: "Mère" },
      { studentId: ID.studentAdam, guardianId: ID.guardianKarim, relation: "Père" },
      { studentId: ID.studentInes, guardianId: ID.guardianHelene, relation: "Mère" },
    ]).onConflictDoNothing();

    await tx.insert(enrollments).values([
      { id: "demo-enroll-lea", establishmentId: ID.school, studentId: ID.studentLea, academicYearId: ID.year, schoolYear: YEAR_LABEL, classId: ID.class6, enrolledAt: "2026-09-01", kind: "inscription", status: "Inscrit" },
      { id: "demo-enroll-adam", establishmentId: ID.school, studentId: ID.studentAdam, academicYearId: ID.year, schoolYear: YEAR_LABEL, classId: ID.class6, enrolledAt: "2026-09-01", kind: "inscription", status: "Inscrit" },
      { id: "demo-enroll-ines", establishmentId: ID.school, studentId: ID.studentInes, academicYearId: ID.year, schoolYear: YEAR_LABEL, classId: ID.class3, enrolledAt: "2026-09-01", kind: "inscription", status: "Inscrit" },
      { id: "demo-enroll-noah", establishmentId: ID.school, studentId: ID.studentNoah, academicYearId: ID.year, schoolYear: YEAR_LABEL, classId: ID.class3, enrolledAt: "2026-09-01", kind: "inscription", status: "Inscrit" },
      { id: "demo-enroll-maya", establishmentId: ID.school, studentId: ID.studentMaya, academicYearId: ID.year, schoolYear: YEAR_LABEL, classId: ID.classTerminale, enrolledAt: "2026-09-01", kind: "inscription", status: "Inscrit" },
    ]).onConflictDoNothing();

    await tx.insert(studentHistory).values([
      { id: "demo-history-lea-1", establishmentId: ID.school, studentId: ID.studentLea, action: "Création du dossier", detail: "Dossier ouvert par la direction", actor: "Camille Direction" },
      { id: "demo-history-lea-2", establishmentId: ID.school, studentId: ID.studentLea, action: "Inscription", detail: `${YEAR_LABEL} — 6e A`, actor: "Alex Administration" },
      { id: "demo-history-adam-1", establishmentId: ID.school, studentId: ID.studentAdam, action: "Inscription", detail: `${YEAR_LABEL} — 6e A`, actor: "Alex Administration" },
      { id: "demo-history-ines-1", establishmentId: ID.school, studentId: ID.studentInes, action: "Inscription", detail: `${YEAR_LABEL} — 3e B`, actor: "Alex Administration" },
      { id: "demo-history-noah-1", establishmentId: ID.school, studentId: ID.studentNoah, action: "Inscription", detail: `${YEAR_LABEL} — 3e B`, actor: "Alex Administration" },
      { id: "demo-history-maya-1", establishmentId: ID.school, studentId: ID.studentMaya, action: "Inscription", detail: `${YEAR_LABEL} — Terminale S`, actor: "Alex Administration" },
    ]).onConflictDoNothing();

    const tinyPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AF+qxCPAAAAAElFTkSuQmCC";
    await tx.insert(studentDocuments).values([
      { id: "demo-doc-lea-photo", establishmentId: ID.school, studentId: ID.studentLea, kind: "photo", fileName: "photo-lea.png", mimeType: "image/png", size: 68, content: tinyPng, uploadedBy: "Alex Administration" },
      { id: "demo-doc-lea-birth", establishmentId: ID.school, studentId: ID.studentLea, kind: "birth_certificate", fileName: "acte-naissance-lea.png", mimeType: "image/png", size: 68, content: tinyPng, uploadedBy: "Alex Administration" },
      { id: "demo-doc-adam-transfer", establishmentId: ID.school, studentId: ID.studentAdam, kind: "transfer_certificate", fileName: "transfert-adam.png", mimeType: "image/png", size: 68, content: tinyPng, uploadedBy: "Alex Administration" },
    ]).onConflictDoNothing();

    await tx.insert(subjects).values(
      SUBJECTS.map((subject) => ({
        id: subject.id,
        establishmentId: ID.school,
        name: subject.name,
        level: subject.level,
        program: subject.program,
        coefficient: subject.coefficient,
        weeklyHours: subject.weeklyHours,
        status: "Actif",
      })),
    ).onConflictDoNothing();

    await tx
      .insert(subjectProgramDocuments)
      .values(
        SUBJECTS.map((subject) => {
          const file = subject.level === "Terminale" ? PROGRAM_FILES.terminale : PROGRAM_FILES.college;
          return {
            id: `demo-program-${subject.id}`,
            establishmentId: ID.school,
            subjectId: subject.id,
            fileName: file.fileName,
            mimeType: "text/plain",
            size: Buffer.byteLength(file.text, "utf8"),
            content: Buffer.from(file.text, "utf8").toString("base64"),
            uploadedBy: "Camille Direction",
            createdAt: new Date(),
          };
        }),
      )
      .onConflictDoNothing();

    await tx.insert(rooms).values([
      { id: ID.roomA1, establishmentId: ID.school, name: "A1", type: "Salle de cours", capacity: 30, equipment: "Tableau, vidéoprojecteur", building: "Bâtiment A", status: "Disponible" },
      { id: ID.roomB2, establishmentId: ID.school, name: "B2", type: "Salle de cours", capacity: 32, equipment: "Tableau", building: "Bâtiment B", status: "Disponible" },
      { id: ID.roomLab, establishmentId: ID.school, name: "Labo sciences", type: "Laboratoire", capacity: 24, equipment: "Paillasses, micros", building: "Bâtiment C", status: "Disponible" },
      { id: ID.roomGym, establishmentId: ID.school, name: "Gymnase", type: "Gymnase", capacity: 60, equipment: "Terrain multisport", building: "Complexe sportif", status: "Disponible" },
    ]).onConflictDoNothing();

    await tx.insert(timeSlots).values([
      { id: ID.slotMon8, establishmentId: ID.school, academicYearId: ID.year, name: "Lundi 08:00", dayOfWeek: 1, startsAt: "08:00", endsAt: "09:00", kind: "Cours", status: "Actif" },
      { id: ID.slotMon10, establishmentId: ID.school, academicYearId: ID.year, name: "Lundi 10:00", dayOfWeek: 1, startsAt: "10:00", endsAt: "11:00", kind: "Cours", status: "Actif" },
      { id: ID.slotTue9, establishmentId: ID.school, academicYearId: ID.year, name: "Mardi 09:00", dayOfWeek: 2, startsAt: "09:00", endsAt: "10:00", kind: "Cours", status: "Actif" },
      { id: ID.slotWed10, establishmentId: ID.school, academicYearId: ID.year, name: "Mercredi 10:00", dayOfWeek: 3, startsAt: "10:00", endsAt: "11:00", kind: "Cours", status: "Actif" },
      { id: ID.slotThu11, establishmentId: ID.school, academicYearId: ID.year, name: "Jeudi 11:00", dayOfWeek: 4, startsAt: "11:00", endsAt: "12:00", kind: "Cours", status: "Actif" },
      { id: ID.slotFri14, establishmentId: ID.school, academicYearId: ID.year, name: "Vendredi 14:00", dayOfWeek: 5, startsAt: "14:00", endsAt: "15:00", kind: "Cours", status: "Actif" },
    ]).onConflictDoNothing();

    await tx.insert(timetableEntries).values([
      { id: ID.entry1, establishmentId: ID.school, academicYearId: ID.year, classId: ID.class6, subjectId: ID.subjectMathCollege, staffId: ID.staffTeacher, roomId: ID.roomA1, slotId: ID.slotMon8, status: "Publié", publishedAt: nowIso },
      { id: ID.entry2, establishmentId: ID.school, academicYearId: ID.year, classId: ID.class6, subjectId: ID.subjectFrenchCollege, staffId: ID.staffTeacher2, roomId: ID.roomA1, slotId: ID.slotTue9, status: "Publié", publishedAt: nowIso },
      { id: ID.entry3, establishmentId: ID.school, academicYearId: ID.year, classId: ID.class3, subjectId: ID.subjectEnglishCollege, staffId: ID.staffTeacher, roomId: ID.roomB2, slotId: ID.slotMon10, status: "Publié", publishedAt: nowIso },
      { id: ID.entry4, establishmentId: ID.school, academicYearId: ID.year, classId: ID.class3, subjectId: ID.subjectHistoryCollege, staffId: ID.staffTeacher2, roomId: ID.roomB2, slotId: ID.slotWed10, status: "Publié", publishedAt: nowIso },
      { id: ID.entry5, establishmentId: ID.school, academicYearId: ID.year, classId: ID.classTerminale, subjectId: ID.subjectPhysicsTerminale, staffId: ID.staffTeacher2, roomId: ID.roomLab, slotId: ID.slotFri14, status: "Publié", publishedAt: nowIso },
      { id: ID.entry6, establishmentId: ID.school, academicYearId: ID.year, classId: ID.class6, subjectId: ID.subjectScienceCollege, staffId: ID.staffTeacher, roomId: ID.roomLab, slotId: ID.slotThu11, status: "Validé", note: "Publication à valider" },
      { id: ID.entry7, establishmentId: ID.school, academicYearId: ID.year, classId: ID.class3, subjectId: ID.subjectMathCollege, staffId: ID.staffTeacher, roomId: ID.roomB2, slotId: ID.slotFri14, status: "Publié", publishedAt: nowIso },
    ]).onConflictDoNothing();

    await tx.insert(evaluations).values([
      ...EVALUATIONS.map((evaluation) => ({
        id: evaluation.id,
        establishmentId: ID.school,
        classId: evaluation.classId,
        subjectId: evaluation.subjectId,
        periodId: ID.p1,
        name: evaluation.name,
        coefficient: evaluation.coefficient,
        maxScore: 20,
        date: daysAgo(12),
        status: "Validé",
        createdBy: "Marc Leroy",
      })),
      { id: ID.evalDraft, establishmentId: ID.school, classId: ID.class6, subjectId: ID.subjectMathCollege, periodId: ID.p2, name: "Interrogation – chapitre 2", coefficient: 1, maxScore: 20, date: "2027-01-18", status: "Brouillon", createdBy: "Marc Leroy" },
    ]).onConflictDoNothing();

    await tx.insert(grades).values(
      GRADES.map((grade) => ({
        id: `demo-grade-${grade.evaluationId}-${grade.studentId}`,
        establishmentId: ID.school,
        evaluationId: grade.evaluationId,
        studentId: grade.studentId,
        score: grade.score,
        comment: grade.comment,
      })),
    ).onConflictDoNothing();

    await tx.insert(reportCards).values([
      { id: "demo-report-lea", establishmentId: ID.school, studentId: ID.studentLea, periodId: ID.p1, classId: ID.class6, average: averageForStudent(ID.studentLea), status: "Publié", generatedAt: nowIso, publishedAt: nowIso },
      { id: "demo-report-adam", establishmentId: ID.school, studentId: ID.studentAdam, periodId: ID.p1, classId: ID.class6, average: averageForStudent(ID.studentAdam), status: "Publié", generatedAt: nowIso, publishedAt: nowIso },
      { id: "demo-report-ines", establishmentId: ID.school, studentId: ID.studentInes, periodId: ID.p1, classId: ID.class3, average: averageForStudent(ID.studentInes), status: "Publié", generatedAt: nowIso, publishedAt: nowIso },
      { id: "demo-report-noah", establishmentId: ID.school, studentId: ID.studentNoah, periodId: ID.p1, classId: ID.class3, average: averageForStudent(ID.studentNoah), status: "Publié", generatedAt: nowIso, publishedAt: nowIso },
      { id: "demo-report-maya", establishmentId: ID.school, studentId: ID.studentMaya, periodId: ID.p1, classId: ID.classTerminale, average: averageForStudent(ID.studentMaya), status: "Publié", generatedAt: nowIso, publishedAt: nowIso },
      { id: "demo-report-lea-p2", establishmentId: ID.school, studentId: ID.studentLea, periodId: ID.p2, classId: ID.class6, average: null, status: "Brouillon", generatedAt: nowIso },
    ]).onConflictDoNothing();

    await tx.insert(attendanceSessions).values([
      { id: ID.attendance6, establishmentId: ID.school, academicYearId: ID.year, classId: ID.class6, date: today, slotId: ID.slotMon8, subjectId: ID.subjectMathCollege, takenByUserId: ID.userDirection, takenByName: "Camille Direction", status: "Validé", note: "Appel du jour" },
      { id: ID.attendance3, establishmentId: ID.school, academicYearId: ID.year, classId: ID.class3, date: today, slotId: ID.slotMon10, subjectId: ID.subjectEnglishCollege, takenByUserId: ID.userDirection, takenByName: "Camille Direction", status: "Validé", note: "Appel du jour" },
      { id: ID.attendanceTerminale, establishmentId: ID.school, academicYearId: ID.year, classId: ID.classTerminale, date: today, slotId: ID.slotFri14, subjectId: ID.subjectPhysicsTerminale, takenByUserId: ID.userDirection, takenByName: "Camille Direction", status: "Validé", note: "Appel du jour" },
    ]).onConflictDoNothing();

    await tx.insert(attendanceRecords).values([
      { id: "demo-attendance-record-lea", establishmentId: ID.school, sessionId: ID.attendance6, studentId: ID.studentLea, status: "Présent", updatedAt: nowIso },
      { id: "demo-attendance-record-adam", establishmentId: ID.school, sessionId: ID.attendance6, studentId: ID.studentAdam, status: "Retard", minutesLate: 10, reason: "Retard au bus", updatedAt: nowIso },
      { id: "demo-attendance-record-ines", establishmentId: ID.school, sessionId: ID.attendance3, studentId: ID.studentInes, status: "Présent", updatedAt: nowIso },
      { id: "demo-attendance-record-noah", establishmentId: ID.school, sessionId: ID.attendance3, studentId: ID.studentNoah, status: "Absent", reason: "Maladie", justification: "Certificat médical transmis", updatedAt: nowIso },
      { id: "demo-attendance-record-maya", establishmentId: ID.school, sessionId: ID.attendanceTerminale, studentId: ID.studentMaya, status: "Présent", updatedAt: nowIso },
    ]).onConflictDoNothing();

    await tx.insert(disciplineIncidents).values([
      { id: ID.incident1, establishmentId: ID.school, studentId: ID.studentAdam, date: daysAgo(2), type: "Observation", severity: "Faible", description: "Retard non justifié en mathématiques.", location: "Salle A1", responsibleStaffId: ID.staffTeacher, responsibleName: "Marc Leroy", measures: "Entretien avec le professeur principal", status: "Ouvert", createdByUserId: ID.userTeacher, createdByName: "Marc Leroy", updatedAt: nowIso },
      { id: ID.incident2, establishmentId: ID.school, studentId: ID.studentNoah, date: daysAgo(5), type: "Avertissement", severity: "Moyenne", description: "Absences répétées sur deux semaines.", location: "Vie scolaire", responsibleStaffId: ID.staffSupervisor, responsibleName: "Nadia Surveillante", measures: "Entretien avec la famille prévu", status: "En cours", createdByUserId: ID.userSupervisor, createdByName: "Nadia Surveillante", updatedAt: nowIso },
      { id: ID.incident3, establishmentId: ID.school, studentId: ID.studentInes, date: daysAgo(9), type: "Observation", severity: "Faible", description: "Matériel scolaire oublié à deux reprises.", location: "Salle B2", responsibleStaffId: ID.staffTeacher2, responsibleName: "Julie Petit", measures: "Rappel à l'élève", status: "Résolu", createdByUserId: ID.userTeacher, createdByName: "Marc Leroy", updatedAt: nowIso },
    ]).onConflictDoNothing();

    await tx.insert(feeInvoices).values([
      { id: ID.invoiceLea, establishmentId: ID.school, academicYearId: ID.year, studentId: ID.studentLea, label: "Frais de scolarité 2026-2027", amountCents: 35000, dueDate: "2026-12-15", status: "Partiel", note: "Deux versements reçus" },
      { id: ID.invoiceAdam, establishmentId: ID.school, academicYearId: ID.year, studentId: ID.studentAdam, label: "Frais de scolarité 2026-2027", amountCents: 35000, dueDate: "2026-12-15", status: "À payer" },
      { id: ID.invoiceInes, establishmentId: ID.school, academicYearId: ID.year, studentId: ID.studentInes, label: "Cantine – premier trimestre", amountCents: 12000, dueDate: "2026-12-01", status: "Payé" },
      { id: ID.invoiceNoah, establishmentId: ID.school, academicYearId: ID.year, studentId: ID.studentNoah, label: "Frais de scolarité 2026-2027", amountCents: 35000, dueDate: "2026-12-15", status: "À payer" },
      { id: ID.invoiceMaya, establishmentId: ID.school, academicYearId: ID.year, studentId: ID.studentMaya, label: "Frais de scolarité 2026-2027", amountCents: 35000, dueDate: "2026-12-15", status: "Payé" },
    ]).onConflictDoNothing();

    await tx.insert(payments).values([
      { id: "demo-payment-1", establishmentId: ID.school, invoiceId: ID.invoiceLea, studentId: ID.studentLea, amountCents: 15000, method: "Espèces", reference: "ESP-001", paidAt: daysAgo(6), receivedByUserId: ID.userAccountant, receivedByName: "Jean Comptable", status: "Validé", receiptNumber: "REC-2026-0001" },
      { id: "demo-payment-2", establishmentId: ID.school, invoiceId: ID.invoiceLea, studentId: ID.studentLea, amountCents: 10000, method: "Chèque", reference: "CHQ-014", paidAt: yesterday, receivedByUserId: ID.userAccountant, receivedByName: "Jean Comptable", status: "Validé", receiptNumber: "REC-2026-0002" },
      { id: "demo-payment-3", establishmentId: ID.school, invoiceId: ID.invoiceInes, studentId: ID.studentInes, amountCents: 12000, method: "Carte", reference: "CB-088", paidAt: daysAgo(3), receivedByUserId: ID.userAccountant, receivedByName: "Jean Comptable", status: "Validé", receiptNumber: "REC-2026-0003" },
      { id: "demo-payment-4", establishmentId: ID.school, invoiceId: ID.invoiceMaya, studentId: ID.studentMaya, amountCents: 35000, method: "Virement", reference: "VIR-231", paidAt: daysAgo(8), receivedByUserId: ID.userAccountant, receivedByName: "Jean Comptable", status: "Validé", receiptNumber: "REC-2026-0004" },
      { id: "demo-payment-5", establishmentId: ID.school, invoiceId: ID.invoiceNoah, studentId: ID.studentNoah, amountCents: 5000, method: "Espèces", reference: "ESP-002", paidAt: daysAgo(1), receivedByUserId: ID.userAccountant, receivedByName: "Jean Comptable", status: "Annulé", receiptNumber: "REC-2026-0005", note: "Encaissement annulé : erreur de montant" },
    ]).onConflictDoNothing();

    await tx.insert(cashClosures).values({
      id: "demo-cash-closure",
      establishmentId: ID.school,
      date: today,
      totalCents: 72000,
      paymentCount: 4,
      closedByUserId: ID.userAccountant,
      closedByName: "Jean Comptable",
      note: "Clôture de caisse de démonstration",
    }).onConflictDoNothing();

    await tx.insert(announcements).values([
      { id: ID.announcement1, establishmentId: ID.school, title: "Bienvenue à la rentrée 2026-2027", body: "Les cours commencent le 1er septembre. Retrouvez tous les documents utiles dans votre espace.", audience: "Tous", status: "Publié", createdByUserId: ID.userDirection, createdByName: "Camille Direction", publishedAt: nowIso, updatedAt: nowIso },
      { id: ID.announcement2, establishmentId: ID.school, title: "Réunion parents – premier trimestre", body: "Une réunion d'information est organisée le 12 décembre à 18h dans la salle A1.", audience: "Parents", status: "Publié", createdByUserId: ID.userDirection, createdByName: "Camille Direction", publishedAt: nowIso, updatedAt: nowIso },
      { id: ID.announcement3, establishmentId: ID.school, title: "Sortie pédagogique de la 6e A", body: "Départ à 8h30 depuis le hall principal. Pensez à apporter votre goûter et une gourde.", audience: "Classe", classId: ID.class6, status: "Publié", createdByUserId: ID.userAdmin, createdByName: "Alex Administration", publishedAt: nowIso, updatedAt: nowIso },
      { id: ID.announcementDraft, establishmentId: ID.school, title: "Bulletins du premier trimestre", body: "Publication prévue après le conseil de classe du 20 décembre.", audience: "Tous", status: "Brouillon", createdByUserId: ID.userDirection, createdByName: "Camille Direction", updatedAt: nowIso },
    ]).onConflictDoNothing();

    await tx.insert(notifications).values([
      { id: "demo-notification-direction", establishmentId: ID.school, userId: ID.userDirection, title: "Annonce publiée", body: "Bienvenue à la rentrée 2026-2027 est maintenant visible par la communauté.", category: "Annonce", link: "messages", announcementId: ID.announcement1 },
      { id: "demo-notification-parent-1", establishmentId: ID.school, userId: ID.userParent, title: "Réunion parents", body: "Rendez-vous le 12 décembre à 18h en salle A1.", category: "Annonce", link: "messages", announcementId: ID.announcement2 },
      { id: "demo-notification-parent-2", establishmentId: ID.school, userId: ID.userParent, title: "Bulletin publié", body: "Le bulletin du premier trimestre d'Inès Fontaine est disponible.", category: "Pédagogie", link: "reports" },
      { id: "demo-notification-student-1", establishmentId: ID.school, userId: ID.userStudent, title: "Bulletin publié", body: "Votre bulletin du premier trimestre est disponible.", category: "Pédagogie", link: "reports" },
      { id: "demo-notification-student-2", establishmentId: ID.school, userId: ID.userStudent, title: "Sortie pédagogique", body: "Départ à 8h30 depuis le hall principal.", category: "Annonce", link: "messages", announcementId: ID.announcement3 },
      { id: "demo-notification-accountant", establishmentId: ID.school, userId: ID.userAccountant, title: "Solde à recouvrer", body: "3 factures restent à payer pour l'année 2026-2027.", category: "Finance", link: "fees" },
    ]).onConflictDoNothing();

    await tx.insert(administrativeDocuments).values([
      { id: ID.document1, establishmentId: ID.school, kind: "certificate", reference: "CERT-2026-0001", title: documentTitles.certificate, studentId: ID.studentLea, classId: ID.class6, recipient: "Léa Moreau", status: "Validé", snapshot: studentDocumentSnapshot("certificate", "CERT-2026-0001", { firstName: "Léa", lastName: "Moreau", reference: "DEMO-2026-001", birthDate: "2011-05-14", sex: "Féminin", address: "8 rue des Écoles, Paris", enrolledAt: "2026-09-01", classId: ID.class6 }), issuedByUserId: ID.userDirection, issuedByName: "Camille Direction", issuedAt: nowIso },
      { id: ID.document2, establishmentId: ID.school, kind: "enrollment", reference: "ATT-2026-0001", title: documentTitles.enrollment, studentId: ID.studentInes, classId: ID.class3, recipient: "Inès Fontaine", status: "Validé", snapshot: studentDocumentSnapshot("enrollment", "ATT-2026-0001", { firstName: "Inès", lastName: "Fontaine", reference: "DEMO-2026-003", birthDate: "2010-03-22", sex: "Féminin", address: "21 avenue du Parc, Paris", enrolledAt: "2026-09-01", classId: ID.class3 }), issuedByUserId: ID.userAdmin, issuedByName: "Alex Administration", issuedAt: nowIso },
      { id: ID.document3, establishmentId: ID.school, kind: "class_list", reference: "LIST-2026-0001", title: documentTitles.class_list, classId: ID.class6, recipient: "Administration — 6e A", status: "Validé", snapshot: classDocumentSnapshot("LIST-2026-0001"), issuedByUserId: ID.userDirection, issuedByName: "Camille Direction", issuedAt: nowIso },
      { id: ID.documentDraft, establishmentId: ID.school, kind: "certificate", reference: "CERT-2026-0002", title: documentTitles.certificate, studentId: ID.studentAdam, classId: ID.class6, recipient: "Adam Benali", status: "Brouillon", snapshot: studentDocumentSnapshot("certificate", "CERT-2026-0002", { firstName: "Adam", lastName: "Benali", reference: "DEMO-2026-002", birthDate: "2011-08-02", sex: "Masculin", address: "14 rue des Écoles, Paris", enrolledAt: "2026-09-01", classId: ID.class6 }), issuedByUserId: ID.userAdmin, issuedByName: "Alex Administration", issuedAt: nowIso },
    ]).onConflictDoNothing();

    await tx.insert(exams).values([
      { id: ID.exam1, establishmentId: ID.school, academicYearId: ID.year, periodId: ID.p2, title: "Examen blanc – Mathématiques", type: "Examen", classesLabel: "6e A · 3e B", datesLabel: "12 janvier 2027", candidatesCount: 4, status: "Planifié", notes: "Salle A1 et B2.", createdByUserId: ID.userDirection, createdByName: "Camille Direction" },
      { id: ID.exam2, establishmentId: ID.school, academicYearId: ID.year, periodId: ID.p1, title: "Conseil de classe – trimestre 1", type: "Conseil de classe", classesLabel: "6e A · 3e B · Terminale S", datesLabel: "20 décembre 2026", candidatesCount: 5, status: "Planifié", notes: "Ordre du jour envoyé aux enseignants.", createdByUserId: ID.userDirection, createdByName: "Camille Direction" },
      { id: ID.exam3, establishmentId: ID.school, academicYearId: ID.year, periodId: ID.p1, title: "Délibération du premier trimestre", type: "Délibération", classesLabel: "Toutes les classes", datesLabel: "22 décembre 2026", candidatesCount: 5, status: "Terminé", notes: "Décisions validées en conseil.", createdByUserId: ID.userDirection, createdByName: "Camille Direction" },
    ]).onConflictDoNothing();

    await tx.insert(lessons).values([
      { id: ID.lesson1, establishmentId: ID.school, classId: ID.class6, subjectId: ID.subjectMathCollege, teacherName: "Marc Leroy", date: daysAgo(1), startTime: "08:00", endTime: "09:00", title: "Équations du premier degré", content: "Mise en équation, résolution et interprétation des solutions.", homework: "Exercices 12 à 16 page 48", status: "Réalisé", createdByUserId: ID.userTeacher },
      { id: ID.lesson2, establishmentId: ID.school, classId: ID.class6, subjectId: ID.subjectFrenchCollege, teacherName: "Julie Petit", date: daysAgo(2), startTime: "09:00", endTime: "10:00", title: "Le récit autobiographique", content: "Étude du genre et repérage des indices d'énonciation.", homework: "Rédiger un paragraphe de 10 lignes", status: "Réalisé", createdByUserId: ID.userTeacher },
      { id: ID.lesson3, establishmentId: ID.school, classId: ID.class6, subjectId: ID.subjectScienceCollege, teacherName: "Marc Leroy", date: daysAgo(3), startTime: "11:00", endTime: "12:00", title: "Les états de l'eau", content: "Expérience de changement d'état et schéma bilan.", homework: "Compléter le schéma du cours", status: "Réalisé", createdByUserId: ID.userTeacher },
      { id: ID.lesson4, establishmentId: ID.school, classId: ID.class6, subjectId: ID.subjectMathCollege, teacherName: "Marc Leroy", date: daysAgo(4), startTime: "08:00", endTime: "09:00", title: "Proportionnalité", content: "Tableaux de proportionnalité et coefficients.", homework: "Exercices 4 et 5 page 32", status: "Réalisé", createdByUserId: ID.userTeacher },
      { id: ID.lesson5, establishmentId: ID.school, classId: ID.class3, subjectId: ID.subjectEnglishCollege, teacherName: "Marc Leroy", date: daysAgo(1), startTime: "10:00", endTime: "11:00", title: "Present perfect", content: "Formation et emploi avec since et for.", homework: "Exercices page 76", status: "Réalisé", createdByUserId: ID.userTeacher },
      { id: ID.lesson6, establishmentId: ID.school, classId: ID.classTerminale, subjectId: ID.subjectPhysicsTerminale, teacherName: "Julie Petit", date: daysAgo(2), startTime: "14:00", endTime: "15:00", title: "Lois de Newton", content: "Applications au mouvement et exercices de synthèse.", homework: "Préparer le TP suivant", status: "Planifié", createdByUserId: ID.userAdmin },
    ]).onConflictDoNothing();

    await tx.insert(auditLogs).values([
      { id: "demo-audit-01", establishmentId: ID.school, userId: ID.userDirection, actor: "Camille Direction", action: "Création de l’établissement", target: SCHOOL_NAME, detail: SCHOOL_EMAIL },
      { id: "demo-audit-02", establishmentId: ID.school, userId: ID.userDirection, actor: "Camille Direction", action: "Connexion", target: "Direction", detail: "Connexion réussie" },
      { id: "demo-audit-03", establishmentId: ID.school, userId: ID.userAdmin, actor: "Alex Administration", action: "Création d’un élève", target: "Léa Moreau", detail: "DEMO-2026-001" },
      { id: "demo-audit-04", establishmentId: ID.school, userId: ID.userAdmin, actor: "Alex Administration", action: "Création d’un élève", target: "Adam Benali", detail: "DEMO-2026-002" },
      { id: "demo-audit-05", establishmentId: ID.school, userId: ID.userTeacher, actor: "Marc Leroy", action: "Saisie des notes", target: "6e A – Mathématiques", detail: "2 évaluations validées" },
      { id: "demo-audit-06", establishmentId: ID.school, userId: ID.userDirection, actor: "Camille Direction", action: "Publication des bulletins", target: "Premier trimestre", detail: "5 bulletin(s) publié(s)" },
      { id: "demo-audit-07", establishmentId: ID.school, userId: ID.userAccountant, actor: "Jean Comptable", action: "Encaissement", target: "REC-2026-0001", detail: "150,00 € — Léa Moreau" },
      { id: "demo-audit-08", establishmentId: ID.school, userId: ID.userAccountant, actor: "Jean Comptable", action: "Annulation d’un paiement", target: "REC-2026-0005", detail: "Erreur de montant" },
      { id: "demo-audit-09", establishmentId: ID.school, userId: ID.userDirection, actor: "Camille Direction", action: "Export CSV", target: "Élèves", detail: "5 ligne(s)" },
      { id: "demo-audit-10", establishmentId: ID.school, userId: ID.userSupervisor, actor: "Nadia Surveillante", action: "Validation d’un appel", target: "6e A", detail: today },
      { id: "demo-audit-11", establishmentId: ID.school, userId: ID.userDirection, actor: "Camille Direction", action: "Génération d’un document", target: "CERT-2026-0001", detail: "Certificat de scolarité" },
      { id: "demo-audit-12", establishmentId: ID.school, userId: ID.userDirection, actor: "Camille Direction", action: "Création d’un examen", target: "Conseil de classe – trimestre 1", detail: "20 décembre 2026" },
    ]).onConflictDoNothing();
  });

  console.log(`Jeu de démonstration « ${SCHOOL_NAME} » inséré.`);
  console.log(`Mot de passe des comptes démo : ${DEMO_PASSWORD}`);
  console.log("Connexions : direction@demo.scolia.local, administration@demo.scolia.local, professeur@demo.scolia.local, surveillant@demo.scolia.local, comptable@demo.scolia.local, parent@demo.scolia.local, eleve@demo.scolia.local");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Échec de l’insertion des données de démonstration :", error);
    process.exit(1);
  });
