import type { fetchAdministrativeDocument } from "./documents";
import type { fetchReportCardContent } from "./pedagogie";

type PrintableDocument = Awaited<ReturnType<typeof fetchAdministrativeDocument>>;
type PrintableReportCard = Awaited<ReturnType<typeof fetchReportCardContent>>;

type Snapshot = {
  title?: string;
  reference?: string;
  schoolYear?: string;
  issuedOn?: string;
  school?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  student?: {
    name?: string;
    reference?: string;
    birthDate?: string;
    enrolledAt?: string;
    schoolYear?: string;
    className?: string;
    level?: string;
    mainTeacher?: string;
  } | null;
  class?: {
    name?: string;
    level?: string;
    room?: string;
    mainTeacher?: string;
    students?: Array<{ name: string; reference: string; birthDate: string; status: string }>;
  } | null;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function displayDate(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function studentBody(kind: string, student: NonNullable<Snapshot["student"]>) {
  const name = escapeHtml(student.name);
  const birth = escapeHtml(displayDate(student.birthDate));
  const reference = escapeHtml(student.reference);
  const schoolYear = escapeHtml(student.schoolYear);
  const className = escapeHtml(student.className || "—");
  const enrolledAt = escapeHtml(displayDate(student.enrolledAt));
  if (kind === "enrollment") {
    return `
      <p>Le chef d'établissement atteste que <strong>${name}</strong>, né(e) le ${birth},
      immatriculé(e) sous la référence <strong>${reference}</strong>, est régulièrement
      inscrit(e) dans notre établissement pour l'année scolaire <strong>${schoolYear}</strong>,
      en classe de <strong>${className}</strong>, depuis le ${enrolledAt}.</p>
      <p>La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.</p>
    `;
  }
  return `
    <p>Le chef d'établissement certifie que <strong>${name}</strong>, né(e) le ${birth},
    immatriculé(e) sous la référence <strong>${reference}</strong>, est régulièrement
    inscrit(e) et scolarisé(e) dans notre établissement pour l'année scolaire
    <strong>${schoolYear}</strong>, en classe de <strong>${className}</strong>.</p>
    <p>Le présent certificat est délivré à la demande de la famille pour servir et valoir ce que de droit.</p>
  `;
}

function classBody(classe: NonNullable<Snapshot["class"]>) {
  const rows = classe.students ?? [];
  return `
    <p>Classe de <strong>${escapeHtml(classe.name)}</strong>
      ${classe.level ? `— niveau ${escapeHtml(classe.level)}` : ""}
      ${classe.room ? `— salle ${escapeHtml(classe.room)}` : ""}
      ${classe.mainTeacher ? `— professeur principal : ${escapeHtml(classe.mainTeacher)}` : ""}.
      Effectif : <strong>${rows.length}</strong> élève(s).</p>
    <table>
      <thead><tr><th>#</th><th>Élève</th><th>Référence</th><th>Naissance</th><th>Statut</th></tr></thead>
      <tbody>
        ${
          rows.length
            ? rows
                .map(
                  (row, index) => `<tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(row.name)}</td>
                    <td>${escapeHtml(row.reference)}</td>
                    <td>${escapeHtml(displayDate(row.birthDate))}</td>
                    <td>${escapeHtml(row.status)}</td>
                  </tr>`,
                )
                .join("")
            : `<tr><td colspan="5">Aucun élève actif dans cette classe.</td></tr>`
        }
      </tbody>
    </table>
  `;
}

export function renderAdministrativeDocumentHtml(document: PrintableDocument) {
  const snapshot = document.snapshot as Snapshot;
  const school = snapshot.school ?? {};
  const title = document.title || snapshot.title || "Document administratif";
  const schoolYear = snapshot.schoolYear ?? "";
  const isDraft = document.status === "Brouillon";
  const issuedOn = document.issuedAt || snapshot.issuedOn || "";
  const body =
    snapshot.class != null
      ? classBody(snapshot.class)
      : snapshot.student != null
        ? studentBody(document.kind, snapshot.student)
        : "<p>Données indisponibles.</p>";

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — ${escapeHtml(document.reference)}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; color: #1e2a22; font-family: Georgia, "Times New Roman", serif; line-height: 1.55; }
    .draft { border: 2px solid #b68a2c; background: #fff8e6; color: #6b4e10; padding: 10px 14px; margin-bottom: 24px; font-family: Arial, sans-serif; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
    header { border-bottom: 2px solid #557b60; padding-bottom: 14px; margin-bottom: 28px; }
    header h1 { color: #2f4b37; font-size: 22px; margin: 0 0 4px; }
    header p { margin: 2px 0; color: #53645a; font-size: 12px; }
    .meta { display: flex; justify-content: space-between; gap: 16px; margin: 18px 0 28px; font-family: Arial, sans-serif; font-size: 12px; color: #53645a; }
    h2 { text-align: center; font-size: 26px; margin: 32px 0 28px; letter-spacing: .01em; }
    p { font-size: 15px; }
    strong { color: #1e2a22; }
    table { width: 100%; border-collapse: collapse; margin: 18px 0 28px; font-family: Arial, sans-serif; font-size: 12px; }
    th { background: #edf1eb; text-align: left; padding: 8px; border-bottom: 1px solid #b9c5b8; }
    td { padding: 8px; border-bottom: 1px solid #e3e7e0; }
    footer { margin-top: 56px; display: flex; justify-content: space-between; gap: 40px; font-size: 12px; color: #53645a; }
    .signature { width: 240px; text-align: center; border-top: 1px solid #7b8a7f; padding-top: 8px; margin-top: 48px; }
    @media print { body { padding: 0; } .draft { color: #6b4e10 !important; } }
  </style>
</head>
<body>
  ${isDraft ? `<div class="draft">Brouillon — document non officiel</div>` : ""}
  <header>
    <h1>${escapeHtml(school.name || "Établissement scolaire")}</h1>
    ${school.address ? `<p>${escapeHtml(school.address)}</p>` : ""}
    <p>${[school.phone, school.email].filter(Boolean).map(escapeHtml).join(" · ")}</p>
  </header>
  <div class="meta">
    <span>Référence : <strong>${escapeHtml(document.reference)}</strong></span>
    <span>Année scolaire : <strong>${escapeHtml(schoolYear)}</strong></span>
    <span>Émis le : <strong>${escapeHtml(displayDate(issuedOn))}</strong></span>
  </div>
  <h2>${escapeHtml(title)}</h2>
  ${body}
  <footer>
    <span>Document généré par Scolia le ${escapeHtml(displayDate(document.createdAt))}.</span>
    <div class="signature">Le chef d'établissement</div>
  </footer>
</body>
</html>`;
}

function formatScore(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(2).replace(".", ",");
}

export function renderReportCardHtml(report: PrintableReportCard) {
  const isDraft = report.status !== "Publié";
  const rows = report.subjects.length
    ? report.subjects
        .map(
          (subject) => `<tr>
            <td>${escapeHtml(subject.name)}</td>
            <td>${escapeHtml(subject.coefficient)}</td>
            <td><strong>${escapeHtml(formatScore(subject.average))}</strong> / 20</td>
          </tr>`,
        )
        .join("")
    : `<tr><td colspan="3">Aucune moyenne par matière disponible pour ce bulletin.</td></tr>`;
  const periodLabel = report.period.name || "Période";
  const issuedOn = report.publishedAt || report.generatedAt || "";

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bulletin — ${escapeHtml(report.student.name)} — ${escapeHtml(periodLabel)}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; color: #1e2a22; font-family: Georgia, "Times New Roman", serif; line-height: 1.55; }
    .draft { border: 2px solid #b68a2c; background: #fff8e6; color: #6b4e10; padding: 10px 14px; margin-bottom: 24px; font-family: Arial, sans-serif; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
    header { border-bottom: 2px solid #557b60; padding-bottom: 14px; margin-bottom: 28px; }
    header h1 { color: #2f4b37; font-size: 22px; margin: 0 0 4px; }
    header p { margin: 2px 0; color: #53645a; font-size: 12px; }
    .meta { display: flex; justify-content: space-between; gap: 16px; margin: 18px 0 24px; font-family: Arial, sans-serif; font-size: 12px; color: #53645a; flex-wrap: wrap; }
    h2 { text-align: center; font-size: 26px; margin: 28px 0 22px; }
    .identity { background: #f5f7f3; border: 1px solid #dde3d8; padding: 14px 16px; margin-bottom: 18px; font-family: Arial, sans-serif; font-size: 13px; }
    .identity b { color: #1e2a22; }
    table { width: 100%; border-collapse: collapse; margin: 18px 0 28px; font-family: Arial, sans-serif; font-size: 12px; }
    th { background: #edf1eb; text-align: left; padding: 8px; border-bottom: 1px solid #b9c5b8; }
    td { padding: 8px; border-bottom: 1px solid #e3e7e0; }
    .average { margin-top: 8px; padding: 16px; border: 1px solid #cfd9cc; background: #f8faf6; display: flex; justify-content: space-between; align-items: baseline; font-family: Arial, sans-serif; }
    .average span { color: #53645a; font-size: 13px; }
    .average strong { font-size: 28px; color: #2f4b37; }
    footer { margin-top: 56px; display: flex; justify-content: space-between; gap: 40px; font-size: 12px; color: #53645a; }
    .signature { width: 240px; text-align: center; border-top: 1px solid #7b8a7f; padding-top: 8px; margin-top: 48px; }
    @media print { body { padding: 0; } .draft { color: #6b4e10 !important; } }
  </style>
</head>
<body>
  ${isDraft ? `<div class="draft">${escapeHtml(report.status)} — document non officiel</div>` : ""}
  <header>
    <h1>${escapeHtml(report.school.name || "Établissement scolaire")}</h1>
    ${report.school.address ? `<p>${escapeHtml(report.school.address)}</p>` : ""}
    <p>${[report.school.phone, report.school.email].filter(Boolean).map(escapeHtml).join(" · ")}</p>
  </header>
  <div class="meta">
    <span>Période : <strong>${escapeHtml(periodLabel)}</strong></span>
    <span>Statut : <strong>${escapeHtml(report.status)}</strong></span>
    <span>Émis le : <strong>${escapeHtml(displayDate(issuedOn))}</strong></span>
  </div>
  <h2>Bulletin scolaire</h2>
  <div class="identity">
    <div><b>Élève :</b> ${escapeHtml(report.student.name)} (${escapeHtml(report.student.reference || "—")})</div>
    <div><b>Classe :</b> ${escapeHtml(report.class?.name || "—")}${report.class?.level ? ` — ${escapeHtml(report.class.level)}` : ""}</div>
    ${report.student.birthDate ? `<div><b>Date de naissance :</b> ${escapeHtml(displayDate(report.student.birthDate))}</div>` : ""}
    ${report.class?.mainTeacher ? `<div><b>Professeur principal :</b> ${escapeHtml(report.class.mainTeacher)}</div>` : ""}
  </div>
  <table>
    <thead><tr><th>Matière</th><th>Coefficient</th><th>Moyenne / 20</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="average">
    <span>Moyenne générale pondérée</span>
    <strong>${escapeHtml(formatScore(report.average))} <small>/ 20</small></strong>
  </div>
  <footer>
    <span>Bulletin généré par Scolia${report.generatedAt ? ` le ${escapeHtml(displayDate(report.generatedAt))}` : ""}.</span>
    <div class="signature">Le chef d'établissement</div>
  </footer>
</body>
</html>`;
}
