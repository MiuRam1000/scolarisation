import { useEffect, useState } from "react";
import {
  GraduationCap,
  Users,
  BookOpen,
  Wallet,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  Search,
  Bell,
  X,
  Menu,
  MoreHorizontal,
  Check,
  Clock,
  Building2,
  Sparkles,
  LogOut,
  Printer,
  CheckCircle2,
  AlertCircle,
  Circle,
  Download,
  Trash2,
  Paperclip,
  FileCheck2,
} from "lucide-react";
import { students, type DemoRow } from "../lib/demo-data";
import { formatMoney } from "../lib/finance";
import {
  DOCUMENT_LABELS,
  isReferentielModule,
  isScolariteModule,
  studentCompleteness,
  STUDENT_STATUSES,
} from "../lib/scolarite";
import { icons, title, Avatar, Badge, FormField } from "../components/scolia-ui";

import { useScoliaState } from "../hooks/use-scolia-state";
import { buildPrimaryViews } from "./scolia-primary";
import { buildSecondaryViews } from "./scolia-secondary";
import { fetchReportCardContent, type ReportCardContent } from "../lib/pedagogie";
import { renderReportCardHtml } from "../lib/document-print";
const historyDate = (value: string | number | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

export default function Scolia() {
  const ctx = useScoliaState();
  const {
    current,
    profile,
    school,
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
    notes,
    setGradeStage,
    reportStage,
    setReportStage,
    scheduleStage,
    setScheduleStage,
    scheduleView,
    setScheduleView,
    scheduleClasses,
    scheduleSubjects,
    scheduleStaff,
    scheduleRooms,
    scheduleSlots,
    scheduleClassId,
    setScheduleClassId,
    createScheduleSlot,
    createScheduleEntry,
    removeScheduleEntry,
    generateSchedule,
    disciplineSnapshot,
    createDisciplineIncident,
    financeSnapshot,
    financeError,
    createFinanceInvoice,
    recordFinancePayment,
    closeCashRegister,
    communicationSnapshot,
    createAnnouncement,
    publishAnnouncement,
    receipt,
    setReceipt,
    notificationsSnapshot,
    markNotificationRead,
    markAllNotificationsRead,
    notify,
    go,
    isFamily,
    isPlatform,
    visibleGroups,
    module,
    allRows,
    session,
    signOut,
    saveScolariteRow,
    saveReferentielRow,
    updateReferentiel,
    updateScolarite,
    deleteStaffRecord,
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
    canManage,
    getStudent,
    studentHistory,
    classOptions,
    classList,
    staffData,
    subjects,
    programDocuments,
    periods,
    createEvaluationRecord,
    setSelectedEvaluationId,
  } = ctx;
  const [saving, setSaving] = useState(false);
  const detailStudent = current === "students" && detail ? getStudent(detail.sub) : undefined;
  const detailStaff =
    current === "teachers" && detail
      ? (staffData.find((s) => s.id === detail.id) ??
        staffData.find((s) => s.name === detail.name))
      : undefined;
  const modalStaff =
    current === "teachers" && modal?.row
      ? (staffData.find((s) => s.id === modal.row?.id) ??
        staffData.find((s) => s.name === modal.row?.name))
      : undefined;
  const [bulletinContent, setBulletinContent] = useState<ReportCardContent | null>(null);
  const [bulletinLoading, setBulletinLoading] = useState(false);
  const [bulletinError, setBulletinError] = useState("");

  useEffect(() => {
    if (modal?.kind !== "bulletin" || !modal.reportCardId) {
      setBulletinContent(null);
      setBulletinError("");
      setBulletinLoading(false);
      return;
    }
    let cancelled = false;
    setBulletinLoading(true);
    setBulletinError("");
    setBulletinContent(null);
    void fetchReportCardContent(modal.reportCardId)
      .then((content) => {
        if (!cancelled) setBulletinContent(content);
      })
      .catch((error) => {
        if (!cancelled) {
          setBulletinError(error instanceof Error ? error.message : "Bulletin indisponible.");
        }
      })
      .finally(() => {
        if (!cancelled) setBulletinLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [modal?.kind, modal?.reportCardId]);

  function printBulletin(content: ReportCardContent) {
    const preview = window.open("", "_blank", "width=920,height=760");
    if (!preview) {
      ctx.notify("Autorisez l’ouverture d’une fenêtre pour imprimer le bulletin.");
      return;
    }
    const html = renderReportCardHtml(content);
    preview.document.open();
    preview.document.write(html);
    preview.document.close();
    preview.onload = () => {
      preview.focus();
      preview.print();
    };
  }

  const { dashboard, tableScreen, schedule, grades, reports, attendance, discipline } =
    buildPrimaryViews(ctx);
  const {
    payments,
    fees,
    cash,
    messages,
    settingsScreen,
    imports,
    documentsScreen,
    lessonsScreen,
    examsScreen,
    portal,
    health,
    login,
  } = buildSecondaryViews(ctx, schedule);
  function body() {
    if (
      module &&
      !["discipline", "fees", "cash", "documents", "lessons", "exams"].includes(current)
    )
      return tableScreen();
    switch (current) {
      case "schedule":
        return schedule();
      case "grades":
        return grades();
      case "reports":
        return reports();
      case "attendance":
        return attendance();
      case "discipline":
        return discipline();
      case "payments":
        return payments();
      case "fees":
        return fees();
      case "cash":
        return cash();
      case "messages":
        return messages();
      case "settings":
        return settingsScreen();
      case "imports":
        return imports();
      case "documents":
        return documentsScreen();
      case "lessons":
        return lessonsScreen();
      case "exams":
        return examsScreen();
      case "portal":
        return portal();
      case "health":
        return health();
      case "login":
        return login();
      default:
        return dashboard();
    }
  }

  function confirmAction() {
    if (current === "schedule") {
      setScheduleStage("Publié");
      notify("Planning publié dans la maquette. La version précédente est conservée visuellement.");
    } else if (current === "grades") {
      setGradeStage("Validé");
      notify("Évaluation validée et verrouillée dans la session de démonstration.");
    } else if (current === "reports") {
      setReportStage(reportStage === "Validé" ? "Publié" : "Validé");
      notify(
        reportStage === "Validé"
          ? "Publication simulée : aucun document envoyé."
          : "Bulletins de démonstration validés.",
      );
    } else if (current === "attendance")
      notify("Appel enregistré localement. Aucune notification envoyée.");
    else if (current === "cash") notify("Clôture de caisse simulée — aucun effet financier réel.");
    setModal(null);
  }

  return (
    <div className="app-shell">
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Fermer le menu"
          tabIndex={-1}
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <a
          className="brand"
          href="/dashboard"
          onClick={(e) => {
            e.preventDefault();
            go("dashboard");
          }}
        >
          <span className="brand-mark">
            <GraduationCap size={25} />
          </span>
          scolia<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="school-logo">
            <Building2 size={20} />
          </span>
          <div>
            <b>
              {isPlatform
                ? "Scolia · Administration"
                : school.includes("Horizons")
                  ? "Les Horizons"
                  : "Saint-Exupéry"}
            </b>
            <small>{isPlatform ? "Gestion SaaS" : "Espace établissement"}</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <nav className="side-nav">
          {visibleGroups.map((g) => (
            <div className="nav-group" key={g.label}>
              <span className="nav-label">{g.label}</span>
              {g.ids.map((id) => {
                const Icon = icons[id] || Circle;
                return (
                  <a
                    href={"/" + id}
                    className={"nav-item " + (current === id ? "active" : "")}
                    onClick={(e) => {
                      e.preventDefault();
                      go(id);
                    }}
                    key={id}
                  >
                    <Icon size={18} />
                    <span>{title(id)}</span>
                    {id === "messages" && <small>3</small>}
                    {id === "dashboard" && current === id && <span className="active-dot" />}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="help-card">
            <span>
              <Sparkles size={16} /> Bien accompagné.
            </span>
            <p>
              Un coup de main ?<br />
              Nous sommes à vos côtés.
            </p>
            <button
              onClick={() => {
                if (!isPlatform)
                  notify(
                    "Centre d’aide : utilisez le profil Plateforme SaaS pour explorer le support.",
                  );
                else go("support");
              }}
            >
              Centre d’aide <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className="profile-card"
            onClick={() => setModal({ kind: "profile", name: "Mon compte" })}
          >
            <Avatar name={session?.user.name ?? "Utilisateur"} />
            <span>
              <b>{session?.user.name ?? "Utilisateur"}</b>
              <small>{profile}</small>
            </span>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-menu"
              aria-label="Ouvrir le menu"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={22} />
            </button>
            <span>{isPlatform ? "Plateforme" : "Mon établissement"}</span>
            <ChevronRight size={14} />
            <b>{title(current)}</b>
          </div>
          <div className="topbar-right">
            <div className="global-search">
              <Search size={16} />
              <input
                aria-label="Rechercher dans Scolia"
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>⌘ K</kbd>
              {search && (
                <div className="search-results">
                  {Object.keys(icons)
                    .filter((id) => title(id).toLowerCase().includes(search.toLowerCase()))
                    .slice(0, 5)
                    .map((id) => (
                      <button key={id} onClick={() => go(id)}>
                        {title(id)}
                        <ArrowRight size={14} />
                      </button>
                    ))}
                  <small>La recherche filtre aussi la liste courante.</small>
                </div>
              )}
            </div>
            <select
              className="year-select"
              aria-label="Année scolaire"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option>2026–2027</option>
              <option>2025–2026</option>
            </select>
            <div className="notification-wrap">
              <button
                className="icon-btn notification-btn"
                aria-label="Notifications"
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={20} />
                {(notificationsSnapshot?.unreadCount ?? 0) > 0 && <i />}
              </button>
              {notifications && (
                <div className="notification-popover">
                  <h3>
                    Notifications
                    {(notificationsSnapshot?.unreadCount ?? 0) > 0 && (
                      <span className="count">{notificationsSnapshot?.unreadCount}</span>
                    )}
                  </h3>
                  {(notificationsSnapshot?.notifications.length ?? 0) === 0 ? (
                    <p className="notification-empty">Aucune notification pour le moment.</p>
                  ) : (
                    <>
                      <div className="notification-list">
                        {notificationsSnapshot?.notifications.map((n) => (
                          <button
                            key={n.id}
                            className={n.readAt ? "is-read" : undefined}
                            onClick={() => {
                              void markNotificationRead(n.id);
                              go(n.link);
                              setNotifications(false);
                            }}
                          >
                            <span className="mini-check">
                              <Bell size={15} />
                            </span>
                            <span>
                              <b>{n.title}</b>
                              <small>
                                {n.category} ·{" "}
                                {new Date(n.createdAt).toLocaleDateString("fr-FR")}
                              </small>
                            </span>
                            <ChevronRight size={15} />
                          </button>
                        ))}
                      </div>
                      {(notificationsSnapshot?.unreadCount ?? 0) > 0 && (
                        <button
                          className="notification-clear"
                          onClick={() => void markAllNotificationsRead()}
                        >
                          Tout marquer comme lu
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <Avatar name={session?.user.name ?? "Utilisateur"} />
          </div>
        </header>
        <div className="demo-bar">
          <span>
            <span className="live-dot" />{" "}
            {isPlatform ? "ESPACE PLATEFORME" : "ESPACE ÉTABLISSEMENT"}{" "}
            <small>· {school}</small>
          </span>
          <span className="demo-account">
            {session?.user.name} · {profile}
            <button className="text-link" onClick={() => void signOut()}>
              <LogOut size={15} /> Se déconnecter
            </button>
          </span>
        </div>
        <main className="content" key={current + profile}>
          {year === "2025–2026" && (
            <div className="info-box">
              <Clock size={18} />
              <p>
                Année archivée sélectionnée. Les données restent celles du jeu de démonstration
                2026–2027.
              </p>
            </div>
          )}
          {school.includes("Horizons") && (
            <div className="info-line">
              Espace visuel Les Horizons — les listes réutilisent les données fictives. Aucune
              isolation multi-tenant réelle.
            </div>
          )}
          {body()}
          <footer className="content-footer">
            <span>Scolia · Faire grandir, ensemble.</span>
            <span>Compte réel · données de votre établissement</span>
          </footer>
        </main>
      </div>
      {toast && (
        <output className="toast">
          <CheckCircle2 size={19} />
          <span>{toast}</span>
          <button aria-label="Fermer la notification" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </output>
      )}
      {detail && (
        <div className="overlay">
          <button
            className="overlay-close"
            tabIndex={-1}
            aria-label="Fermer la fiche détaillée"
            onClick={() => setDetail(null)}
          />
          <dialog open className="drawer" aria-label="Fiche détaillée" aria-modal="true">
            <div className="drawer-top">
              <span className="eyebrow">
                {current === "students" ? "DOSSIER ÉLÈVE" : "FICHE DÉTAILLÉE"}
              </span>
              <button
                className="icon-btn"
                aria-label="Fermer la fiche"
                onClick={() => setDetail(null)}
              >
                <X size={22} />
              </button>
            </div>
            <Avatar name={detail.name} large />
            <h2>{detail.name}</h2>
            <p className="muted">{detail.sub}</p>
            <Badge>{detail.status}</Badge>
            <div className="tabs standalone">
              {[
                "Informations",
                ...(current === "students" ? ["Responsables", "Documents"] : []),
                "Historique",
                ...(current === "students" ? ["Scolarité"] : []),
              ].map(
                (t) => (
                  <button
                    className={detailTab === t ? "active" : ""}
                    onClick={() => setDetailTab(t)}
                    key={t}
                  >
                    {t}
                  </button>
                ),
              )}
            </div>
            {detailTab === "Informations" ? (
              <>
                {current === "students" && detailStudent ? (
                  <>
                    <div className="detail-fields">
                      <div>
                        <small>Matricule</small>
                        <b>{detailStudent.reference}</b>
                      </div>
                      <div>
                        <small>Classe</small>
                        <b>{detailStudent.className || "Sans classe"}</b>
                      </div>
                      <div>
                        <small>Date de naissance</small>
                        <b>{detailStudent.birthDate || "—"}</b>
                      </div>
                      <div>
                        <small>Sexe</small>
                        <b>{detailStudent.sex || "—"}</b>
                      </div>
                      <div>
                        <small>Responsable légal</small>
                        <b>{detailStudent.guardians.join(", ") || "À renseigner"}</b>
                      </div>
                      <div>
                        <small>Année scolaire</small>
                        <b>{detailStudent.schoolYear || year}</b>
                      </div>
                      <div>
                        <small>Date d’inscription</small>
                        <b>{detailStudent.enrolledAt || "—"}</b>
                      </div>
                      <div>
                        <small>Téléphone</small>
                        <b>{detailStudent.phone || "—"}</b>
                      </div>
                      <div>
                        <small>Adresse</small>
                        <b>{detailStudent.address || "—"}</b>
                      </div>
                    </div>
                    <div className="detail-fields">
                      <div>
                        <small>Pièces jointes</small>
                        <b>
                          {detailStudent.documents?.length
                            ? `${detailStudent.documents.length} fichier(s)`
                            : "Aucune"}
                        </b>
                      </div>
                    </div>
                    <label>
                      Statut du dossier
                      <select
                        className="field"
                        value={detailStudent.status}
                        disabled={!canManage}
                        onChange={async (e) => {
                          try {
                            await setStudentStatus(
                              detailStudent.id,
                              e.target.value as (typeof STUDENT_STATUSES)[number],
                            );
                            notify("Statut du dossier mis à jour.");
                          } catch (error) {
                            notify(
                              error instanceof Error
                                ? error.message
                                : "Changement de statut impossible.",
                            );
                          }
                        }}
                      >
                        {STUDENT_STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : (
                  <div className="detail-fields">
                    {detail.fields.map((f, i) => (
                      <div key={i}>
                        <small>{module?.columns[i + 1]}</small>
                        <b>{f}</b>
                        {i === 1 && current === "subjects" && (() => {
                          const doc = programDocuments.find((d) => d.subjectId === detail.id);
                          if (!doc) return null;
                          return (
                            <span className="muted">
                              {" · "}
                              <button
                                type="button"
                                className="text-link"
                                onClick={() => void downloadProgram(doc.id)}
                              >
                                Télécharger
                              </button>
                              {canManage && (
                                <>
                                  {" · "}
                                  <button
                                    type="button"
                                    className="text-link"
                                    onClick={() => {
                                      void deleteProgram(doc.id)
                                        .then(() => notify("Programme retiré."))
                                        .catch((error: unknown) =>
                                          notify(
                                            error instanceof Error
                                              ? error.message
                                              : "Suppression impossible.",
                                          ),
                                        );
                                    }}
                                  >
                                    Retirer
                                  </button>
                                </>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                    ))}
                    {current === "teachers" && detailStaff && (
                      <>
                        <div>
                          <small>Type de collaborateur</small>
                          <b>{detailStaff.type || "—"}</b>
                        </div>
                        <div>
                          <small>E-mail</small>
                          <b>{detailStaff.email || "—"}</b>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {current === "students" && (
                  <div className="info-box">
                    <Users size={21} />
                    <p>
                      Le matricule est généré automatiquement. Les pièces jointes sont stockées dans
                      le dossier de l’établissement.
                    </p>
                  </div>
                )}
                {current === "subjects" && (
                  <div className="info-box">
                    <Paperclip size={21} />
                    <p>
                      Le programme est un fichier stocké dans la base de l’établissement. Un nouvel
                      import remplace le fichier précédent.
                    </p>
                  </div>
                )}
                {current === "students" ? (
                  canManage && (
                    <button
                      className="btn secondary full"
                      onClick={() => {
                        setModal({ kind: "student", name: "Modifier la fiche", row: detail });
                        setDetail(null);
                      }}
                    >
                      Modifier la fiche <ArrowRight size={16} />
                    </button>
                  )
                ) : isReferentielModule(current) ? (
                  canManage && (
                    <button
                      className="btn secondary full"
                      onClick={() => {
                        setModal({ kind: "generic", name: "Modifier la fiche", row: detail });
                        setDetail(null);
                      }}
                    >
                      Modifier la fiche <ArrowRight size={16} />
                    </button>
                  )
                ) : current === "teachers" ? (
                  canManage && (
                    <>
                      <button
                        className="btn secondary full"
                        onClick={() => {
                          setModal({ kind: "generic", name: "Modifier la fiche", row: detail });
                          setDetail(null);
                        }}
                      >
                        Modifier la fiche <ArrowRight size={16} />
                      </button>
                      <button
                        className="btn secondary full"
                        onClick={() => {
                          setModal({
                            kind: "delete-staff",
                            name: "Retirer un collaborateur",
                            row: detail,
                          });
                          setDetail(null);
                        }}
                      >
                        <Trash2 size={16} /> Retirer de l’établissement
                      </button>
                    </>
                  )
                ) : null}
              </>
            ) : detailTab === "Responsables" && current === "students" ? (
              (() => {
                const student = detailStudent;
                if (!student) return null;
                const guardians = student.guardianDetails ?? [];
                return (
                  <>
                    {!guardians.length && (
                      <div className="info-box">
                        <Users size={21} />
                        <p>
                          Aucun responsable légal n’est encore rattaché à ce dossier. Ajoutez au
                          moins un parent ou tuteur.
                        </p>
                      </div>
                    )}
                    {guardians.map((guardian) => (
                      <details className="guardian-card" key={guardian.guardianId}>
                        <summary>
                          <span>
                            <b>{guardian.name}</b>
                            <small>
                              {guardian.relation}
                              {guardian.phone ? ` · ${guardian.phone}` : ""}
                              {guardian.email ? ` · ${guardian.email}` : ""}
                            </small>
                          </span>
                          <ChevronRight size={16} />
                        </summary>
                        <div className="detail-fields">
                          <div>
                            <small>Lien</small>
                            <b>{guardian.relation || "—"}</b>
                          </div>
                          <div>
                            <small>Téléphone</small>
                            <b>{guardian.phone || "—"}</b>
                          </div>
                          <div>
                            <small>E-mail</small>
                            <b>{guardian.email || "—"}</b>
                          </div>
                          <div>
                            <small>Adresse</small>
                            <b>{guardian.address || "—"}</b>
                          </div>
                        </div>
                        {canManage && (
                          <>
                            <form
                              className="settings-form"
                              onSubmit={async (e) => {
                                e.preventDefault();
                                const f = new FormData(e.currentTarget);
                                try {
                                  await saveStudentGuardian({
                                    studentId: student.id,
                                    guardianId: guardian.guardianId,
                                    name: String(f.get("name") ?? ""),
                                    relation: String(f.get("relation") ?? ""),
                                    phone: String(f.get("phone") ?? ""),
                                    email: String(f.get("email") ?? ""),
                                    address: String(f.get("address") ?? ""),
                                  });
                                  notify("Responsable mis à jour.");
                                } catch (error) {
                                  notify(
                                    error instanceof Error
                                      ? error.message
                                      : "Mise à jour impossible.",
                                  );
                                }
                              }}
                            >
                              <div className="form-grid">
                                <label>
                                  Nom complet
                                  <input
                                    className="field"
                                    name="name"
                                    defaultValue={guardian.name}
                                    required
                                  />
                                </label>
                                <label>
                                  Lien avec l’élève
                                  <select
                                    className="field"
                                    name="relation"
                                    defaultValue={guardian.relation}
                                  >
                                    <option>Père</option>
                                    <option>Mère</option>
                                    <option>Tuteur</option>
                                    <option>Responsable légal</option>
                                  </select>
                                </label>
                                <label>
                                  Téléphone
                                  <input
                                    className="field"
                                    name="phone"
                                    defaultValue={guardian.phone}
                                  />
                                </label>
                                <label>
                                  E-mail
                                  <input
                                    className="field"
                                    name="email"
                                    type="email"
                                    defaultValue={guardian.email}
                                  />
                                </label>
                              </div>
                              <label>
                                Adresse
                                <input
                                  className="field"
                                  name="address"
                                  defaultValue={guardian.address}
                                />
                              </label>
                              <div className="modal-buttons">
                                <button
                                  type="button"
                                  className="btn secondary"
                                  onClick={async () => {
                                    if (
                                      !window.confirm(
                                        `Retirer ${guardian.name} du dossier de ${student.name} ?`,
                                      )
                                    )
                                      return;
                                    try {
                                      await deleteStudentGuardian(
                                        student.id,
                                        guardian.guardianId,
                                      );
                                      notify("Responsable retiré du dossier.");
                                    } catch (error) {
                                      notify(
                                        error instanceof Error
                                          ? error.message
                                          : "Retrait impossible.",
                                      );
                                    }
                                  }}
                                >
                                  Retirer
                                </button>
                                <button className="btn dark" type="submit">
                                  Enregistrer
                                </button>
                              </div>
                            </form>
                          </>
                        )}
                      </details>
                    ))}
                    {canManage && (
                      <form
                        className="settings-form"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const f = new FormData(e.currentTarget);
                          try {
                            await saveStudentGuardian({
                              studentId: student.id,
                              name: String(f.get("name") ?? ""),
                              relation: String(f.get("relation") ?? ""),
                              phone: String(f.get("phone") ?? ""),
                              email: String(f.get("email") ?? ""),
                              address: String(f.get("address") ?? ""),
                            });
                            e.currentTarget.reset();
                            notify("Responsable ajouté au dossier.");
                          } catch (error) {
                            notify(
                              error instanceof Error ? error.message : "Ajout impossible.",
                            );
                          }
                        }}
                      >
                        <h3 className="form-section-title">Ajouter un responsable</h3>
                        <div className="form-grid">
                          <label>
                            Nom complet
                            <input className="field" name="name" required />
                          </label>
                          <label>
                            Lien avec l’élève
                            <select className="field" name="relation">
                              <option>Père</option>
                              <option>Mère</option>
                              <option>Tuteur</option>
                              <option>Responsable légal</option>
                            </select>
                          </label>
                          <label>
                            Téléphone
                            <input className="field" name="phone" type="tel" />
                          </label>
                          <label>
                            E-mail (facultatif)
                            <input className="field" name="email" type="email" />
                          </label>
                        </div>
                        <label>
                          Adresse (facultatif)
                          <input className="field" name="address" />
                        </label>
                        <div className="modal-buttons">
                          <button className="btn dark" type="submit">
                            Ajouter <Check size={16} />
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                );
              })()
            ) : detailTab === "Documents" && current === "students" ? (
              (() => {
                const student = detailStudent;
                if (!student) return null;
                const { checks, complete } = studentCompleteness(student);
                const docs = student.documents ?? [];
                const upload = async (kind: string, file?: File) => {
                  if (!file) return;
                  try {
                    await uploadDocument(student.id, kind, file);
                    notify(`${DOCUMENT_LABELS[kind]} importé.`);
                  } catch (error) {
                    notify(
                      error instanceof Error ? error.message : "Import du fichier impossible.",
                    );
                  }
                };
                return (
                  <>
                    <div className={"dossier-check " + (complete ? "complete" : "incomplete")}>
                      <FileCheck2 size={22} />
                      <div>
                        <b>{complete ? "Dossier complet" : "Dossier incomplet"}</b>
                        <small>
                          {checks.filter((c) => c.done).length} / {checks.length} vérifications
                          validées
                        </small>
                      </div>
                    </div>
                    <div className="checklist">
                      {checks.map((check) => (
                        <p key={check.label} className={check.done ? "done" : "missing"}>
                          {check.done ? <Check size={15} /> : <AlertCircle size={15} />}
                          {check.label}
                        </p>
                      ))}
                    </div>

                    <h3 className="form-section-title">
                      <Paperclip size={14} /> Pièces jointes importées
                    </h3>
                    {docs.length ? (
                      <div className="document-list">
                        {docs.map((doc) => (
                          <div key={doc.id} className="document-row">
                            <Paperclip size={16} />
                            <span>
                              <b>{DOCUMENT_LABELS[doc.kind] ?? doc.kind}</b>
                              <small>
                                {doc.fileName} · {Math.max(1, Math.round(doc.size / 1024))} Ko
                              </small>
                            </span>
                            <button
                              className="icon-btn"
                              aria-label={"Télécharger " + doc.fileName}
                              onClick={() => downloadDocument(doc.id)}
                            >
                              <Download size={16} />
                            </button>
                            {canManage && (
                              <button
                                className="icon-btn danger"
                                aria-label={"Supprimer " + doc.fileName}
                                onClick={async () => {
                                  try {
                                    await deleteDocument(doc.id);
                                    notify("Pièce jointe supprimée.");
                                  } catch (error) {
                                    notify(
                                      error instanceof Error
                                        ? error.message
                                        : "Suppression impossible.",
                                    );
                                  }
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="muted">Aucune pièce jointe pour le moment.</p>
                    )}

                    {canManage && (
                      <>
                        <h3 className="form-section-title">
                          <Paperclip size={14} /> Importer une pièce jointe
                        </h3>
                        <div className="form-grid">
                          {[
                            ["photo", "Photo de l’élève"],
                            ["birth_certificate", "Acte de naissance"],
                            ["transfer_certificate", "Certificat de transfert"],
                          ].map(([kind, label]) => (
                            <label key={kind}>
                              {label}
                              <input
                                className="field"
                                type="file"
                                onChange={async (e) => {
                                  await upload(kind, e.target.files?.[0]);
                                  e.currentTarget.value = "";
                                }}
                              />
                            </label>
                          ))}
                        </div>
                        <p className="muted">
                          Formats acceptés : images, PDF et documents bureautiques. Taille maximale :
                          5 Mo.
                        </p>
                      </>
                    )}
                  </>
                );
              })()
            ) : detailTab === "Historique" ? (
              current === "students" ? (
                (() => {
                  const events = studentHistory(detail.sub);
                  if (!events.length)
                    return (
                      <div className="info-box">
                        <Clock size={21} />
                        <p>Aucun événement enregistré pour ce dossier pour le moment.</p>
                      </div>
                    );
                  return (
                    <div className="timeline">
                      {events.map((event) => (
                        <p key={event.id}>
                          <i />
                          {event.action}
                          {event.detail ? ` · ${event.detail}` : ""}
                          <small>
                            {historyDate(event.createdAt)}
                            {event.actor ? ` · ${event.actor}` : ""}
                          </small>
                        </p>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="timeline">
                  <p>
                    <i />
                    Création du dossier <small>Septembre 2026 · Administration</small>
                  </p>
                  <p>
                    <i />
                    Vérification des informations <small>Octobre 2026 · Secrétariat</small>
                  </p>
                  <p>
                    <i />
                    Dernière consultation <small>Aujourd’hui · Démonstration</small>
                  </p>
                </div>
              )
            ) : current === "students" ? (
              (() => {
                const student = detailStudent;
                if (!student) return null;
                const enrollmentLabels: Record<string, string> = {
                  inscription: "Inscription",
                  reinscription: "Réinscription",
                  transfert: "Transfert",
                  archivage: "Archivage",
                };
                return (
                  <>
                    <div className="detail-fields">
                      <div>
                        <small>Année active</small>
                        <b>{student.schoolYear || year}</b>
                      </div>
                      <div>
                        <small>Classe</small>
                        <b>{student.className || "Sans classe"}</b>
                      </div>
                      <div>
                        <small>Décision d’admission</small>
                        <b>{student.admissionDecision || "En attente"}</b>
                      </div>
                      <div>
                        <small>Dossier archivé le</small>
                        <b>{student.archivedAt || "—"}</b>
                      </div>
                    </div>

                    <h3 className="form-section-title">Parcours scolaire</h3>
                    {(student.enrollments ?? []).length ? (
                      <div className="timeline">
                        {(student.enrollments ?? []).map((enrollment) => (
                          <p key={enrollment.id}>
                            <i />
                            {enrollmentLabels[enrollment.kind] ?? enrollment.kind}
                            {` · ${enrollment.schoolYear || "Année non précisée"}`}
                            {enrollment.className ? ` · ${enrollment.className}` : ""}
                            {enrollment.status ? ` · ${enrollment.status}` : ""}
                            <small>
                              {enrollment.enrolledAt || historyDate(enrollment.createdAt)}
                              {enrollment.note ? ` · ${enrollment.note}` : ""}
                            </small>
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="muted">Aucun mouvement enregistré pour ce dossier.</p>
                    )}

                    {canManage && (
                      <>
                        <form
                          className="settings-form"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            const classId = String(f.get("classId") ?? "");
                            try {
                              await decideAdmission(
                                student.id,
                                String(f.get("decision") ?? "accepté") as
                                  | "accepté"
                                  | "refusé"
                                  | "liste d'attente",
                                String(f.get("note") ?? ""),
                                classId || undefined,
                              );
                              notify("Décision d’admission enregistrée.");
                            } catch (error) {
                              notify(
                                error instanceof Error ? error.message : "Décision impossible.",
                              );
                            }
                          }}
                        >
                          <h3 className="form-section-title">Décision d’admission</h3>
                          <div className="form-grid">
                            <label>
                              Décision
                              <select
                                className="field"
                                name="decision"
                                defaultValue={student.admissionDecision || "accepté"}
                              >
                                <option value="accepté">Accepté</option>
                                <option value="refusé">Refusé</option>
                                <option value="liste d'attente">Liste d’attente</option>
                              </select>
                            </label>
                            <label>
                              Classe affectée
                              <select
                                className="field"
                                name="classId"
                                defaultValue={student.classId ?? ""}
                              >
                                <option value="">Sans classe</option>
                                {classList.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <label>
                            Motif / observation
                            <input className="field" name="note" />
                          </label>
                          <div className="modal-buttons">
                            <button className="btn dark" type="submit">
                              Enregistrer la décision
                            </button>
                          </div>
                        </form>

                        <form
                          className="settings-form"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            try {
                              await reinscribe({
                                id: student.id,
                                schoolYear: String(f.get("schoolYear") ?? ""),
                                classId: String(f.get("classId") ?? "") || undefined,
                                enrolledAt: String(f.get("enrolledAt") ?? ""),
                                note: String(f.get("note") ?? ""),
                              });
                              notify("Réinscription enregistrée.");
                            } catch (error) {
                              notify(
                                error instanceof Error
                                  ? error.message
                                  : "Réinscription impossible.",
                              );
                            }
                          }}
                        >
                          <h3 className="form-section-title">Réinscription annuelle</h3>
                          <div className="form-grid">
                            <label>
                              Année scolaire
                              <input
                                className="field"
                                name="schoolYear"
                                defaultValue={student.schoolYear || year}
                                required
                              />
                            </label>
                            <label>
                              Classe
                              <select
                                className="field"
                                name="classId"
                                defaultValue={student.classId ?? ""}
                              >
                                <option value="">Conserver la classe actuelle</option>
                                {classList.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Date d’inscription
                              <input
                                className="field"
                                type="date"
                                name="enrolledAt"
                                defaultValue={new Date().toISOString().slice(0, 10)}
                              />
                            </label>
                          </div>
                          <label>
                            Observation
                            <input className="field" name="note" />
                          </label>
                          <div className="modal-buttons">
                            <button className="btn dark" type="submit">
                              Réinscrire
                            </button>
                          </div>
                        </form>

                        <form
                          className="settings-form"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            const classId = String(f.get("classId") ?? "");
                            if (!classId) {
                              notify("Sélectionnez une classe de destination.");
                              return;
                            }
                            try {
                              await transferToClass(
                                student.id,
                                classId,
                                String(f.get("reason") ?? ""),
                              );
                              notify("Transfert enregistré.");
                            } catch (error) {
                              notify(
                                error instanceof Error ? error.message : "Transfert impossible.",
                              );
                            }
                          }}
                        >
                          <h3 className="form-section-title">Transfert de classe</h3>
                          <div className="form-grid">
                            <label>
                              Classe de destination
                              <select className="field" name="classId" defaultValue="">
                                <option value="">Sélectionner…</option>
                                {classList
                                  .filter((c) => c.id !== student.classId)
                                  .map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                              </select>
                            </label>
                            <label>
                              Motif
                              <input className="field" name="reason" />
                            </label>
                          </div>
                          <div className="modal-buttons">
                            <button className="btn dark" type="submit">
                              Transférer
                            </button>
                          </div>
                        </form>

                        <form
                          className="settings-form"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            const destination = String(f.get("destination") ?? "").trim();
                            if (!destination) {
                              notify("Indiquez l’établissement de destination.");
                              return;
                            }
                            try {
                              await transferOut(
                                student.id,
                                destination,
                                String(f.get("reason") ?? ""),
                              );
                              notify("Transfert sortant enregistré.");
                            } catch (error) {
                              notify(
                                error instanceof Error ? error.message : "Transfert impossible.",
                              );
                            }
                          }}
                        >
                          <h3 className="form-section-title">
                            Transfert vers un autre établissement
                          </h3>
                          <div className="form-grid">
                            <label>
                              Établissement de destination
                              <input className="field" name="destination" required />
                            </label>
                            <label>
                              Motif
                              <input className="field" name="reason" />
                            </label>
                          </div>
                          <div className="modal-buttons">
                            <button className="btn dark" type="submit">
                              Transférer hors établissement
                            </button>
                          </div>
                        </form>

                        <div className="info-box">
                          <AlertCircle size={21} />
                          <p>
                            L’archivage conserve le dossier et son historique, mais le retire des
                            listes actives.
                          </p>
                        </div>
                        <button
                          className="btn secondary full"
                          onClick={async () => {
                            if (
                              !window.confirm(
                                `Archiver le dossier de ${student.name} ? Cette action est journalisée.`,
                              )
                            )
                              return;
                            try {
                              await archiveRecord(student.id, "Archivage manuel");
                              notify("Dossier archivé.");
                            } catch (error) {
                              notify(
                                error instanceof Error ? error.message : "Archivage impossible.",
                              );
                            }
                          }}
                        >
                          Archiver le dossier <ArrowRight size={16} />
                        </button>
                      </>
                    )}
                  </>
                );
              })()
            ) : (
              <>
                <div className="detail-fields">
                  <div>
                    <small>Année active</small>
                    <b>{year}</b>
                  </div>
                  <div>
                    <small>Classe</small>
                    <b>{detail.fields[0]}</b>
                  </div>
                  <div>
                    <small>Parcours</small>
                    <b>Inscription annuelle · 2026</b>
                  </div>
                </div>
                <button
                  className="btn secondary full"
                  onClick={() => {
                    setDetail(null);
                    go("reports");
                  }}
                >
                  Consulter les bulletins <ArrowRight size={16} />
                </button>
              </>
            )}
          </dialog>
        </div>
      )}
      {(modal || receipt) && (
        <div className="overlay modal-overlay">
          <button
            className="overlay-close"
            tabIndex={-1}
            aria-label="Fermer la fenêtre de démonstration"
            onClick={() => {
              setModal(null);
              setReceipt(null);
            }}
          />
          <dialog
            open
            className={"modal " + (modal?.kind === "bulletin" || modal?.kind === "student" ? "wide" : "")}
            aria-modal="true"
            aria-label={modal?.name || "Reçu"}
          >
            <div className="modal-heading">
              <h2>{modal?.name || "Reçu de paiement"}</h2>
              <button
                className="icon-btn"
                aria-label="Fermer la fenêtre"
                onClick={() => {
                  setModal(null);
                  setReceipt(null);
                }}
              >
                <X size={22} />
              </button>
            </div>
            {receipt ? (
              <>
                <div className="receipt-brand">
                  <GraduationCap size={28} />
                  <b>{school || "Établissement"}</b>
                  <small>REÇU DE PAIEMENT</small>
                </div>
                <div className="detail-fields">
                  {[
                    ["Référence", receipt.sub],
                    ["Élève", receipt.name],
                    ["Frais", receipt.fields[0]],
                    ["Mode de paiement", receipt.fields[1]],
                    ["Montant reçu", receipt.fields[2]],
                    ["Date", receipt.fields[3] || "—"],
                    ["Statut", receipt.fields[4] || receipt.status],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <small>{k}</small>
                      <b>{v}</b>
                    </div>
                  ))}
                </div>
                <button className="btn dark full" onClick={() => window.print()}>
                  <Printer size={16} /> Imprimer le reçu
                </button>
              </>
            ) : (
              modal && renderModal()
            )}
          </dialog>
        </div>
      )}
    </div>
  );

  function renderModal() {
    if (!modal) return null;
    const kind = modal.kind;
    if (kind === "profile")
      return (
        <>
          <p className="muted">
            Compte connecté à {school}. Le rôle est attribué par la direction de l’établissement.
          </p>
          <div className="detail-fields">
            {[
              ["Nom", session?.user.name ?? "—"],
              ["Adresse e-mail", session?.user.email ?? "—"],
              ["Rôle", profile],
              ["Établissement", session?.establishment?.name ?? "Plateforme Scolia"],
            ].map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <b>{value}</b>
              </div>
            ))}
          </div>
          <button
            className="btn dark full"
            onClick={() => {
              setModal(null);
              void signOut();
            }}
          >
            <LogOut size={16} /> Se déconnecter
          </button>
        </>
      );
    if (kind === "confirm")
      return (
        <>
          <div className="info-box">
            <AlertCircle size={24} />
            <p>
              Cette action modifie uniquement l’état de démonstration. Aucun envoi ni traitement
              serveur n’est déclenché.
            </p>
          </div>
          <div className="modal-buttons">
            <button className="btn secondary" onClick={() => setModal(null)}>
              Annuler
            </button>
            <button className="btn dark" onClick={confirmAction}>
              Confirmer <Check size={16} />
            </button>
          </div>
        </>
      );
    if (kind === "delete-staff") {
      const target = modal.row;
      return (
        <>
          <div className="info-box">
            <AlertCircle size={24} />
            <p>
              Retirer <b>{target?.name ?? "ce collaborateur"}</b> de l’établissement ? Cette
              action est définitive.
            </p>
          </div>
          <div className="modal-buttons">
            <button className="btn secondary" onClick={() => setModal(null)}>
              Annuler
            </button>
            <button
              className="btn dark"
              onClick={async () => {
                if (!target?.id) {
                  notify("Collaborateur introuvable.");
                  return;
                }
                try {
                  await deleteStaffRecord(target.id);
                  setModal(null);
                  notify("Collaborateur retiré de l’établissement.");
                } catch (error) {
                  notify(error instanceof Error ? error.message : "Suppression impossible.");
                }
              }}
            >
              Retirer <Check size={16} />
            </button>
          </div>
        </>
      );
    }
    if (kind === "bulletin") {
      if (!modal.reportCardId) {
        return (
          <div className="info-box">
            <AlertCircle size={24} />
            <p>Aucun bulletin sélectionné.</p>
          </div>
        );
      }
      if (bulletinLoading) {
        return <p className="muted">Chargement du bulletin…</p>;
      }
      if (bulletinError) {
        return (
          <div className="info-box">
            <AlertCircle size={24} />
            <p>{bulletinError}</p>
          </div>
        );
      }
      if (!bulletinContent) return null;
      const issuedOn = bulletinContent.publishedAt || bulletinContent.generatedAt || "—";
      const isDraft = bulletinContent.status !== "Publié";
      return (
        <>
          <div className="bulletin">
            <div className="bulletin-top">
              <span className="school-logo">
                <GraduationCap size={27} />
              </span>
              <div>
                <h3>{bulletinContent.school.name || school}</h3>
                <p>Bulletin — {bulletinContent.period.name}</p>
              </div>
              <Badge>{bulletinContent.status}</Badge>
            </div>
            {isDraft && (
              <p className="muted small">
                Ce bulletin n’est pas publié. Le document imprimé portera la mention « non officiel ».
              </p>
            )}
            <div className="bulletin-person">
              <b>{bulletinContent.student.name}</b>
              <span>
                {bulletinContent.class?.name || "Classe non renseignée"}
                {bulletinContent.class?.level ? ` — ${bulletinContent.class.level}` : ""}
                {" — "}
                {bulletinContent.student.reference || "Référence —"}
              </span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Matière</th>
                  <th>Coeff.</th>
                  <th>Moyenne /20</th>
                </tr>
              </thead>
              <tbody>
                {bulletinContent.subjects.length ? (
                  bulletinContent.subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td>{subject.name}</td>
                      <td>{subject.coefficient}</td>
                      <td>
                        <b>{subject.average.toFixed(2).replace(".", ",")}</b>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="muted">
                      Aucune moyenne par matière disponible pour ce bulletin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="bulletin-result">
              <span>Moyenne générale pondérée</span>
              <b>
                {bulletinContent.average === null
                  ? "—"
                  : bulletinContent.average.toFixed(2).replace(".", ",")}{" "}
                <small>/ 20</small>
              </b>
            </div>
            <p className="muted small">
              Émis le {issuedOn}. Les moyennes sont calculées à partir des évaluations validées.
            </p>
          </div>
          <button className="btn dark full" onClick={() => printBulletin(bulletinContent)}>
            <Printer size={16} /> Imprimer le bulletin
          </button>
        </>
      );
    }
    if (kind === "discipline-add")
      return (
        <form
          className="settings-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setSaving(true);
            try {
              await createDisciplineIncident({
                studentId: String(form.get("studentId") ?? ""),
                date: String(form.get("date") ?? ""),
                type: String(form.get("type") ?? "Observation"),
                severity: String(form.get("severity") ?? "Moyenne"),
                description: String(form.get("description") ?? ""),
                location: String(form.get("location") ?? ""),
                responsibleStaffId:
                  String(form.get("responsibleStaffId") ?? "") || undefined,
                measures: String(form.get("measures") ?? ""),
                status: String(form.get("status") ?? "Ouvert"),
              });
              notify("Suivi éducatif ajouté.");
              setModal(null);
            } catch (error) {
              notify(error instanceof Error ? error.message : "Ajout impossible.");
            } finally {
              setSaving(false);
            }
          }}
        >
          {!disciplineSnapshot?.students.length ? (
            <div className="info-box">
              <AlertCircle size={20} />
              <p>Créez ou inscrivez d’abord un élève dans une classe.</p>
            </div>
          ) : (
            <>
              <div className="form-grid">
                <label>
                  Élève
                  <select className="field" name="studentId" defaultValue={disciplineSnapshot.students[0].id}>
                    {disciplineSnapshot.students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.lastName} {student.firstName}
                        {student.className ? ` · ${student.className}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Date
                  <input
                    className="field"
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </label>
              </div>
              <div className="form-grid">
                <label>
                  Type
                  <select className="field" name="type" defaultValue="Observation">
                    <option>Observation</option>
                    <option>Avertissement</option>
                    <option>Sanction</option>
                    <option>Incident</option>
                  </select>
                </label>
                <label>
                  Gravité
                  <select className="field" name="severity" defaultValue="Moyenne">
                    <option>Faible</option>
                    <option>Moyenne</option>
                    <option>Élevée</option>
                  </select>
                </label>
              </div>
              <label>
                Description
                <textarea
                  className="field"
                  name="description"
                  required
                  minLength={2}
                  placeholder="Décrire les faits observés…"
                />
              </label>
              <div className="form-grid">
                <label>
                  Lieu
                  <input className="field" name="location" placeholder="Salle, cour, couloir…" />
                </label>
                <label>
                  Responsable
                  <select className="field" name="responsibleStaffId" defaultValue="">
                    <option value="">Utilisateur connecté</option>
                    {(disciplineSnapshot?.staff ?? []).map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Mesures prises
                <textarea
                  className="field"
                  name="measures"
                  placeholder="Entretien, accompagnement, sanction autorisée…"
                />
              </label>
              <label>
                Statut initial
                <select className="field" name="status" defaultValue="Ouvert">
                  <option>Ouvert</option>
                  <option>En cours</option>
                  <option>Résolu</option>
                  <option>Archivé</option>
                </select>
              </label>
              <div className="modal-buttons">
                <button className="btn secondary" type="button" onClick={() => setModal(null)}>
                  Annuler
                </button>
                <button className="btn dark" type="submit" disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer le suivi"}
                </button>
              </div>
            </>
          )}
        </form>
      );
    if (kind === "schedule-slot")
      return (
        <form
          className="settings-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setSaving(true);
            try {
              await createScheduleSlot({
                name: String(form.get("name") ?? "").trim(),
                dayOfWeek: Number(form.get("dayOfWeek") ?? 1),
                startsAt: String(form.get("startsAt") ?? ""),
                endsAt: String(form.get("endsAt") ?? ""),
                kind: String(form.get("kind") ?? "Cours") as "Cours" | "Pause",
              });
              notify("Créneau créé.");
              setModal(null);
            } catch (error) {
              notify(error instanceof Error ? error.message : "Création impossible.");
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="form-grid">
            <label>
              Jour
              <select className="field" name="dayOfWeek" defaultValue="1">
                <option value="1">Lundi</option>
                <option value="2">Mardi</option>
                <option value="3">Mercredi</option>
                <option value="4">Jeudi</option>
                <option value="5">Vendredi</option>
                <option value="6">Samedi</option>
              </select>
            </label>
            <label>
              Type
              <select className="field" name="kind" defaultValue="Cours">
                <option value="Cours">Cours</option>
                <option value="Pause">Pause</option>
              </select>
            </label>
          </div>
          <div className="form-grid">
            <label>
              Début
              <input className="field" type="time" name="startsAt" required defaultValue="08:00" />
            </label>
            <label>
              Fin
              <input className="field" type="time" name="endsAt" required defaultValue="09:00" />
            </label>
          </div>
          <label>
            Libellé (optionnel)
            <input className="field" name="name" placeholder="Ex. Mathématiques" />
          </label>
          <div className="modal-buttons">
            <button className="btn secondary" type="button" onClick={() => setModal(null)}>
              Annuler
            </button>
            <button className="btn dark" type="submit" disabled={saving}>
              {saving ? "Création…" : "Créer le créneau"}
            </button>
          </div>
        </form>
      );
    if (kind === "schedule-add")
      return (
        <form
          className="settings-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setSaving(true);
            try {
              await createScheduleEntry({
                classId: String(form.get("classId") ?? ""),
                subjectId: String(form.get("subjectId") ?? ""),
                slotId: String(form.get("slotId") ?? ""),
                staffId: String(form.get("staffId") ?? "") || undefined,
                roomId: String(form.get("roomId") ?? "") || undefined,
                note: String(form.get("note") ?? ""),
              });
              notify("Cours ajouté au planning.");
              setModal(null);
            } catch (error) {
              notify(error instanceof Error ? error.message : "Ajout impossible.");
            } finally {
              setSaving(false);
            }
          }}
        >
          {!scheduleClasses.length ||
          !scheduleSubjects.length ||
          !scheduleSlots.some((slot) => slot.kind === "Cours") ? (
            <div className="info-box">
              <AlertCircle size={20} />
              <p>
                Créez au moins une classe, une matière et un créneau de cours avant d’ajouter une
                séance.
              </p>
            </div>
          ) : (
            <>
              <div className="form-grid">
                <label>
                  Classe
                  <select
                    className="field"
                    name="classId"
                    defaultValue={scheduleClassId || scheduleClasses[0].id}
                  >
                    {scheduleClasses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Matière
                  <select className="field" name="subjectId" defaultValue={scheduleSubjects[0].id}>
                    {scheduleSubjects.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Créneau
                <select
                  className="field"
                  name="slotId"
                  defaultValue={scheduleSlots.find((slot) => slot.kind === "Cours")?.id ?? ""}
                >
                  {scheduleSlots
                    .filter((slot) => slot.kind === "Cours")
                    .map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][
                          slot.dayOfWeek
                        ]}{" "}
                        · {slot.startsAt}–{slot.endsAt}
                      </option>
                    ))}
                </select>
              </label>
              <div className="form-grid">
                <label>
                  Enseignant (optionnel)
                  <select className="field" name="staffId" defaultValue="">
                    <option value="">Non affecté</option>
                    {scheduleStaff
                      .filter((person) => person.type === "Enseignant")
                      .map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Salle (optionnel)
                  <select className="field" name="roomId" defaultValue="">
                    <option value="">Sans salle</option>
                    {scheduleRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} · {room.capacity} places
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Observation
                <input className="field" name="note" />
              </label>
              <div className="modal-buttons">
                <button className="btn secondary" type="button" onClick={() => setModal(null)}>
                  Annuler
                </button>
                <button className="btn dark" type="submit" disabled={saving}>
                  {saving ? "Ajout…" : "Ajouter le cours"}
                </button>
              </div>
            </>
          )}
        </form>
      );
    if (kind === "generate")
      return (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setSaving(true);
            try {
              const result = await generateSchedule(String(form.get("classId") ?? ""));
              notify(
                `${result.created} cours généré(s).${
                  result.remaining ? ` ${result.remaining} cours n’ont pas pu être placés.` : ""
                }`,
              );
              setModal(null);
            } catch (error) {
              notify(error instanceof Error ? error.message : "Génération impossible.");
            } finally {
              setSaving(false);
            }
          }}
        >
          <p className="muted">
            Le moteur propose des cours sans conflit de classe, d’enseignant ou de salle. La
            proposition reste modifiable avant validation.
          </p>
          {!scheduleClasses.length ? (
            <div className="info-box">
              <AlertCircle size={20} />
              <p>Créez d’abord une classe.</p>
            </div>
          ) : (
            <>
              <label>
                Classe
                <select
                  className="field"
                  name="classId"
                  defaultValue={scheduleClassId || scheduleClasses[0].id}
                >
                  {scheduleClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="info-box">
                <Sparkles size={20} />
                <p>
                  Le générateur respecte les volumes horaires des matières et évite les conflits
                  obligatoires. Les contraintes souples restent à affiner manuellement.
                </p>
              </div>
              <button className="btn dark full" type="submit" disabled={saving}>
                <Sparkles size={16} />{" "}
                {saving ? "Génération…" : "Générer la proposition"}
              </button>
            </>
          )}
        </form>
      );
    if (kind === "lesson")
      return (
        <>
          <div className="detail-fields">
            <div>
              <small>Classe</small>
              <b>{modal.row?.fields[0] ?? "—"}</b>
            </div>
            <div>
              <small>Enseignant</small>
              <b>{modal.row?.fields[1] ?? "Non affecté"}</b>
            </div>
            <div>
              <small>Salle</small>
              <b>{modal.row?.fields[2] ?? "Sans salle"}</b>
            </div>
            <div>
              <small>Créneau</small>
              <b>{modal.row?.fields[3] ?? "—"}</b>
            </div>
            <div>
              <small>État</small>
              <b>{modal.row?.status ?? "Brouillon"}</b>
            </div>
          </div>
          {canManage && modal.row?.id ? (
            <button
              className="btn secondary full"
              onClick={async () => {
                const published = modal.row?.status === "Publié";
                if (
                  published &&
                  !window.confirm(
                    "Retirer ce cours du planning publié ? L’ancienne version est conservée dans l’historique, puis la publication sera recalculée.",
                  )
                ) {
                  return;
                }
                try {
                  await removeScheduleEntry(modal.row!.id!);
                  notify(published ? "Cours retiré du planning publié." : "Cours supprimé du planning.");
                  setModal(null);
                } catch (error) {
                  notify(error instanceof Error ? error.message : "Suppression impossible.");
                }
              }}
            >
              <Trash2 size={16} />{" "}
              {modal.row?.status === "Publié" ? "Retirer ce cours publié" : "Supprimer ce cours"}
            </button>
          ) : (
            <div className="info-box">
              <AlertCircle size={20} />
              <p>
                {canManage
                  ? "Ce cours ne peut pas être modifié depuis cet écran."
                  : "Vous consultez un cours en lecture seule."}
              </p>
            </div>
          )}
        </>
      );
    if (kind === "unlock")
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setGradeStage("Brouillon");
            setModal(null);
            notify("Correction motivée simulée : grille déverrouillée.");
          }}
        >
          <label>
            Motif de correction
            <textarea
              aria-label="Motif de correction"
              className="field"
              required
              minLength={8}
              placeholder="Décrivez la correction à apporter…"
            />
          </label>
          <p className="muted">
            En production, cette dérogation devra être autorisée et journalisée côté serveur.
          </p>
          <button className="btn dark full">Déverrouiller la démonstration</button>
        </form>
      );
    if (kind === "payment") {
      const openInvoices = (financeSnapshot?.invoices ?? []).filter(
        (invoice) => invoice.status !== "Annulé" && invoice.balanceCents > 0,
      );
      const firstInvoice = openInvoices[0];
      return (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const invoice = openInvoices.find(
              (item) => item.id === String(f.get("invoiceId")),
            );
            const amountCents = Math.round(Number(f.get("amount")) * 100);
            if (!invoice) {
              notify("Sélectionnez un frais à encaisser.");
              return;
            }
            if (!Number.isFinite(amountCents) || amountCents <= 0) {
              notify("Saisissez un montant valide.");
              return;
            }
            const method = String(f.get("method") ?? "Espèces");
            const paidAt = String(f.get("paidAt") ?? "");
            setSaving(true);
            try {
              const result = await recordFinancePayment({
                invoiceId: invoice.id,
                amountCents,
                method,
                reference: String(f.get("reference") ?? ""),
                paidAt,
                note: String(f.get("note") ?? ""),
              });
              setModal(null);
              setReceipt({
                name: invoice.studentName,
                sub: result.receiptNumber,
                fields: [
                  invoice.label,
                  method,
                  formatMoney(amountCents),
                  paidAt,
                  "Validé",
                ],
                status: "Validé",
              });
              notify(`Paiement enregistré. Reçu ${result.receiptNumber}.`);
            } catch (error) {
              notify(error instanceof Error ? error.message : "Paiement impossible.");
            } finally {
              setSaving(false);
            }
          }}
        >
          {financeError ? (
            <div className="info-line">
              <AlertCircle size={16} /> {financeError}
            </div>
          ) : null}
          {!openInvoices.length ? (
            <div className="info-box">
              <Wallet size={20} />
              <p>
                Aucun frais avec un solde à encaisser. Créez d’abord des frais depuis la page
                « Frais & échéances ».
              </p>
            </div>
          ) : (
            <>
              <label>
                Frais à encaisser
                <select className="field" name="invoiceId" defaultValue={firstInvoice?.id}>
                  {openInvoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.studentName} · {invoice.label} · solde{" "}
                      {formatMoney(invoice.balanceCents)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label>
                  Montant reçu (€)
                  <input
                    className="field"
                    name="amount"
                    type="number"
                    defaultValue={
                      firstInvoice ? (firstInvoice.balanceCents / 100).toFixed(2) : "0"
                    }
                    min="0.01"
                    step="0.01"
                    required
                  />
                </label>
                <label>
                  Mode
                  <select className="field" name="method">
                    <option>Espèces</option>
                    <option>Virement</option>
                    <option>Chèque</option>
                    <option>Mobile money</option>
                    <option>Autre</option>
                  </select>
                </label>
              </div>
              <div className="form-grid">
                <label>
                  Date du paiement
                  <input
                    className="field"
                    name="paidAt"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </label>
                <label>
                  Référence externe
                  <input
                    className="field"
                    name="reference"
                    placeholder="Chèque, virement, transaction…"
                  />
                </label>
              </div>
              <label>
                Note
                <textarea
                  className="field"
                  name="note"
                  placeholder="Précision sur l’encaissement…"
                />
              </label>
              <div className="info-box">
                <Wallet size={20} />
                <p>
                  Le reçu est généré dans la base dès validation. Aucun transfert bancaire n’est
                  déclenché.
                </p>
              </div>
              <button className="btn dark full" type="submit" disabled={saving}>
                {saving ? "Enregistrement…" : "Confirmer et créer le reçu"}{" "}
                <Check size={16} />
              </button>
            </>
          )}
        </form>
      );
    }
    if (kind === "invoice")
      return (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const amountCents = Math.round(Number(form.get("amount")) * 100);
            if (!Number.isFinite(amountCents) || amountCents <= 0) {
              notify("Saisissez un montant valide.");
              return;
            }
            setSaving(true);
            try {
              await createFinanceInvoice({
                studentId: String(form.get("studentId") ?? ""),
                label: String(form.get("label") ?? ""),
                amountCents,
                dueDate: String(form.get("dueDate") ?? ""),
                note: String(form.get("note") ?? ""),
              });
              setModal(null);
              notify("Frais créé et échéance enregistrée.");
            } catch (error) {
              notify(error instanceof Error ? error.message : "Création impossible.");
            } finally {
              setSaving(false);
            }
          }}
        >
          {!financeSnapshot?.students.length ? (
            <div className="info-box">
              <AlertCircle size={20} />
              <p>Créez ou inscrivez d’abord un élève dans une classe.</p>
            </div>
          ) : (
            <>
              <label>
                Élève
                <select
                  className="field"
                  name="studentId"
                  defaultValue={financeSnapshot.students[0].id}
                >
                  {financeSnapshot.students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.lastName} {student.firstName}
                      {student.className ? ` · ${student.className}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Libellé des frais
                <input
                  className="field"
                  name="label"
                  required
                  minLength={2}
                  placeholder="Scolarité · Novembre, inscription, transport…"
                />
              </label>
              <div className="form-grid">
                <label>
                  Montant (€)
                  <input
                    className="field"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    defaultValue="120.00"
                  />
                </label>
                <label>
                  Échéance
                  <input
                    className="field"
                    name="dueDate"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </label>
              </div>
              <label>
                Note
                <textarea
                  className="field"
                  name="note"
                  placeholder="Échéancier, remise ou précision…"
                />
              </label>
              <div className="modal-buttons">
                <button className="btn secondary" type="button" onClick={() => setModal(null)}>
                  Annuler
                </button>
                <button className="btn dark" type="submit" disabled={saving}>
                  {saving ? "Création…" : "Créer les frais"}
                </button>
              </div>
            </>
          )}
        </form>
      );
    if (kind === "cash-close") {
      const today = new Date().toISOString().slice(0, 10);
      const alreadyClosed = (financeSnapshot?.closures ?? []).some(
        (closure) => closure.date === today,
      );
      return (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setSaving(true);
            try {
              const result = await closeCashRegister(
                String(form.get("date") ?? today),
                String(form.get("note") ?? ""),
              );
              setModal(null);
              notify(
                `Caisse clôturée : ${formatMoney(result.totalCents)} · ${result.paymentCount} reçu(s).`,
              );
            } catch (error) {
              notify(error instanceof Error ? error.message : "Clôture impossible.");
            } finally {
              setSaving(false);
            }
          }}
        >
          {alreadyClosed ? (
            <div className="info-box">
              <CheckCircle2 size={20} />
              <p>La caisse d’aujourd’hui est déjà clôturée.</p>
            </div>
          ) : (
            <>
              <label>
                Date de caisse
                <input
                  className="field"
                  name="date"
                  type="date"
                  defaultValue={today}
                  required
                />
              </label>
              <label>
                Note de clôture
                <textarea
                  className="field"
                  name="note"
                  placeholder="Écart éventuel, observations…"
                />
              </label>
              <div className="info-box">
                <Wallet size={20} />
                <p>
                  La clôture agrège les paiements validés de la date choisie. Elle ne peut être
                  enregistrée qu’une fois par jour.
                </p>
              </div>
              <div className="modal-buttons">
                <button className="btn secondary" type="button" onClick={() => setModal(null)}>
                  Annuler
                </button>
                <button className="btn dark" type="submit" disabled={saving}>
                  {saving ? "Clôture…" : "Clôturer la caisse"}
                </button>
              </div>
            </>
          )}
        </form>
      );
    }
    if (kind === "message")
      return (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const audience = String(form.get("audience") ?? "Tous");
            setSaving(true);
            try {
              await createAnnouncement({
                title: String(form.get("title") ?? ""),
                body: String(form.get("body") ?? ""),
                audience,
                classId: audience === "Classe" ? String(form.get("classId") ?? "") : "",
              });
              setModal(null);
              notify("Annonce enregistrée en brouillon.");
            } catch (error) {
              notify(error instanceof Error ? error.message : "Création impossible.");
            } finally {
              setSaving(false);
            }
          }}
        >
          <label>
            Titre de l’annonce
            <input className="field" name="title" required minLength={3} />
          </label>
          <div className="form-grid">
            <label>
              Destinataires
              <select className="field" name="audience" defaultValue="Tous">
                <option>Tous</option>
                <option>Parents</option>
                <option>Élèves</option>
                <option>Enseignants</option>
                <option>Personnel</option>
                <option>Classe</option>
              </select>
            </label>
            <label>
              Classe (si destinataires « Classe »)
              <select className="field" name="classId" defaultValue="">
                <option value="">—</option>
                {(communicationSnapshot?.classes ?? []).map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Message
            <textarea
              aria-label="Message de l’annonce"
              className="field"
              name="body"
              required
              minLength={3}
              rows={5}
              placeholder="Rédigez votre annonce…"
            />
          </label>
          <div className="info-box">
            <Mail size={20} />
            <p>
              L’annonce reste en brouillon jusqu’à sa publication. Aucun e-mail ni SMS n’est
              envoyé automatiquement.
            </p>
          </div>
          <button className="btn dark full" type="submit" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer le brouillon"}
          </button>
        </form>
      );
    if (kind === "publish-message")
      return (
        <>
          <p>
            Publier « {modal.name} » ? L’annonce deviendra visible par les destinataires
            autorisés.
          </p>
          <button
            className="btn dark full"
            disabled={saving || !modal.row?.sub}
            onClick={async () => {
              if (!modal.row?.sub) return;
              setSaving(true);
              try {
                await publishAnnouncement(modal.row.sub);
                setModal(null);
                notify("Annonce publiée.");
              } catch (error) {
                notify(error instanceof Error ? error.message : "Publication impossible.");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Publication…" : "Confirmer la publication"}
          </button>
        </>
      );
    if (kind === "read-message") {
      const row = modal.row;
      return (
        <>
          <Badge>
            {row?.fields[1]}
            {row?.fields[2] ? ` · ${row.fields[2]}` : ""}
          </Badge>
          <p className="reading-text">{row?.fields[0]}</p>
          <small className="muted">
            {new Date(row?.fields[4] || Date.now()).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            {row?.fields[3] ? ` · ${row.fields[3]}` : ""}
          </small>
        </>
      );
    }
    if (kind === "reset")
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setModal(null);
            notify("Réinitialisation simulée. Aucun e-mail envoyé.");
          }}
        >
          <p className="muted">
            Utilisez une adresse fictive. Aucun service d’authentification n’est connecté.
          </p>
          <FormField label="Adresse e-mail fictive" type="email" />
          <button className="btn dark full">Simuler la demande</button>
        </form>
      );
    if (kind === "student") {
      const editing = modal.row ? getStudent(modal.row.sub) : undefined;
      const guardian = editing?.guardianDetails?.[0];
      return (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (saving) return;
            const f = new FormData(e.currentTarget);
            const text = (key: string) => String(f.get(key) ?? "");
            const files: { kind: string; file: File }[] = [];
            for (const [key, kind] of [
              ["photo", "photo"],
              ["birthCertificate", "birth_certificate"],
              ["transferCertificate", "transfer_certificate"],
            ] as const) {
              const value = f.get(key);
              if (value instanceof File && value.size > 0) files.push({ kind, file: value });
            }
            try {
              setSaving(true);
              const values = {
                firstName: text("firstName"),
                lastName: text("lastName"),
                birthDate: text("birthDate"),
                sex: text("sex"),
                address: text("address"),
                phone: text("phone"),
                className: text("className"),
                schoolYear: text("schoolYear"),
                enrolledAt: text("enrolledAt"),
                guardianName: text("guardianName"),
                guardianPhone: text("guardianPhone"),
                guardianEmail: text("guardianEmail"),
                guardianRelation: text("guardianRelation"),
                guardianAddress: text("guardianAddress"),
                photo: files.find((x) => x.kind === "photo")?.file.name ?? editing?.photo ?? "",
                birthCertificate:
                  files.find((x) => x.kind === "birth_certificate")?.file.name ??
                  editing?.birthCertificate ??
                  "",
                transferCertificate:
                  files.find((x) => x.kind === "transfer_certificate")?.file.name ??
                  editing?.transferCertificate ??
                  "",
                status: text("status"),
              };
              const result = editing
                ? await updateStudent({ ...values, id: editing.id })
                : await saveStudent(values);
              const studentId = result.id;
              for (const upload of files) {
                await uploadDocument(studentId, upload.kind, upload.file);
              }
              setModal(null);
              notify(
                editing
                  ? "Dossier élève mis à jour."
                  : "Élève inscrit. Le matricule a été généré automatiquement.",
              );
            } catch (error) {
              notify(
                error instanceof Error ? error.message : "Enregistrement de l’élève impossible.",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <p className="muted">
            Les champs marqués d’un astérisque sont obligatoires. L’établissement et l’année
            scolaire sont repris de votre espace connecté.
          </p>

          <h3 className="form-section-title">A. Informations de l’élève</h3>
          <div className="form-grid">
            <FormField label="Nom *" name="lastName" value={editing?.name.split(" ").slice(-1)[0]} />
            <FormField label="Prénom *" name="firstName" value={editing?.name.split(" ")[0]} />
            <FormField
              label="Date de naissance"
              name="birthDate"
              type="date"
              value={editing?.birthDate}
            />
            <label>
              Sexe
              <select name="sex" className="field" defaultValue={editing?.sex ?? ""}>
                <option value="">Non renseigné</option>
                <option value="Féminin">Féminin</option>
                <option value="Masculin">Masculin</option>
              </select>
            </label>
            <label>
              Adresse
              <input
                className="field"
                name="address"
                type="text"
                placeholder="Adresse complète"
                defaultValue={editing?.address ?? ""}
              />
            </label>
            <label>
              Téléphone (si disponible)
              <input
                className="field"
                name="phone"
                type="tel"
                placeholder="+261 …"
                defaultValue={editing?.phone ?? ""}
              />
            </label>
          </div>

          <h3 className="form-section-title">B. Informations scolaires</h3>
          <div className="form-grid">
            <label>
              Matricule
              <input
                className="field"
                type="text"
                value={editing?.reference ?? "Généré automatiquement"}
                readOnly
                aria-label="Matricule"
              />
            </label>
            <label>
              Classe
              <select
                name="className"
                className="field"
                defaultValue={editing?.className || classOptions[0] || "4e A"}
              >
                {(classOptions.length
                  ? classOptions
                  : ["6e A", "6e B", "5e B", "4e A", "3e A", "3e B", "Terminale A"]
                ).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Année scolaire
              <input
                className="field"
                name="schoolYear"
                type="text"
                defaultValue={editing?.schoolYear || year}
              />
            </label>
            <label>
              Date d’inscription
              <input
                className="field"
                name="enrolledAt"
                type="date"
                defaultValue={editing?.enrolledAt || new Date().toISOString().slice(0, 10)}
              />
            </label>
            <label>
              Établissement
              <input className="field" type="text" value={school} readOnly />
            </label>
            <label>
              Statut
              <select
                name="status"
                className="field"
                defaultValue={editing?.status ?? STUDENT_STATUSES[0]}
              >
                {STUDENT_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <h3 className="form-section-title">C. Responsable légal</h3>
          <div className="form-grid">
            <FormField
              label="Nom et prénom *"
              name="guardianName"
              value={guardian?.name ?? editing?.guardians[0]}
            />
            <label>
              Téléphone
              <input
                className="field"
                name="guardianPhone"
                type="tel"
                placeholder="+261 …"
                defaultValue={guardian?.phone ?? ""}
              />
            </label>
            <label>
              Email (facultatif)
              <input
                className="field"
                name="guardianEmail"
                type="email"
                defaultValue={guardian?.email ?? ""}
              />
            </label>
            <label>
              Lien avec l’élève
              <select
                name="guardianRelation"
                className="field"
                defaultValue={guardian?.relation ?? "Père"}
              >
                <option>Père</option>
                <option>Mère</option>
                <option>Tuteur</option>
              </select>
            </label>
            <label>
              Adresse (facultatif)
              <input
                className="field"
                name="guardianAddress"
                type="text"
                defaultValue={guardian?.address ?? ""}
              />
            </label>
          </div>

          <h3 className="form-section-title">D. Documents</h3>
          <div className="form-grid">
            <label>
              Photo de l’élève (facultatif)
              <input className="field" name="photo" type="file" accept="image/*" />
            </label>
            <label>
              Acte de naissance (facultatif)
              <input className="field" name="birthCertificate" type="file" />
            </label>
            <label>
              Certificat de transfert (si nécessaire)
              <input className="field" name="transferCertificate" type="file" />
            </label>
          </div>
          {editing?.documents?.length ? (
            <p className="muted">
              {editing.documents.length} pièce(s) déjà importée(s). Les nouveaux fichiers
              s’ajoutent au dossier.
            </p>
          ) : null}

          <div className="modal-buttons">
            <button type="button" className="btn secondary" onClick={() => setModal(null)}>
              Annuler
            </button>
            <button className="btn dark" type="submit" disabled={saving}>
              {saving
                ? "Enregistrement…"
                : editing
                  ? "Enregistrer"
                  : "Inscrire l’élève"}{" "}
              <Check size={16} />
            </button>
          </div>
        </form>
      );
    }
    if (kind === "evaluation")
      return (
        <form
          className="settings-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const classId = String(form.get("classId") ?? "");
            const subjectId = String(form.get("subjectId") ?? "");
            const name = String(form.get("name") ?? "").trim();
            if (!classId || !subjectId || !name) {
              notify("Classe, matière et intitulé sont obligatoires.");
              return;
            }
            setSaving(true);
            try {
              const result = await createEvaluationRecord({
                classId,
                subjectId,
                periodId: String(form.get("periodId") ?? "") || undefined,
                name,
                coefficient: Number(form.get("coefficient") ?? 1) || 1,
                maxScore: Number(form.get("maxScore") ?? 20) || 20,
                date: String(form.get("date") ?? ""),
              });
              setSelectedEvaluationId(result.id);
              notify("Évaluation créée.");
              setModal(null);
            } catch (error) {
              notify(error instanceof Error ? error.message : "Création impossible.");
            } finally {
              setSaving(false);
            }
          }}
        >
          {!classList.length || !subjects.length ? (
            <div className="info-box">
              <AlertCircle size={20} />
              <p>
                Créez au moins une classe et une matière dans les référentiels avant de saisir une
                évaluation.
              </p>
            </div>
          ) : (
            <>
              <div className="form-grid">
                <label>
                  Classe
                  <select className="field" name="classId" required defaultValue={classList[0].id}>
                    {classList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Matière
                  <select className="field" name="subjectId" required defaultValue={subjects[0].id}>
                    {subjects.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Période
                <select className="field" name="periodId" defaultValue={periods[0]?.id ?? ""}>
                  <option value="">Hors période</option>
                  {periods.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label>
                  Intitulé
                  <input
                    className="field"
                    name="name"
                    required
                    placeholder="Ex. Équations du premier degré"
                  />
                </label>
                <label>
                  Date
                  <input
                    className="field"
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </label>
              </div>
              <div className="form-grid">
                <label>
                  Coefficient
                  <input
                    className="field"
                    type="number"
                    name="coefficient"
                    min="1"
                    max="10"
                    defaultValue="1"
                  />
                </label>
                <label>
                  Barème
                  <input
                    className="field"
                    type="number"
                    name="maxScore"
                    min="1"
                    max="100"
                    defaultValue="20"
                  />
                </label>
              </div>
              <div className="modal-buttons">
                <button
                  className="btn secondary"
                  type="button"
                  onClick={() => setModal(null)}
                >
                  Annuler
                </button>
                <button className="btn dark" type="submit" disabled={saving}>
                  {saving ? "Création…" : "Créer l’évaluation"} <Check size={16} />
                </button>
              </div>
            </>
          )}
        </form>
      );
    if (kind === "generic" && module) {
      const currentProgramDoc = programDocuments.find((d) => d.subjectId === modal.row?.id);
      return (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            if (isScolariteModule(current) || isReferentielModule(current)) {
              const values: Record<string, string> = {
                name: String(f.get("name") ?? ""),
                status: String(f.get("status") ?? "Actif"),
                sub: modal.row?.sub ?? "",
              };
              if (current === "teachers") {
                values.type = String(f.get("type") ?? "");
                values.email = String(f.get("email") ?? "");
              }
              module.columns.slice(1, -1).forEach((_, i) => {
                values["field" + i] = String(f.get("field" + i) ?? "");
              });
              const programFile = f.get("programFile");
              try {
                let programImported = false;
                if (isReferentielModule(current)) {
                  const result = modal.row?.id
                    ? await updateReferentiel(current, modal.row.id, values)
                    : await saveReferentielRow(current, values);
                  if (
                    current === "subjects" &&
                    programFile instanceof File &&
                    programFile.size > 0
                  ) {
                    const subjectId = modal.row?.id ?? result.id;
                    await uploadProgram(subjectId, programFile);
                    programImported = true;
                  }
                } else if (modal.row?.id) {
                  await updateScolarite(current, modal.row.id, values);
                } else {
                  await saveScolariteRow(current, values);
                }
                setModal(null);
                notify(
                  programImported
                    ? "Programme importé dans la base de l’établissement."
                    : "Fiche enregistrée dans la base de l’établissement.",
                );
              } catch (error) {
                notify(error instanceof Error ? error.message : "Enregistrement impossible.");
              }
              return;
            }
            const r: DemoRow = {
              name: String(f.get("name")),
              sub: modal.row?.sub || "DEMO-" + Date.now(),
              fields: module.columns.slice(1, -1).map((_, i) => String(f.get("field" + i))),
              status: String(f.get("status")),
            };
            setCustomRows({
              ...customRows,
              [current]: modal.row
                ? allRows.map((x) => (x.sub === r.sub ? r : x))
                : [r, ...allRows],
            });
            setModal(null);
            notify(
              modal.row
                ? "Fiche mise à jour localement."
                : "Nouvelle fiche ajoutée à la démonstration.",
            );
          }}
        >
          <p className="muted">
            {isScolariteModule(current) || isReferentielModule(current)
              ? "Les champs sont enregistrés dans la base de votre établissement."
              : "Saisie de démonstration : utilisez uniquement des données fictives."}
          </p>
          <FormField label={module.columns[0]} name="name" value={modal.row?.name} />
          {module.columns.slice(1, -1).map((c, i) =>
            current === "students" && i === 0 ? (
              <label key={c}>
                {c}
                <select
                  name={"field" + i}
                  className="field"
                  defaultValue={modal.row?.fields[i] || "4e A"}
                >
                  {(classOptions.length
                    ? classOptions
                    : ["6e A", "6e B", "5e B", "4e A", "3e A", "3e B", "Terminale A"]
                  ).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            ) : current === "subjects" && c === "Programme" ? (
              <label key={c}>
                Programme (fichier · 5 Mo max.)
                <input
                  aria-label="Programme (fichier)"
                  className="field"
                  type="file"
                  name="programFile"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                  onChange={(event) => {
                    const hidden = event.currentTarget.form?.elements.namedItem(
                      "field1",
                    ) as HTMLInputElement | null;
                    if (hidden) hidden.value = event.currentTarget.files?.[0]?.name ?? "";
                  }}
                />
                <input type="hidden" name="field1" value={modal.row?.fields[1] ?? ""} />
                {currentProgramDoc && (
                  <span className="muted">
                    Fichier actuel : <b>{currentProgramDoc.fileName}</b> ·{" "}
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => void downloadProgram(currentProgramDoc.id)}
                    >
                      Télécharger
                    </button>
                    {canManage && (
                      <>
                        {" · "}
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => {
                            void deleteProgram(currentProgramDoc.id)
                              .then(() => notify("Programme retiré."))
                              .catch((error: unknown) =>
                                notify(
                                  error instanceof Error
                                    ? error.message
                                    : "Suppression impossible.",
                                ),
                              );
                          }}
                        >
                          Retirer
                        </button>
                      </>
                    )}
                  </span>
                )}
              </label>
            ) : (
              <FormField
                key={c}
                label={c}
                name={"field" + i}
                value={
                  (current === "teachers" && i === 2
                    ? (modal.row?.fields[i] ?? "").replace(/[^\d]/g, "")
                    : modal.row?.fields[i]) ||
                  (current === "students" && i === 2 ? "11/11/2026" : "")
                }
              />
            ),
          )}
          {current === "teachers" && (
            <>
              <label>
                Type de collaborateur
                <select
                  className="field"
                  name="type"
                  defaultValue={modalStaff?.type ?? "Enseignant"}
                >
                  {[
                    ...new Set([
                      modalStaff?.type ?? "Enseignant",
                      "Enseignant",
                      "Personnel administratif",
                      "Surveillant",
                      "Comptable",
                      "Autre",
                    ]),
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                E-mail
                <input
                  className="field"
                  type="email"
                  name="email"
                  defaultValue={modalStaff?.email ?? ""}
                  placeholder="prenom.nom@etablissement.fr"
                />
              </label>
            </>
          )}
          <label>
            Statut
            <select
              name="status"
              className="field"
              defaultValue={modal.row?.status || module.rows[0].status}
            >
              {(current === "students"
                ? [...STUDENT_STATUSES]
                : [
                    ...new Set([
                      module.rows[0].status,
                      "Actif",
                      "En attente",
                      "Brouillon",
                      "Validé",
                      "Dossier incomplet",
                    ]),
                  ]
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="modal-buttons">
            <button type="button" className="btn secondary" onClick={() => setModal(null)}>
              Annuler
            </button>
            <button className="btn dark" type="submit">
              {modal.row ? "Enregistrer" : "Créer la fiche"} <Check size={16} />
            </button>
          </div>
        </form>
      );
    }
    return null;
  }
}
