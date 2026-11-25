import {
  GraduationCap,
  Users,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Wallet,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  Bell,
  Download,
  MoreHorizontal,
  Check,
  Clock,
  ShieldCheck,
  Sparkles,
  Printer,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  LockKeyhole,
  Paperclip,
} from "lucide-react";
import { formatMoney } from "../lib/finance";
import { isReferentielModule, isScolariteModule } from "../lib/scolarite";
import { exportAttendanceCsv, exportDisciplineCsv } from "../lib/exports";
import {
  title,
  Avatar,
  Badge,
  Panel,
  Stat,
  downloadCsv,
  downloadCsvContent,
  PageHead,
  Empty,
  SchoolArt,
} from "../components/scolia-ui";

import type { ScoliaState } from "../hooks/use-scolia-state";
export function buildPrimaryViews(ctx: ScoliaState) {
  const {
    current,
    profile,
    school,
    year,
    search,
    setSearch,
    setModal,
    setDetail,
    setDetailTab,
    filter,
    setFilter,
    checked,
    setChecked,
    notes,
    setNotes,
    gradeStage,
    setGradeStage,
    reportStage,
    evaluations,
    grades: gradeRows,
    reportCards,
    periods,
    subjects,
    selectedEvaluationId,
    setSelectedEvaluationId,
    reportPeriodId,
    setReportPeriodId,
    reportClassId,
    setReportClassId,
    pedagogieLoading,
    pedagogieError,
    createEvaluationRecord,
    saveEvaluationGrades,
    validateEvaluationRecord,
    generateReports,
    validateReports,
    publishReports,
    classList,
    studentsData,
    scheduleStage,
    week,
    setWeek,
    scheduleView,
    setScheduleView,
    scheduleSlots,
    scheduleEntries,
    scheduleConflicts,
    scheduleSubjects,
    scheduleStaff,
    scheduleRooms,
    scheduleClasses,
    scheduleStats,
    scheduleClassId,
    setScheduleClassId,
    planningLoading,
    planningError,
    createScheduleSlot,
    createScheduleEntry,
    removeScheduleEntry,
    generateSchedule,
    validateSchedulePlan,
    publishSchedulePlan,
    attendanceSnapshot,
    attendanceLoading,
    attendanceError,
    attendanceClassId,
    setAttendanceClassId,
    attendanceDate,
    setAttendanceDate,
    attendanceDraft,
    setAttendanceDraft,
    saveAttendanceSheet,
    disciplineSnapshot,
    disciplineLoading,
    disciplineError,
    createDisciplineIncident,
    updateDisciplineIncident,
    attend,
    setAttend,
    financeSnapshot,
    communicationSnapshot,
    lessonsSnapshot,
    notificationsSnapshot,
    session,
    notify,
    go,
    isFamily,
    isPlatform,
    module,
    allRows,
    filtered,
    exportModule,
    moduleButton,
    canManage,
    programDocuments,
    downloadProgram,
  } = ctx;
  function dashboard() {
    const platform = isPlatform;
    const firstName = session?.user.name?.trim().split(/\s+/)[0] || "vous";
    const activeStudents = studentsData.filter(
      (s) => !["Archivé", "Transféré", "Sorti", "Désinscrit"].includes(s.status),
    );
    const pendingEvaluations = evaluations.filter((e) => e.status !== "Validé");
    const draftReports = reportCards.filter((r) => r.status !== "Publié");
    const publishedReports = reportCards.filter((r) => r.status === "Publié");
    const openIncidents = disciplineSnapshot?.stats?.open ?? 0;
    const publishedAnnouncements = (communicationSnapshot?.announcements ?? []).filter(
      (a) => a.status === "Publié",
    );
    const recentLessons = (lessonsSnapshot?.lessons ?? []).slice(0, 3);
    const unread = notificationsSnapshot?.unreadCount ?? 0;
    const finance = financeSnapshot?.stats;
    const attendanceStats = attendanceSnapshot?.stats;

    const statCards = platform
      ? [
          {
            label: "Établissements",
            value: "—",
            delta: "Espace éditeur",
            icon: undefined,
            color: undefined,
          },
          {
            label: "Notifications",
            value: String(unread),
            delta: unread ? "À consulter" : "À jour",
            icon: Bell,
            color: "violet" as const,
          },
        ]
      : [
          {
            label: "Élèves actifs",
            value: String(activeStudents.length),
            delta: `${studentsData.length} dossiers au total`,
            icon: Users,
            color: undefined,
          },
          {
            label: "Classes",
            value: String(classList.length),
            delta: `${evaluations.length} évaluation(s)`,
            icon: GraduationCap,
            color: "violet" as const,
          },
          {
            label: "Encaissements",
            value: finance ? formatMoney(finance.collected) : "—",
            delta: finance
              ? `Reste ${formatMoney(finance.outstanding)}`
              : "Module finance",
            icon: Wallet,
            color: "amber" as const,
          },
          {
            label: "Présence (classe)",
            value: attendanceStats ? String(attendanceStats.present) : "—",
            delta: attendanceStats
              ? `${attendanceStats.absent} absent(s) · ${attendanceStats.late} retard(s)`
              : "Sélectionnez une classe",
            icon: ClipboardCheck,
            color: undefined,
          },
        ];

    const attentionItems = platform
      ? [
          {
            icon: ShieldCheck,
            tone: "violet",
            title: "Pilotage de la plateforme",
            text: "Les indicateurs globaux multi-établissements ne sont pas encore consolidés.",
            action: () => go("tenants"),
            cta: "Voir les établissements",
          },
        ]
      : [
          {
            icon: ClipboardCheck,
            tone: "violet",
            title: `${pendingEvaluations.length} évaluation(s) à finaliser`,
            text:
              pendingEvaluations.length > 0
                ? "Des évaluations restent en brouillon ou non validées."
                : "Toutes les évaluations saisies sont validées.",
            action: () => go("grades"),
            cta: "Voir les évaluations",
          },
          {
            icon: FileText,
            tone: "amber",
            title: `${draftReports.length} bulletin(s) non publiés`,
            text:
              publishedReports.length > 0
                ? `${publishedReports.length} bulletin(s) déjà publiés.`
                : "Aucun bulletin publié pour le moment.",
            action: () => go("reports"),
            cta: "Voir les bulletins",
          },
          {
            icon: AlertCircle,
            tone: "green",
            title:
              openIncidents > 0
                ? `${openIncidents} suivi(s) éducatif(s) ouvert(s)`
                : "Aucun suivi éducatif ouvert",
            text:
              openIncidents > 0
                ? "Des incidents ou observations nécessitent un suivi."
                : "La vie scolaire ne signale pas d’incident ouvert.",
            action: () => go("discipline"),
            cta: "Voir la vie scolaire",
          },
        ];

    const recentItems =
      attendanceSnapshot?.recent && attendanceSnapshot.recent.length > 0
        ? attendanceSnapshot.recent.slice(0, 4).map((r) => ({
            init: r.className.slice(0, 2).toUpperCase(),
            name: r.className,
            verb: `appel ${r.status.toLowerCase()} du ${r.date}`,
            time: r.takenByName ? `Par ${r.takenByName}` : "Vie scolaire",
          }))
        : recentLessons.length > 0
          ? recentLessons.map((l) => ({
              init: l.className.slice(0, 2).toUpperCase(),
              name: l.title,
              verb: `${l.status.toLowerCase()}${l.className ? ` · ${l.className}` : ""}`,
              time: l.date || "Cahier de textes",
            }))
          : [
              {
                init: "SC",
                name: "Scolia",
                verb: "aucune activité récente disponible",
                time: "Les appels et séances apparaîtront ici",
              },
            ];

    const nextAnnouncements = (communicationSnapshot?.announcements ?? [])
      .filter((a) => a.status === "Publié")
      .slice(0, 2);

    return (
      <>
        <div className="greeting">
          <div>
            <div className="eyebrow">
              {platform
                ? "PILOTAGE DE LA PLATEFORME"
                : profile === "Enseignant"
                  ? "VOTRE JOURNÉE, EN UN REGARD"
                  : "CHAQUE JOUR, FAIRE GRANDIR"}
            </div>
            <h1>
              Bonjour, {firstName}
              <span className="greeting-dot">.</span>
            </h1>
            <p>
              {platform
                ? "Vos établissements, vos équipes, une vision partagée."
                : "Voici les indicateurs réels de votre établissement."}
            </p>
          </div>
          <button className="btn secondary" onClick={() => go("documents")}>
            <Download size={16} /> Documents
          </button>
        </div>

        <div className="stats-row">
          {statCards.map((s) => (
            <Stat
              key={s.label}
              label={s.label}
              value={s.value}
              delta={s.delta}
              icon={s.icon}
              color={s.color}
            />
          ))}
        </div>

        <div className="dashboard-grid">
          <Panel title={platform ? "Vue d’ensemble" : "Indicateurs de l’établissement"}>
            <div className="chart-summary">
              <div>
                <b>{activeStudents.length}</b>
                <span>élèves actifs sur {studentsData.length}</span>
              </div>
              <div>
                <b>{classList.length}</b>
                <span>classes configurées</span>
              </div>
              <div>
                <b>{publishedReports.length}</b>
                <span>bulletins publiés</span>
              </div>
              <div>
                <b>{publishedAnnouncements.length}</b>
                <span>annonces publiées</span>
              </div>
              <div>
                <b>{lessonsSnapshot?.lessons.length ?? 0}</b>
                <span>séances au cahier de textes</span>
              </div>
              <div>
                <b>{unread}</b>
                <span>notification(s) non lue(s)</span>
              </div>
            </div>
            {finance ? (
              <p className="muted" style={{ marginTop: 12 }}>
                Finance : {formatMoney(finance.collected)} encaissés ·{" "}
                {formatMoney(finance.outstanding)} en attente · {finance.receiptCount} reçu(s).
              </p>
            ) : null}
          </Panel>

          <Panel title="À votre attention" extra={<span className="count">{attentionItems.length}</span>} className="attention">
            {attentionItems.map((item) => (
              <div className="attention-item" key={item.title}>
                <span className={`attention-icon ${item.tone}`}>
                  <item.icon size={19} />
                </span>
                <div>
                  <b>{item.title}</b>
                  <p>{item.text}</p>
                  <button className="text-link" onClick={item.action}>
                    {item.cta} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </Panel>

          <Panel
            title="Activité récente"
            extra={
              <button className="text-link muted" onClick={() => go("audit")}>
                Tout voir <ArrowUpRight size={14} />
              </button>
            }
          >
            <div className="activity-list">
              {recentItems.map((item, index) => (
                <div className="activity" key={`${item.init}-${index}`}>
                  <Avatar name={item.name} />
                  <div>
                    <p>
                      <b>{item.name}</b> {item.verb}.
                    </p>
                    <small>{item.time}</small>
                  </div>
                  <CheckCircle2 size={16} className="muted" />
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Annonces publiées"
            extra={
              <button className="text-link muted" onClick={() => go("messages")}>
                <ArrowUpRight size={17} />
              </button>
            }
          >
            {nextAnnouncements.length === 0 ? (
              <p className="muted">Aucune annonce publiée pour le moment.</p>
            ) : (
              nextAnnouncements.map((a) => (
                <div className="event" key={a.id}>
                  <div className="date-tile">
                    <small>{a.audience.slice(0, 3).toUpperCase()}</small>
                    <b>•</b>
                  </div>
                  <div>
                    <b>{a.title}</b>
                    <small>{a.body.slice(0, 90)}{a.body.length > 90 ? "…" : ""}</small>
                    <span className="event-tag">{a.audience}</span>
                  </div>
                </div>
              ))
            )}
          </Panel>
        </div>
      </>
    );
  }

  function tableScreen() {
    return (
      <>
        <PageHead
          title={title(current)}
          subtitle={module!.description}
          action={
            (isScolariteModule(current) || isReferentielModule(current)) && !canManage ? undefined : (
              <button className="btn dark" onClick={moduleButton}>
                <Plus size={16} />
                {module!.action}
              </button>
            )
          }
        />
        <div className="summary-strip">
          <span>
            <b>{allRows.length}</b>{" "}
            {current === "students" ? "dossiers élèves" : "éléments affichés"}
          </span>
          <span>
            <i className="green-dot" />
            {
              allRows.filter(
                (r) => r.status === "Actif" || r.status === "Validé" || r.status === "Payé",
              ).length
            }{" "}
            actifs ou validés
          </span>
          <span>
            <Clock size={14} /> Données locales · {year}
          </span>
        </div>
        <Panel>
          <div className="table-toolbar">
            <div className="tabs">
              <button
                className={filter === "Tous" ? "active" : ""}
                onClick={() => setFilter("Tous")}
              >
                Tous <span>{allRows.length}</span>
              </button>
              {[...new Set(allRows.map((r) => r.status))].slice(0, 3).map((s) => (
                <button
                  key={s}
                  className={filter === s ? "active" : ""}
                  onClick={() => setFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="toolbar-actions">
              <select
                className="field compact"
                aria-label="Filtrer par classe ou catégorie"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="Tous">Tous les filtres</option>
                {[
                  ...new Set([...allRows.map((r) => r.status), ...allRows.map((r) => r.fields[0])]),
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <button className="icon-btn" aria-label="Exporter la liste" onClick={exportModule}>
                <Download size={18} />
              </button>
            </div>
          </div>
          <div className="table-search">
            <Search size={16} />
            <input
              aria-label="Rechercher dans la liste"
              placeholder={
                "Rechercher " +
                (current === "students" ? "un élève, un matricule…" : "dans cette liste…")
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {checked.length > 0 && (
              <button
                className="text-link"
                onClick={() => {
                  downloadCsv(
                    "selection",
                    module!.columns,
                    filtered
                      .filter((r) => checked.includes(r.sub))
                      .map((r) => [r.name, ...r.fields, r.status]),
                  );
                  notify("Sélection exportée.");
                }}
              >
                Exporter la sélection ({checked.length})
              </button>
            )}
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Tout sélectionner"
                      checked={
                        filtered.length > 0 && filtered.every((r) => checked.includes(r.sub))
                      }
                      onChange={(e) =>
                        setChecked(e.target.checked ? filtered.map((r) => r.sub) : [])
                      }
                    />
                  </th>
                  {module!.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.sub + i}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={"Sélectionner " + r.name}
                        checked={checked.includes(r.sub)}
                        onChange={(e) =>
                          setChecked(
                            e.target.checked
                              ? [...checked, r.sub]
                              : checked.filter((x) => x !== r.sub),
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="name-cell"
                        onClick={() => {
                          setDetail(r);
                          setDetailTab("Informations");
                        }}
                      >
                        <Avatar name={r.name} />
                        <span>
                          <b>{r.name}</b>
                          <small>{r.sub}</small>
                        </span>
                      </button>
                    </td>
                    {r.fields.map((f, j) => (
                      <td key={j}>
                        {j === 1 && current === "subjects" ? (
                          <span>
                            {f}{" "}
                            {programDocuments.find((d) => d.subjectId === r.id) && (
                              <button
                                type="button"
                                className="icon-btn"
                                aria-label={"Télécharger le programme de " + r.name}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  const doc = programDocuments.find((d) => d.subjectId === r.id);
                                  if (doc) void downloadProgram(doc.id);
                                }}
                              >
                                <Paperclip size={14} />
                              </button>
                            )}
                          </span>
                        ) : j === 0 && current === "students" ? (
                          <span className="class-tag">{f}</span>
                        ) : (
                          f
                        )}
                      </td>
                    ))}
                    <td>
                      <Badge>{r.status}</Badge>
                    </td>
                    <td>
                      <button
                        className="icon-btn"
                        aria-label={"Ouvrir " + r.name}
                        onClick={() => {
                          setDetail(r);
                          setDetailTab("Informations");
                        }}
                      >
                        <MoreHorizontal size={19} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && (
            <Empty
              title="Aucun résultat"
              text="Essayez un autre nom ou réinitialisez vos filtres."
              action={() => {
                setSearch("");
                setFilter("Tous");
              }}
            />
          )}
          <div className="table-footer">
            <span>
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""} · données de l’établissement
            </span>
            <span className="pagination">
              <button className="icon-btn" disabled aria-label="Page précédente">
                <ChevronRight className="reverse" size={16} />
              </button>
              <b>1</b>
              <button className="icon-btn" disabled aria-label="Page suivante">
                <ChevronRight size={16} />
              </button>
            </span>
          </div>
        </Panel>
        <div className="info-line">
          <ShieldCheck size={15} />
          Les périmètres et permissions sont illustrés. Leur contrôle serveur n’est pas implémenté
          dans cette maquette.
        </div>
      </>
    );
  }

  function schedule() {
    const dayLabels = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const days = [1, 2, 3, 4, 5];
    const classOptions =
      isFamily || !canManage
        ? scheduleClasses.filter((item) =>
            scheduleEntries.some((entry) => entry.classId === item.id),
          )
        : scheduleClasses;
    const selectedClass =
      classOptions.find((item) => item.id === scheduleClassId) ?? classOptions[0];
    const classEntries = selectedClass
      ? scheduleEntries.filter((entry) => entry.classId === selectedClass.id)
      : [];
    const times = [...new Map(
      scheduleSlots.map((slot) => [`${slot.startsAt}-${slot.endsAt}`, slot]),
    ).values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const conflictCount = scheduleConflicts.length;
    const status = conflictCount
      ? "Conflits"
      : scheduleStats.draft > 0
        ? "Brouillon"
        : scheduleStats.validated > 0
          ? "Validé"
          : scheduleStats.published > 0
            ? "Publié"
            : "Vide";
    const entryColor = (subjectId: string) => {
      const index = scheduleSubjects.findIndex((subject) => subject.id === subjectId);
      return (Math.max(0, index) % 5) + 1;
    };
    const openEntry = (entry: (typeof scheduleEntries)[number]) => {
      setModal({
        kind: "lesson",
        name: entry.subjectName,
        row: {
          id: entry.id,
          name: entry.subjectName,
          sub: entry.id,
          fields: [
            entry.className,
            entry.staffName ?? "Non affecté",
            entry.roomName ?? "Sans salle",
            `${dayLabels[entry.dayOfWeek] ?? ""} ${entry.startsAt}–${entry.endsAt}`,
          ],
          status: entry.status,
        },
      });
    };

    if (isFamily) {
      return (
        <>
          <PageHead
            title="Emploi du temps"
            subtitle="Le planning publié de la classe."
            action={
              <button className="btn dark" onClick={() => window.print()}>
                <Printer size={16} /> Imprimer
              </button>
            }
          />
          <div className="planning-status">
            <span>
              <Badge>Publié</Badge>
              <small>{selectedClass?.name ?? "Aucune classe"}</small>
            </span>
            <span className="green">
              <CheckCircle2 size={15} /> Planning officiel publié
            </span>
          </div>
          <Panel className="schedule-panel">
            {times.length ? (
              <div className="schedule-grid">
                <div className="time-head">Heure</div>
                {days.map((day) => (
                  <div className="day-head" key={day}>
                    <small>{dayLabels[day]}</small>
                  </div>
                ))}
                {times.map((time) => (
                  <div className="schedule-row" key={`${time.startsAt}-${time.endsAt}`}>
                    <div className="time-label">
                      {time.startsAt}
                      <br />
                      {time.endsAt}
                    </div>
                    {days.map((day) => {
                      const slot = scheduleSlots.find(
                        (item) =>
                          item.dayOfWeek === day &&
                          item.startsAt === time.startsAt &&
                          item.endsAt === time.endsAt,
                      );
                      const entry = slot
                        ? classEntries.find((item) => item.slotId === slot.id)
                        : undefined;
                      return (
                        <div className="slot" key={day}>
                          {slot?.kind === "Pause" ? (
                            <span className="break">Pause</span>
                          ) : entry ? (
                            <div className={`lesson color-${entryColor(entry.subjectId)}`}>
                              <b>{entry.subjectName}</b>
                              <span>{entry.staffName ?? "Enseignant"}</span>
                              <small>
                                {entry.startsAt}–{entry.endsAt}
                                {entry.roomName ? ` · ${entry.roomName}` : ""}
                              </small>
                            </div>
                          ) : (
                            <span className="free">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title="Aucun planning publié"
                text="Le planning apparaîtra ici dès sa publication par l’établissement."
              />
            )}
          </Panel>
          <div className="info-line">
            <CalendarDays size={15} />
            Seuls les cours publiés sont visibles aux familles.
          </div>
        </>
      );
    }

    return (
      <>
        <PageHead
          title="Emploi du temps"
          subtitle={
            canManage
              ? "Créneaux, cours et contrôle des conflits."
              : "Votre emploi du temps et les cours publiés."
          }
          action={
            canManage ? (
              <div className="button-group">
                <button
                  className="btn secondary"
                  onClick={() => setModal({ kind: "schedule-slot", name: "Nouveau créneau" })}
                >
                  <Clock size={16} /> Nouveau créneau
                </button>
                <button
                  className="btn secondary"
                  onClick={() => setModal({ kind: "schedule-add", name: "Ajouter un cours" })}
                >
                  <Plus size={16} /> Ajouter un cours
                </button>
                <button
                  className="btn secondary"
                  onClick={() => setModal({ kind: "generate", name: "Générer une proposition" })}
                >
                  <Sparkles size={16} /> Générer
                </button>
                <button
                  className="btn dark"
                  onClick={async () => {
                    try {
                      if (scheduleStats.draft > 0) {
                        await validateSchedulePlan();
                        notify("Planning validé.");
                      } else if (scheduleStats.validated > 0) {
                        await publishSchedulePlan();
                        notify("Planning publié aux enseignants et aux familles.");
                      } else if (scheduleStats.published > 0) {
                        notify("Le planning est déjà publié.");
                      } else {
                        notify("Ajoutez des cours avant de valider le planning.");
                      }
                    } catch (error) {
                      notify(error instanceof Error ? error.message : "Action impossible.");
                    }
                  }}
                >
                  <Check size={16} />
                  {scheduleStats.draft > 0
                    ? "Valider"
                    : scheduleStats.validated > 0
                      ? "Publier"
                      : scheduleStats.published > 0
                        ? "Publié"
                        : "Valider"}
                </button>
              </div>
            ) : (
              <button className="btn dark" onClick={() => window.print()}>
                <Printer size={16} /> Imprimer
              </button>
            )
          }
        />
        <div className="schedule-tools">
          <div className="button-group">
            <b>Semaine type</b>
            <small className="muted">
              {scheduleSlots.length} créneau(x) · {scheduleStats.total} cours
            </small>
          </div>
          <select
            className="field compact"
            aria-label="Classe du planning"
            value={selectedClass?.id ?? ""}
            onChange={(event) => setScheduleClassId(event.target.value)}
          >
            {classOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        {planningError && (
          <div className="info-line">
            <AlertCircle size={15} /> {planningError}
          </div>
        )}
        <div className="planning-status">
          <span>
            <Badge>{status}</Badge>{" "}
            <small>
              {selectedClass?.name ?? "Aucune classe"} · {scheduleStats.published} publié(s) ·{" "}
              {scheduleStats.draft} brouillon(s)
            </small>
          </span>
          <span className={conflictCount ? "amber" : "green"}>
            {conflictCount ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            {conflictCount
              ? `${conflictCount} conflit(s) bloquant(s)`
              : "Aucun conflit détecté sur la version courante"}
          </span>
        </div>
        <Panel className="schedule-panel">
          {times.length ? (
            <div className="schedule-grid">
              <div className="time-head">Heure</div>
              {days.map((day) => (
                <div className="day-head" key={day}>
                  <small>{dayLabels[day]}</small>
                </div>
              ))}
              {times.map((time) => (
                <div className="schedule-row" key={`${time.startsAt}-${time.endsAt}`}>
                  <div className="time-label">
                    {time.startsAt}
                    <br />
                    {time.endsAt}
                  </div>
                  {days.map((day) => {
                    const slot = scheduleSlots.find(
                      (item) =>
                        item.dayOfWeek === day &&
                        item.startsAt === time.startsAt &&
                        item.endsAt === time.endsAt,
                    );
                    const entry = slot
                      ? classEntries.find((item) => item.slotId === slot.id)
                      : undefined;
                    return (
                      <div className="slot" key={day}>
                        {slot?.kind === "Pause" ? (
                          <span className="break">Pause</span>
                        ) : entry ? (
                          <button
                            className={`lesson color-${entryColor(entry.subjectId)}`}
                            onClick={() => openEntry(entry)}
                          >
                            <b>{entry.subjectName}</b>
                            <span>{entry.staffName ?? "Non affecté"}</span>
                            <small>
                              {entry.startsAt}–{entry.endsAt}
                              {entry.roomName ? ` · ${entry.roomName}` : ""}
                              <br />
                              {entry.status}
                            </small>
                          </button>
                        ) : (
                          <span className="free">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="Aucun créneau"
              text="Créez d’abord les créneaux horaires de la semaine."
              action={() =>
                setModal({ kind: "schedule-slot", name: "Nouveau créneau" })
              }
            />
          )}
        </Panel>
        {conflictCount > 0 && (
          <Panel title="Conflits à corriger">
            <div className="checklist">
              {scheduleConflicts.map((conflict, index) => (
                <p className="amber" key={`${conflict.kind}-${index}`}>
                  <AlertCircle size={17} />
                  <span>
                    <b>{conflict.kind}</b> · {conflict.message}
                  </span>
                </p>
              ))}
            </div>
          </Panel>
        )}
        <div className="info-line">
          <CalendarDays size={15} />
          {canManage
            ? "Les conflits de classe, d’enseignant et de salle bloquent la validation et la publication. Une nouvelle proposition peut être générée pour la classe sélectionnée."
            : "Vous consultez les cours publiés et les séances qui vous sont attribuées."}
        </div>
      </>
    );
  }

  function grades() {
    const selected = evaluations.find((e) => e.id === selectedEvaluationId) ?? evaluations[0];
    const roster = selected
      ? studentsData.filter((s) => s.classId === selected.classId && s.status !== "Archivé")
      : [];
    const gradeFor = (studentId: string) =>
      gradeRows.find((g) => g.evaluationId === selected?.id && g.studentId === studentId);
    const scored = roster
      .map((s) => gradeFor(s.id)?.score ?? null)
      .filter((score): score is number => score !== null && score !== undefined);
    const average = scored.length
      ? (scored.reduce((sum, score) => sum + (score / (selected?.maxScore || 20)) * 20, 0) /
          scored.length
        )
          .toFixed(2)
          .replace(".", ",")
      : "—";
    const best = scored.length
      ? Math.max(...scored)
          .toFixed(2)
          .replace(".", ",")
      : "—";
    const locked = !selected || selected.status !== "Brouillon";
    const readEntries = (form: HTMLFormElement) =>
      roster
        .map((student) => {
          const scoreField = form.elements.namedItem(`score-${student.id}`) as
            | HTMLInputElement
            | null;
          const commentField = form.elements.namedItem(`comment-${student.id}`) as
            | HTMLInputElement
            | null;
          const raw = scoreField?.value.trim() ?? "";
          const score = raw === "" ? null : Number(raw);
          return {
            studentId: student.id,
            score: score !== null && Number.isFinite(score) ? score : null,
            comment: commentField?.value.trim() ?? "",
          };
        });
    const persist = async (form: HTMLFormElement, validate = false) => {
      if (!selected) return;
      try {
        const entries = readEntries(form);
        if (!entries.length) {
          notify("Aucune note à enregistrer.");
          return;
        }
        await saveEvaluationGrades(selected.id, entries);
        if (validate) {
          await validateEvaluationRecord(selected.id);
          notify("Évaluation validée : les moyennes peuvent être calculées.");
        } else {
          notify("Notes enregistrées.");
        }
      } catch (error) {
        notify(error instanceof Error ? error.message : "Enregistrement impossible.");
      }
    };

    if (isFamily) {
      return (
        <>
          <PageHead
            title="Mes résultats publiés"
            subtitle="Seuls les bulletins publiés par l’établissement sont visibles."
            action={<Badge>Résultats publiés</Badge>}
          />
          <Panel title="Bulletins disponibles">
            {reportCards.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Période</th>
                      <th>Classe</th>
                      <th>Moyenne</th>
                      <th>Publication</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCards.map((card) => (
                      <tr key={card.id}>
                        <td>
                          <b>{card.periodName}</b>
                        </td>
                        <td>{card.className || "—"}</td>
                        <td>
                          <b>
                            {card.average === null
                              ? "—"
                              : card.average.toFixed(2).replace(".", ",")}
                          </b>
                          <small className="muted"> / 20</small>
                        </td>
                        <td>
                          <Badge>{card.publishedAt || "Publié"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="Aucun bulletin publié"
                text="Les bulletins apparaîtront ici dès leur publication par l’établissement."
              />
            )}
          </Panel>
        </>
      );
    }

    return (
      <>
        <PageHead
          title="Évaluations & notes"
          subtitle="Saisissez les notes, validez les évaluations et calculez les moyennes."
          action={
            <button
              className="btn dark"
              onClick={() => setModal({ kind: "evaluation", name: "Nouvelle évaluation" })}
            >
              <Plus size={16} /> Nouvelle évaluation
            </button>
          }
        />
        {pedagogieError && (
          <div className="info-line">
            <AlertCircle size={15} /> {pedagogieError}
          </div>
        )}
        <div className="stats-row three">
          <Stat
            label="Moyenne de l’évaluation"
            value={`${average} / 20`}
            delta={selected ? `${selected.subjectName} · ${selected.className}` : "Aucune évaluation"}
            icon={TrendingUp}
          />
          <Stat
            label="Notes complétées"
            value={selected ? `${scored.length} / ${roster.length}` : "0 / 0"}
            delta={selected ? `${selected.name} · ${selected.periodName || "Hors période"}` : "À saisir"}
            icon={ClipboardCheck}
            color="violet"
          />
          <Stat
            label="Meilleure note"
            value={`${best} / 20`}
            delta={selected ? `Barème /${selected.maxScore} · Coef. ${selected.coefficient}` : "—"}
            icon={GraduationCap}
            color="amber"
          />
        </div>
        {!evaluations.length ? (
          <Panel>
            <Empty
              title="Aucune évaluation"
              text="Créez une évaluation pour commencer la saisie des notes."
              action={() => setModal({ kind: "evaluation", name: "Nouvelle évaluation" })}
            />
          </Panel>
        ) : selected ? (
          <Panel>
            <div className="table-toolbar">
              <div>
                <h3>{selected.name}</h3>
                <p className="muted small">
                  {selected.subjectName} · {selected.className} · Barème /{selected.maxScore} ·
                  Coefficient {selected.coefficient}
                </p>
              </div>
              <div className="button-group">
                <select
                  className="field compact"
                  aria-label="Évaluation à saisir"
                  value={selected.id}
                  onChange={(event) => setSelectedEvaluationId(event.target.value)}
                >
                  {evaluations.map((evaluation) => (
                    <option key={evaluation.id} value={evaluation.id}>
                      {evaluation.name} · {evaluation.className}
                    </option>
                  ))}
                </select>
                <Badge>{selected.status}</Badge>
              </div>
            </div>
            <form
              key={selected.id}
              id="grades-form"
              onSubmit={(event) => {
                event.preventDefault();
                void persist(event.currentTarget);
              }}
            >
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Élève</th>
                      <th>Note / {selected.maxScore}</th>
                      <th>Appréciation</th>
                      <th>État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((student) => {
                      const grade = gradeFor(student.id);
                      return (
                        <tr key={student.id} aria-label={"Élève " + student.name}>
                          <td>
                            <span className="name-cell">
                              <Avatar name={student.name} />
                              <span>
                                <b>{student.name}</b>
                                <small>{student.reference}</small>
                              </span>
                            </span>
                          </td>
                          <td>
                            <input
                              className="grade-input"
                              aria-label={"Note de " + student.name}
                              name={`score-${student.id}`}
                              type="number"
                              min="0"
                              max={selected.maxScore}
                              step="0.25"
                              defaultValue={grade?.score ?? ""}
                              disabled={locked}
                            />
                          </td>
                          <td>
                            <input
                              className="comment-input"
                              aria-label={"Appréciation pour " + student.name}
                              name={`comment-${student.id}`}
                              defaultValue={grade?.comment ?? ""}
                              disabled={locked}
                            />
                          </td>
                          <td>
                            <Badge>
                              {grade?.score === null || grade?.score === undefined
                                ? "À compléter"
                                : "Saisi"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!roster.length && (
                <Empty
                  title="Aucun élève dans cette classe"
                  text="Inscrivez des élèves dans la classe avant de saisir des notes."
                />
              )}
              <div className="table-footer">
                <span>Absence ≠ zéro · Les notes vides bloquent la validation.</span>
                {!locked && (
                  <div className="button-group">
                    <button className="btn secondary small-btn" type="submit">
                      Enregistrer les notes
                    </button>
                    <button
                      className="btn dark small-btn"
                      type="button"
                      onClick={async () => {
                        const form = document.getElementById("grades-form") as HTMLFormElement | null;
                        if (form) await persist(form, true);
                      }}
                    >
                      <Check size={16} /> Valider la saisie
                    </button>
                  </div>
                )}
              </div>
            </form>
          </Panel>
        ) : null}
        <div className="info-line">
          <LockKeyhole size={15} />
          Les notes sont enregistrées côté serveur. Seuls les bulletins publiés sont visibles aux
          familles.
        </div>
      </>
    );
  }

  function reports() {
    const period = periods.find((p) => p.id === reportPeriodId) ?? periods[0];
    const classRow = classList.find((c) => c.id === reportClassId) ?? classList[0];
    const cards = isFamily
      ? reportCards
      : reportCards.filter(
          (card) =>
            (!period || card.periodId === period.id) &&
            (!classRow || card.classId === classRow.id),
        );
    const periodEvaluations = evaluations.filter(
      (evaluation) =>
        (!period || evaluation.periodId === period.id) &&
        (!classRow || evaluation.classId === classRow.id),
    );
    const validatedEvaluations = periodEvaluations.filter(
      (evaluation) => evaluation.status === "Validé" || evaluation.status === "Publié",
    );
    const allPublished = cards.length > 0 && cards.every((card) => card.status === "Publié");
    const allValidated =
      cards.length > 0 &&
      cards.every((card) => card.status === "Validé" || card.status === "Publié");
    const hasDraft = cards.some((card) => card.status === "Brouillon");
    const step = allPublished ? 3 : allValidated ? 2 : cards.length ? 1 : 0;
    const currentLabel = allPublished
      ? "Publié"
      : allValidated
        ? "Validé"
        : cards.length
          ? "Brouillon"
          : "À générer";
    const run = async (action: "generate" | "validate" | "publish") => {
      if (!period || !classRow) {
        notify("Sélectionnez une période et une classe.");
        return;
      }
      try {
        if (action === "generate") {
          const result = await generateReports(period.id, classRow.id);
          notify(`${result.count} bulletin(s) généré(s).`);
        } else if (action === "validate") {
          await validateReports(period.id, classRow.id);
          notify("Bulletins validés.");
        } else {
          await publishReports(period.id, classRow.id);
          notify("Bulletins publiés : ils sont désormais visibles aux familles.");
        }
      } catch (error) {
        notify(error instanceof Error ? error.message : "Opération impossible.");
      }
    };

    return (
      <>
        <PageHead
          title={isFamily ? "Mes bulletins" : "Bulletins & résultats"}
          subtitle="De la préparation à la publication, gardez le contrôle."
          action={
            !isFamily ? (
              <button
                className="btn dark"
                disabled={!period || !classRow}
                onClick={() => {
                  if (!cards.length || hasDraft) {
                    void run(cards.length ? "validate" : "generate");
                  } else if (allValidated && !allPublished) {
                    void run("publish");
                  }
                }}
              >
                <CheckCircle2 size={16} />
                {!cards.length
                  ? "Générer les bulletins"
                  : hasDraft
                    ? "Valider les bulletins"
                    : allValidated && !allPublished
                      ? "Publier les bulletins"
                      : "Bulletins publiés"}
              </button>
            ) : (
              <Badge>Publié</Badge>
            )
          }
        />
        <div className="workflow">
          {["Brouillon", "Contrôle", "Validé", "Publié"].map((label, index) => (
            <div className={index <= step ? "done" : ""} key={label}>
              <span>{index + 1}</span>
              <b>{label}</b>
              {index < 3 && <ChevronRight size={16} />}
            </div>
          ))}
        </div>
        {pedagogieError && (
          <div className="info-line">
            <AlertCircle size={15} /> {pedagogieError}
          </div>
        )}
        <div className="report-layout">
          <Panel
            title={isFamily ? "Bulletins publiés" : period?.name || "Période"}
            extra={<Badge>{currentLabel}</Badge>}
          >
            <div className="report-summary">
              <div className="report-icon">
                <FileText size={30} />
              </div>
              <h2>{isFamily ? "Vos résultats officiels." : "Les progrès prennent forme."}</h2>
              <p>
                {classRow?.name || "Toutes les classes"} · {period?.name || "Toutes les périodes"}
                <br />
                {cards.length} bulletin(s)
              </p>
            </div>
            <div className="checklist">
              <p>
                <CheckCircle2 size={17} /> Coefficients renseignés
              </p>
              <p>
                <CheckCircle2 size={17} /> Moyenne pondérée par matière et évaluation
              </p>
              <p className={validatedEvaluations.length ? "green" : "amber"}>
                {validatedEvaluations.length ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <AlertCircle size={17} />
                )}{" "}
                {validatedEvaluations.length} évaluation(s) validée(s) sur {periodEvaluations.length}
              </p>
              <p>
                <CheckCircle2 size={17} /> Publication contrôlée par la direction
              </p>
            </div>
            <button
              className="btn secondary full"
              disabled={!cards.length}
              onClick={() =>
                cards[0] &&
                setModal({
                  kind: "bulletin",
                  name: cards[0].studentName,
                  reportCardId: cards[0].id,
                })
              }
            >
              <FileText size={16} /> Prévisualiser un bulletin
            </button>
          </Panel>
          <Panel>
            <div className="table-toolbar">
              <h3>{isFamily ? "Mes bulletins" : "Bulletins de la classe"}</h3>
              {!isFamily && (
                <div className="button-group">
                  <select
                    className="field compact"
                    aria-label="Période des bulletins"
                    value={period?.id ?? ""}
                    onChange={(event) => setReportPeriodId(event.target.value)}
                  >
                    {periods.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="field compact"
                    aria-label="Classe des bulletins"
                    value={classRow?.id ?? ""}
                    onChange={(event) => setReportClassId(event.target.value)}
                  >
                    {classList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Élève</th>
                    <th>Moyenne</th>
                    <th>État</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr key={card.id} aria-label={"Bulletin de " + card.studentName}>
                      <td>
                        <span className="name-cell">
                          <Avatar name={card.studentName} />
                          <b>{card.studentName}</b>
                        </span>
                      </td>
                      <td>
                        <b>
                          {card.average === null
                            ? "—"
                            : card.average.toFixed(2).replace(".", ",")}
                        </b>
                        <small className="muted"> / 20</small>
                      </td>
                      <td>
                        <Badge>{card.status}</Badge>
                      </td>
                      <td>
                        <button
                          className="text-link"
                          onClick={() =>
                            setModal({
                              kind: "bulletin",
                              name: card.studentName,
                              reportCardId: card.id,
                            })
                          }
                        >
                          Aperçu <ArrowUpRight size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!cards.length && (
              <Empty
                title={isFamily ? "Aucun bulletin publié" : "Aucun bulletin généré"}
                text={
                  isFamily
                    ? "Les bulletins apparaîtront ici dès leur publication."
                    : "Générez les bulletins à partir des évaluations validées."
                }
                action={!isFamily ? () => void run("generate") : undefined}
              />
            )}
            {!isFamily && cards.length > 0 && (
              <div className="table-footer">
                <span>
                  {cards.filter((card) => card.status === "Publié").length} / {cards.length} publié(s)
                </span>
                <div className="button-group">
                  <button className="btn secondary small-btn" onClick={() => void run("generate")}>
                    Recalculer
                  </button>
                  {hasDraft && (
                    <button className="btn dark small-btn" onClick={() => void run("validate")}>
                      Valider
                    </button>
                  )}
                  {allValidated && !allPublished && (
                    <button className="btn dark small-btn" onClick={() => void run("publish")}>
                      Publier
                    </button>
                  )}
                </div>
              </div>
            )}
          </Panel>
        </div>
        <div className="info-line">
          <FileText size={15} />
          {isFamily
            ? "Seuls les bulletins publiés par l’établissement sont affichés."
            : "Les moyennes sont calculées à partir des évaluations validées et des coefficients."}
        </div>
      </>
    );
  }

  function discipline() {
    const canWrite =
      canManage || profile === "Surveillant" || profile === "Enseignant";
    const incidents = disciplineSnapshot?.incidents ?? [];
    const list = incidents.filter((incident) =>
      `${incident.studentName} ${incident.className} ${incident.description} ${incident.type}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    const stats = disciplineSnapshot?.stats ?? {
      open: 0,
      ongoing: 0,
      resolved: 0,
      total: 0,
    };
    const updateStatus = async (id: string, status: string) => {
      try {
        await updateDisciplineIncident({ id, status });
        notify(`Suivi marqué « ${status} ».`);
      } catch (error) {
        notify(error instanceof Error ? error.message : "Mise à jour impossible.");
      }
    };
    if (disciplineLoading) {
      return (
        <>
          <PageHead
            title="Suivi éducatif"
            subtitle="Un suivi bienveillant, documenté et réservé aux personnes habilitées."
          />
          <Panel>
            <Empty title="Chargement du suivi" text="Récupération des incidents et observations." />
          </Panel>
        </>
      );
    }
    if (disciplineError) {
      return (
        <>
          <PageHead
            title="Suivi éducatif"
            subtitle="Un suivi bienveillant, documenté et réservé aux personnes habilitées."
          />
          <div className="info-line">
            <AlertCircle size={15} /> {disciplineError}
          </div>
        </>
      );
    }
    return (
      <>
        <PageHead
          title="Suivi éducatif"
          subtitle="Un suivi bienveillant, documenté et réservé aux personnes habilitées."
          action={
            <div className="button-group">
              <button
                className="btn secondary"
                onClick={async () => {
                  try {
                    const result = await exportDisciplineCsv();
                    downloadCsvContent(result.filename, result.content);
                    notify(`Export CSV discipline téléchargé (${result.count} ligne(s)).`);
                  } catch (error) {
                    notify(error instanceof Error ? `Export impossible : ${error.message}` : "Export impossible.");
                  }
                }}
              >
                <Download size={16} /> Exporter
              </button>
              {canWrite ? (
                <button
                  className="btn dark"
                  onClick={() =>
                    setModal({ kind: "discipline-add", name: "Ajouter une observation" })
                  }
                >
                  <Plus size={16} /> Ajouter une observation
                </button>
              ) : null}
            </div>
          }
        />
        <div className="stats-row three">
          <Stat
            label="Ouverts"
            value={String(stats.open)}
            delta="À traiter"
            icon={AlertCircle}
            color="amber"
          />
          <Stat
            label="En cours"
            value={String(stats.ongoing)}
            delta="Accompagnement actif"
            icon={Clock}
            color="violet"
          />
          <Stat
            label="Résolus"
            value={String(stats.resolved)}
            delta={`${stats.total} suivi(s) au total`}
            icon={CheckCircle2}
          />
        </div>
        <Panel>
          <div className="table-toolbar">
            <div>
              <h3>Incidents et observations</h3>
              <p className="small muted">
                Les événements sont rattachés à un élève, une date et un responsable.
              </p>
            </div>
            <div className="table-search compact-search">
              <Search size={16} />
              <input
                aria-label="Rechercher un suivi éducatif"
                placeholder="Rechercher un élève ou un motif…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Type / gravité</th>
                  <th>Description</th>
                  <th>Responsable</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {list.length ? (
                  list.map((incident) => (
                    <tr key={incident.id}>
                      <td>
                        <span className="name-cell">
                          <Avatar name={incident.studentName} />
                          <span>
                            <b>{incident.studentName}</b>
                            <small>{incident.className || "Classe non renseignée"}</small>
                          </span>
                        </span>
                      </td>
                      <td>
                        <b>{incident.type}</b>
                        <small className="muted"> · {incident.severity}</small>
                      </td>
                      <td>
                        <span>{incident.description}</span>
                        {incident.measures ? (
                          <small className="muted"> · Mesure : {incident.measures}</small>
                        ) : null}
                      </td>
                      <td>{incident.responsibleName || "—"}</td>
                      <td>{incident.date}</td>
                      <td>
                        {canWrite ? (
                          <select
                            className="field compact"
                            aria-label={`Statut du suivi de ${incident.studentName}`}
                            value={incident.status}
                            onChange={(event) =>
                              updateStatus(incident.id, event.target.value)
                            }
                          >
                            <option value="Ouvert">Ouvert</option>
                            <option value="En cours">En cours</option>
                            <option value="Résolu">Résolu</option>
                            <option value="Archivé">Archivé</option>
                          </select>
                        ) : (
                          <Badge>{incident.status}</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <span className="muted">
                        Aucun suivi éducatif enregistré pour le moment.
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="info-line">
          <ShieldCheck size={15} />
          Les observations sont visibles uniquement par le personnel habilité et sont
          journalisées dans l’historique de l’élève.
        </div>
      </>
    );
  }

  function attendance() {
    const snapshot = attendanceSnapshot;
    const canTakeAttendance =
      canManage || profile === "Enseignant" || profile === "Surveillant";
    const sessionLocked = snapshot?.session?.status === "Validé" && !canManage;
    const editable = canTakeAttendance && !sessionLocked;
    const roster = snapshot?.students ?? [];
    const list = roster.filter((student) =>
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    const entryFor = (studentId: string) =>
      attendanceDraft[studentId] ?? {
        status: "",
        minutesLate: 0,
        reason: "",
        justification: "",
      };
    const updateEntry = (
      studentId: string,
      patch: Partial<ReturnType<typeof entryFor>>,
    ) =>
      setAttendanceDraft({
        ...attendanceDraft,
        [studentId]: { ...entryFor(studentId), ...patch },
      });
    const count = (status: string) =>
      roster.filter((student) => entryFor(student.id).status === status).length;
    const present = count("Présent");
    const absent = count("Absent") + count("Absence justifiée");
    const late = count("Retard");
    const excused = count("Dispensé");
    const persist = async (validate: boolean) => {
      try {
        await saveAttendanceSheet(validate);
        notify(
          validate
            ? "Appel validé. Les familles peuvent consulter les absences et retards."
            : "Appel enregistré en brouillon.",
        );
      } catch (error) {
        notify(error instanceof Error ? error.message : "Enregistrement impossible.");
      }
    };

    if (attendanceLoading) {
      return (
        <>
          <PageHead
            title="Présences & absences"
            subtitle="Être attentif à chaque élève, chaque jour."
          />
          <Panel>
            <Empty title="Chargement de l’appel" text="Récupération des élèves de la classe." />
          </Panel>
        </>
      );
    }

    if (attendanceError) {
      return (
        <>
          <PageHead
            title="Présences & absences"
            subtitle="Être attentif à chaque élève, chaque jour."
          />
          <div className="info-line">
            <AlertCircle size={15} /> {attendanceError}
          </div>
        </>
      );
    }

    return (
      <>
        <PageHead
          title="Présences & absences"
          subtitle="Être attentif à chaque élève, chaque jour."
          action={
            <div className="button-group">
              {canTakeAttendance ? (
                <button
                  className="btn secondary"
                  onClick={async () => {
                    try {
                      const result = await exportAttendanceCsv();
                      downloadCsvContent(result.filename, result.content);
                      notify(`Export CSV des présences téléchargé (${result.count} ligne(s)).`);
                    } catch (error) {
                      notify(error instanceof Error ? `Export impossible : ${error.message}` : "Export impossible.");
                    }
                  }}
                >
                  <Download size={16} /> Exporter
                </button>
              ) : null}
              {editable && roster.length > 0 ? (
                <>
                  <button className="btn secondary" onClick={() => persist(false)}>
                    Enregistrer
                  </button>
                  <button className="btn dark" onClick={() => persist(true)}>
                    <Check size={16} /> Valider l’appel
                  </button>
                </>
              ) : null}
            </div>
          }
        />
        <div className="stats-row three">
          <Stat
            label="Présents"
            value={String(present)}
            delta={`${roster.length} élève(s) dans la classe`}
            icon={Users}
          />
          <Stat
            label="Absents"
            value={String(absent)}
            delta="Absences et absences justifiées"
            icon={ClipboardCheck}
            color="amber"
          />
          <Stat
            label="Retards"
            value={String(late)}
            delta={excused ? `${excused} dispense(s)` : "Suivi individuel"}
            icon={Clock}
            color="violet"
          />
        </div>
        <Panel>
          <div className="table-toolbar">
            <div>
              <h3>
                Feuille d’appel · {snapshot?.className ?? "Aucune classe"}
              </h3>
              <p className="small muted">
                {attendanceDate}
                {snapshot?.session
                  ? ` · ${snapshot.session.status} par ${snapshot.session.takenByName || "—"}`
                  : " · appel non encore enregistré"}
              </p>
            </div>
            <div className="button-group">
              <select
                className="field compact"
                aria-label="Classe de l’appel"
                value={snapshot?.classId ?? ""}
                onChange={(event) => setAttendanceClassId(event.target.value)}
              >
                {(snapshot?.classes ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                className="field compact"
                type="date"
                aria-label="Date de l’appel"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
                disabled={isFamily}
              />
              {editable && (
                <button
                  className="btn secondary small-btn"
                  onClick={() => {
                    const draft: typeof attendanceDraft = {};
                    for (const student of roster) {
                      draft[student.id] = {
                        ...entryFor(student.id),
                        status: "Présent",
                        minutesLate: 0,
                      };
                    }
                    setAttendanceDraft(draft);
                    notify("Tous les élèves ont été marqués présents.");
                  }}
                >
                  Tous présents
                </button>
              )}
            </div>
          </div>
          {!snapshot?.classId ? (
            <Empty
              title="Aucune classe accessible"
              text="Aucune feuille d’appel n’est disponible pour votre profil."
            />
          ) : (
            <>
              <div className="table-search">
                <Search size={16} />
                <input
                  aria-label="Rechercher un élève pour l’appel"
                  placeholder="Rechercher un élève…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Élève</th>
                      <th>Présence</th>
                      <th>Retard</th>
                      <th>Motif / justificatif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length ? (
                      list.map((student) => {
                        const entry = entryFor(student.id);
                        return (
                          <tr
                            key={student.id}
                            aria-label={`Élève ${student.firstName} ${student.lastName}`}
                          >
                            <td>
                              <span className="name-cell">
                                <Avatar name={`${student.firstName} ${student.lastName}`} />
                                <span>
                                  <b>
                                    {student.firstName} {student.lastName}
                                  </b>
                                  <small>
                                    {student.reference} · {snapshot.className}
                                  </small>
                                </span>
                              </span>
                            </td>
                            <td>
                              <select
                                className="field compact"
                                aria-label={`Statut de ${student.firstName} ${student.lastName}`}
                                value={entry.status}
                                disabled={!editable}
                                onChange={(event) =>
                                  updateEntry(student.id, { status: event.target.value })
                                }
                              >
                                <option value="">Non saisi</option>
                                <option value="Présent">Présent</option>
                                <option value="Absent">Absent</option>
                                <option value="Retard">Retard</option>
                                <option value="Absence justifiée">Absence justifiée</option>
                                <option value="Dispensé">Dispensé</option>
                              </select>
                            </td>
                            <td>
                              {entry.status === "Retard" ? (
                                <input
                                  className="comment-input"
                                  type="number"
                                  min={0}
                                  max={600}
                                  aria-label={`Minutes de retard de ${student.firstName}`}
                                  value={entry.minutesLate}
                                  disabled={!editable}
                                  onChange={(event) =>
                                    updateEntry(student.id, {
                                      minutesLate: Number(event.target.value) || 0,
                                    })
                                  }
                                />
                              ) : (
                                <span className="muted">—</span>
                              )}
                            </td>
                            <td>
                              <input
                                className="comment-input"
                                aria-label={`Motif pour ${student.firstName}`}
                                placeholder="Motif de l’absence ou du retard…"
                                value={entry.reason}
                                disabled={!editable}
                                onChange={(event) =>
                                  updateEntry(student.id, { reason: event.target.value })
                                }
                              />
                              <input
                                className="comment-input"
                                aria-label={`Justificatif pour ${student.firstName}`}
                                placeholder="Justificatif communiqué…"
                                value={entry.justification}
                                disabled={!editable}
                                onChange={(event) =>
                                  updateEntry(student.id, { justification: event.target.value })
                                }
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4}>
                          <span className="muted">Aucun élève trouvé pour cette recherche.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Panel>
        {!isFamily && snapshot?.recent?.length ? (
          <Panel title="Derniers appels">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Classe</th>
                    <th>Saisi par</th>
                    <th>État</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.recent.map((session) => (
                    <tr key={session.id}>
                      <td>{session.date}</td>
                      <td>{session.className}</td>
                      <td>{session.takenByName || "—"}</td>
                      <td>
                        <Badge>{session.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : null}
        <div className="info-line">
          <Bell size={15} />
          {isFamily
            ? "Seuls les appels validés par l’établissement sont visibles dans votre espace."
            : "Un appel validé est verrouillé pour les enseignants et surveillants ; la direction peut encore le corriger avec traçabilité."}
        </div>
      </>
    );
  }

  return { dashboard, tableScreen, schedule, grades, reports, attendance, discipline };
}
