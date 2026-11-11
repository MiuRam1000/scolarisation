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
} from "lucide-react";
import { students } from "../lib/demo-data";
import {
  title,
  Avatar,
  Badge,
  Panel,
  Stat,
  downloadCsv,
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
    scheduleStage,
    week,
    setWeek,
    scheduleView,
    setScheduleView,
    attend,
    setAttend,
    notify,
    go,
    isFamily,
    isPlatform,
    module,
    allRows,
    filtered,
    exportModule,
    moduleButton,
  } = ctx;
  function dashboard() {
    const platform = isPlatform;
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
              Bonjour,{" "}
              {platform
                ? "Alexandre"
                : profile === "Enseignant"
                  ? "Marie"
                  : profile === "Comptable"
                    ? "Nadia"
                    : "Alexandre"}
              <span className="greeting-dot">.</span>
            </h1>
            <p>
              {platform
                ? "Vos établissements, vos équipes, une vision partagée."
                : "Voici ce qui se passe dans votre établissement aujourd’hui."}
            </p>
          </div>
          <button className="btn secondary" onClick={() => go("documents")}>
            <Download size={16} /> Exporter un rapport
          </button>
        </div>
        <div className="hero">
          <div className="hero-content">
            <span className="hero-label">
              <span />{" "}
              {platform ? "Scolia · Espace éditeur" : "Année scolaire " + year + " · 1er trimestre"}
            </span>
            <h2>
              {platform ? (
                <>
                  Des écoles connectées.
                  <br />
                  Des parcours accompagnés.
                </>
              ) : (
                <>
                  Une école qui avance.
                  <br />
                  Ensemble.
                </>
              )}
            </h2>
            <p>
              {platform
                ? "Un regard global pour accompagner chacun de vos établissements."
                : "Les bonnes informations, au bon moment.<br/>Pour vous concentrer sur l’essentiel : vos élèves."}
            </p>
            <button className="btn dark" onClick={() => go(platform ? "tenants" : "reports")}>
              {platform ? "Voir les établissements" : "Suivre les résultats"}
              <ArrowUpRight size={17} />
            </button>
          </div>
          <SchoolArt />
          <div className="hero-mini">
            <span className="mini-check">
              <Check size={15} />
            </span>
            <div>
              <b>{platform ? "3 établissements" : "Une année bien engagée"}</b>
              <small>{platform ? "Espaces de démonstration" : "92 % de dossiers complets"}</small>
            </div>
          </div>
        </div>
        <div className="stats-row">
          <Stat
            label={platform ? "Établissements" : "Élèves inscrits"}
            value={platform ? "3" : school.includes("Horizons") ? "640" : "1 248"}
            delta={platform ? "+1 |depuis septembre" : "+8,2 % |vs. année précédente"}
          />
          <Stat
            label={platform ? "Utilisateurs" : "Enseignants"}
            value={platform ? "218" : "64"}
            delta="+4 |cette année"
            icon={GraduationCap}
            color="violet"
          />
          <Stat
            label={platform ? "Espaces actifs" : "Présence aujourd’hui"}
            value={platform ? "2 / 3" : "96,4 %"}
            delta="+1,2 % |vs. semaine précédente"
            icon={ClipboardCheck}
          />
          <Stat
            label={platform ? "Revenus SaaS fictifs" : "Frais encaissés fictifs"}
            value={platform ? "228 €" : "84 560 €"}
            delta="+12,5 % |ce mois-ci"
            icon={Wallet}
            color="amber"
          />
        </div>
        <div className="dashboard-grid">
          <Panel
            title={platform ? "Croissance des établissements" : "Évolution des résultats"}
            extra={
              <select
                className="mini-select"
                aria-label="Période des résultats"
                onChange={(e) => notify("Vue " + e.target.value + " : série illustrative.")}
              >
                <option>Premier trimestre</option>
                <option>Année scolaire</option>
              </select>
            }
          >
            <div className="chart-legend">
              <span>
                <i className="green-dot" />
                {platform ? "Comptes actifs" : "Moyenne de l’établissement"}
              </span>
              <span>
                <i className="yellow-dot" />{" "}
                {platform ? "Nouveaux comptes" : "Objectif pédagogique"}
              </span>
            </div>
            <div className="chart">
              <div className="chart-y">
                <span>20</span>
                <span>15</span>
                <span>10</span>
                <span>5</span>
              </div>
              <svg
                viewBox="0 0 600 180"
                aria-label="Graphique illustratif des résultats : progression de 12,5 à 14,8 sur 20"
              >
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#729c7e" stopOpacity=".2" />
                    <stop offset="100%" stopColor="#729c7e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[20, 65, 110, 155].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="600"
                    y2={y}
                    stroke="#edeee9"
                    strokeDasharray="4 4"
                  />
                ))}
                <path
                  d="M0 115 C40 115 60 65 100 75 S170 135 210 98 S290 55 330 70 S400 35 450 48 S550 20 600 24 L600 180 L0 180Z"
                  fill="url(#fill)"
                />
                <path d="M0 57 L600 57" stroke="#dacb71" strokeDasharray="6 6" strokeWidth="2" />
                <path
                  d="M0 115 C40 115 60 65 100 75 S170 135 210 98 S290 55 330 70 S400 35 450 48 S550 20 600 24"
                  fill="none"
                  stroke="#557b60"
                  strokeWidth="3"
                />
                <circle cx="450" cy="48" r="5" fill="#557b60" stroke="white" strokeWidth="3" />
              </svg>
              <div className="chart-x">
                {["Sept.", "Oct.", "Nov.", "Déc.", "Janv.", "Févr."].map((x) => (
                  <span key={x}>{x}</span>
                ))}
              </div>
            </div>
            <div className="chart-summary">
              <b>
                14,8 <small>/ 20</small>
              </b>
              <span>
                Moyenne générale illustrative <span className="green">+ 0,6 point</span>
              </span>
            </div>
          </Panel>
          <Panel
            title="À votre attention"
            extra={<span className="count">3</span>}
            className="attention"
          >
            <div className="attention-item">
              <span className="attention-icon amber">
                <FileText size={19} />
              </span>
              <div>
                <b>{platform ? "1 établissement en préparation" : "12 dossiers à compléter"}</b>
                <p>
                  {platform
                    ? "Finalisez le paramétrage initial."
                    : "Des pièces justificatives sont manquantes."}
                </p>
                <button className="text-link" onClick={() => go(platform ? "tenants" : "students")}>
                  Consulter les dossiers <ArrowRight size={14} />
                </button>
              </div>
            </div>
            <div className="attention-item">
              <span className="attention-icon violet">
                <ClipboardCheck size={19} />
              </span>
              <div>
                <b>{platform ? "2 tickets à traiter" : "8 évaluations en attente"}</b>
                <p>
                  {platform
                    ? "Vos établissements attendent une réponse."
                    : "La saisie des notes reste à finaliser."}
                </p>
                <button className="text-link" onClick={() => go(platform ? "support" : "grades")}>
                  Voir les {platform ? "tickets" : "évaluations"} <ArrowRight size={14} />
                </button>
              </div>
            </div>
            <div className="attention-item">
              <span className="attention-icon green">
                <Wallet size={19} />
              </span>
              <div>
                <b>{platform ? "Prochain renouvellement" : "Échéances du 15 novembre"}</b>
                <p>
                  {platform
                    ? "Saint-Exupéry · 1er décembre."
                    : "24 familles ont un solde à régler."}
                </p>
                <button
                  className="text-link"
                  onClick={() => go(platform ? "subscriptions" : "fees")}
                >
                  Suivre les échéances <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </Panel>
          <Panel
            title="La vie de l’établissement"
            extra={
              <button className="text-link muted" onClick={() => go("audit")}>
                Tout voir <ArrowUpRight size={14} />
              </button>
            }
          >
            <div className="activity-list">
              {[
                [
                  "ML",
                  "Marie Lefèvre",
                  "a complété les notes de mathématiques",
                  "4e A · il y a 15 min",
                ],
                ["NR", "Nadia Robert", "a enregistré un encaissement", "120 € · il y a 32 min"],
                ["SR", "Sarah Ravel", "a publié le cahier de textes", "3e A · il y a 1 h"],
              ].map(([init, name, verb, time]) => (
                <div className="activity" key={init}>
                  <Avatar name={name} />
                  <div>
                    <p>
                      <b>{name}</b> {verb}.
                    </p>
                    <small>{time}</small>
                  </div>
                  <CheckCircle2 size={16} className="muted" />
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            title="Les prochains rendez-vous"
            extra={
              <button className="text-link muted" onClick={() => go("years")}>
                <CalendarDays size={17} />
              </button>
            }
          >
            <div className="event">
              <div className="date-tile">
                <small>NOV</small>
                <b>14</b>
              </div>
              <div>
                <b>Réunion de l’équipe pédagogique</b>
                <small>14:00 – 15:30 · Salle des professeurs</small>
                <span className="event-tag">Équipe pédagogique</span>
              </div>
            </div>
            <div className="event">
              <div className="date-tile warm">
                <small>NOV</small>
                <b>21</b>
              </div>
              <div>
                <b>Rencontre parents-professeurs</b>
                <small>09:00 – 12:00 · Établissement</small>
                <span className="event-tag">Familles</span>
              </div>
            </div>
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
            <button className="btn dark" onClick={moduleButton}>
              <Plus size={16} />
              {module!.action}
            </button>
          }
        />
        <div className="summary-strip">
          <span>
            <b>{allRows.length}</b>{" "}
            {current === "students" ? "dossiers de démonstration" : "éléments affichés"}
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
                        {j === 0 && current === "students" ? (
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
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""} · jeu de démonstration
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
    const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
    const subjects = ["Mathématiques", "Français", "Histoire-géo.", "Anglais", "Sciences", "EPS"];
    return (
      <>
        <PageHead
          title="Emploi du temps"
          subtitle="Des journées équilibrées, pour mieux apprendre."
          action={
            <div className="button-group">
              {!isFamily && (
                <button
                  className="btn secondary"
                  onClick={() => setModal({ kind: "generate", name: "Générer une proposition" })}
                >
                  <Sparkles size={16} /> Générer un planning
                </button>
              )}
              <button
                className="btn dark"
                onClick={() => {
                  if (isFamily) {
                    window.print();
                  } else if (scheduleStage === "Publié") {
                    notify(
                      "La version publiée est conservée. Générez un nouveau brouillon pour la modifier.",
                    );
                  } else {
                    setModal({ kind: "confirm", name: "Publier cette version du planning ?" });
                  }
                }}
              >
                {isFamily ? <Printer size={16} /> : <Check size={16} />}{" "}
                {isFamily ? "Imprimer" : "Publier"}
              </button>
            </div>
          }
        />
        <div className="schedule-tools">
          <div className="button-group">
            <button
              className="icon-btn bordered"
              onClick={() => setWeek(week - 1)}
              aria-label="Semaine précédente"
            >
              <ChevronRight className="reverse" size={17} />
            </button>
            <b>
              {week === 0
                ? "09 – 13 novembre 2026"
                : week === 1
                  ? "16 – 20 novembre 2026"
                  : week === -1
                    ? "02 – 06 novembre 2026"
                    : "Semaine " + (46 + week) + " · 2026"}
            </b>
            <button
              className="icon-btn bordered"
              onClick={() => setWeek(week + 1)}
              aria-label="Semaine suivante"
            >
              <ChevronRight size={17} />
            </button>
            <button className="text-link" onClick={() => setWeek(0)}>
              Aujourd’hui
            </button>
          </div>
          <select
            className="field compact"
            aria-label="Vue du planning"
            value={scheduleView}
            onChange={(e) => setScheduleView(e.target.value)}
          >
            {(isFamily ? ["4e A"] : ["4e A", "3e B", "6e A", "Marie Lefèvre", "Salle 202"]).map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
        </div>
        <div className="planning-status">
          <span>
            <Badge>{scheduleStage}</Badge>{" "}
            <small>
              Version {scheduleStage === "Publié" ? "3" : "4"} · {scheduleView} · semaine
              illustrative
            </small>
          </span>
          <span className="green">
            <CheckCircle2 size={15} />{" "}
            {scheduleStage === "Publié"
              ? "Aucun conflit dans les créneaux affichés"
              : "Proposition locale · moteur simulé"}
          </span>
        </div>
        <Panel className="schedule-panel">
          <div className="schedule-grid">
            <div className="time-head">GMT+1</div>
            {days.map((d, i) => (
              <div className={"day-head " + (i === 2 ? "today" : "")} key={d}>
                <small>{d}</small>
                <b>{9 + i + week * 7}</b>
              </div>
            ))}
            {["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"].map(
              (time, r) => (
                <div className="schedule-row" key={time}>
                  <div className="time-label">{time}</div>
                  {days.map((d, c) => {
                    const idx = (r + c + (scheduleView === "3e B" ? 1 : 0)) % 6;
                    const empty = (c === 2 && r > 3) || (r === 7 && c % 2 === 0);
                    return (
                      <div className="slot" key={d}>
                        {r === 4 ? (
                          <span className="break">Pause déjeuner</span>
                        ) : !empty ? (
                          <button
                            className={"lesson color-" + idx}
                            onClick={() => setModal({ kind: "lesson", name: subjects[idx] })}
                          >
                            <b>{subjects[idx]}</b>
                            <span>
                              {idx === 0
                                ? "M. Lefèvre"
                                : idx === 1
                                  ? "P. Durand"
                                  : idx === 2
                                    ? "S. Ravel"
                                    : "A. Simon"}
                            </span>
                            <small>
                              {time} – {String(Number(time.slice(0, 2)) + 1).padStart(2, "0")}:00{" "}
                              <span>· Salle {202 + c}</span>
                            </small>
                          </button>
                        ) : (
                          <span className="free">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ),
            )}
          </div>
        </Panel>
        <div className="info-line">
          <CalendarDays size={15} />
          Les créneaux sont fictifs. La génération automatique et l’optimisation des contraintes ne
          sont pas implémentées.
        </div>
      </>
    );
  }

  function grades() {
    const published = gradeStage === "Validé";
    return (
      <>
        <PageHead
          title={isFamily ? "Mes résultats publiés" : "Évaluations & notes"}
          subtitle="Des résultats lisibles, des progrès à accompagner."
          action={
            !isFamily ? (
              <button
                className="btn dark"
                onClick={() => {
                  if (notes.some((n) => n === null)) {
                    notify("Validation bloquée : complétez les notes manquantes.");
                  } else setModal({ kind: "confirm", name: "Valider cette évaluation ?" });
                }}
              >
                <Check size={16} /> Valider la saisie
              </button>
            ) : (
              <Badge>Résultats publiés</Badge>
            )
          }
        />
        <div className="stats-row three">
          <Stat
            label="Moyenne de l’évaluation"
            value={
              (
                notes.reduce<number>((a, n) => a + (n ?? 0), 0) /
                (notes.filter((n) => n !== null).length || 1)
              )
                .toFixed(2)
                .replace(".", ",") + " / 20"
            }
            delta="Coefficient 2 |Mathématiques"
            icon={TrendingUp}
          />
          <Stat
            label="Notes complétées"
            value={notes.filter((n) => n !== null).length + " / " + notes.length}
            delta="Grille de démonstration |Classe 4e A"
            icon={ClipboardCheck}
            color="violet"
          />
          <Stat
            label="Meilleure note"
            value={Math.max(...notes.map((n) => n ?? 0)) + " / 20"}
            delta="Évaluation du 09 novembre |Premier trimestre"
            icon={GraduationCap}
            color="amber"
          />
        </div>
        <Panel>
          <div className="table-toolbar">
            <div>
              <h3>Équations du premier degré</h3>
              <p className="muted small">Mathématiques · 4e A · Barème /20 · Coefficient 2</p>
            </div>
            <div className="button-group">
              <Badge>{gradeStage}</Badge>
              {!isFamily && (
                <button
                  className="btn secondary small-btn"
                  onClick={() => {
                    setGradeStage("Brouillon");
                    notify("Brouillon enregistré dans ce navigateur.");
                  }}
                >
                  Enregistrer le brouillon
                </button>
              )}
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Note / 20</th>
                  <th>Appréciation</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {students
                  .filter((r) => !isFamily || r.name === "Emma Laurent")
                  .map((r) => {
                    const i = students.indexOf(r);
                    return (
                      <tr key={r.sub} aria-label={"Élève " + r.name}>
                        <td>
                          <span className="name-cell">
                            <Avatar name={r.name} />
                            <span>
                              <b>{r.name}</b>
                              <small>{r.sub}</small>
                            </span>
                          </span>
                        </td>
                        <td>
                          <input
                            className="grade-input"
                            aria-label={"Note de " + r.name}
                            type="number"
                            min="0"
                            max="20"
                            step="0.25"
                            disabled={isFamily || published}
                            value={isFamily ? 16 : (notes[i] ?? "")}
                            onChange={(e) => {
                              const v = e.target.value === "" ? null : Number(e.target.value);
                              if (v !== null && (v < 0 || v > 20)) {
                                notify("La note doit être comprise entre 0 et 20.");
                                return;
                              }
                              setNotes(notes.map((n, j) => (j === i ? v : n)));
                            }}
                          />
                        </td>
                        <td>
                          <input
                            className="comment-input"
                            aria-label={"Appréciation pour " + r.name}
                            defaultValue={
                              i % 3 === 0
                                ? "Très bon travail, continuez !"
                                : i % 3 === 1
                                  ? "Des progrès encourageants."
                                  : "Les notions sont bien maîtrisées."
                            }
                            disabled={isFamily || published}
                          />
                        </td>
                        <td>
                          <Badge>
                            {notes[i] === null ? "À compléter" : published ? "Validé" : "Saisi"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Absence ≠ zéro · Les notes vides bloquent la validation.</span>
            {published && (
              <button
                className="text-link"
                onClick={() => setModal({ kind: "unlock", name: "Demander une correction" })}
              >
                Correction motivée
              </button>
            )}
          </div>
        </Panel>
        <div className="info-line">
          <LockKeyhole size={15} />
          Cette grille est une simulation locale ; la validation ne publie rien aux familles.
        </div>
      </>
    );
  }

  function reports() {
    return (
      <>
        <PageHead
          title="Bulletins & résultats"
          subtitle="De la préparation à la publication, gardez le contrôle."
          action={
            !isFamily ? (
              <button
                className="btn dark"
                onClick={() => {
                  if (notes.some((n) => n === null)) {
                    notify("Bulletins incomplets : des notes sont manquantes.");
                    return;
                  }
                  setModal({
                    kind: "confirm",
                    name: "Valider les bulletins du premier trimestre ?",
                  });
                }}
              >
                <CheckCircle2 size={16} />
                {reportStage === "Validé" ? "Publier les bulletins" : "Valider les bulletins"}
              </button>
            ) : undefined
          }
        />
        <div className="workflow">
          {["Brouillon", "Contrôle", "Validé", "Publié"].map((s, i) => (
            <div
              className={
                i <= (reportStage === "Publié" ? 3 : reportStage === "Validé" ? 2 : 0) ? "done" : ""
              }
              key={s}
            >
              <span>{i + 1}</span>
              <b>{s}</b>
              {i < 3 && <ChevronRight size={16} />}
            </div>
          ))}
        </div>
        <div className="report-layout">
          <Panel
            title="Premier trimestre"
            extra={<Badge>{isFamily ? "Publié" : reportStage}</Badge>}
          >
            <div className="report-summary">
              <div className="report-icon">
                <FileText size={30} />
              </div>
              <h2>Les progrès prennent forme.</h2>
              <p>
                Classe 4e A · {year}
                <br />8 bulletins de démonstration
              </p>
            </div>
            <div className="checklist">
              <p>
                <CheckCircle2 size={17} /> Coefficients renseignés
              </p>
              <p>
                <CheckCircle2 size={17} /> Règles de calcul : moyenne pondérée /20
              </p>
              <p className={notes.some((n) => n === null) ? "amber" : "green"}>
                {notes.some((n) => n === null) ? (
                  <AlertCircle size={17} />
                ) : (
                  <CheckCircle2 size={17} />
                )}{" "}
                {notes.some((n) => n === null)
                  ? "Des notes sont manquantes"
                  : "Notes de démonstration complètes"}
              </p>
              <p>
                <CheckCircle2 size={17} /> Identité et période renseignées
              </p>
            </div>
            <button
              className="btn secondary full"
              onClick={() => setModal({ kind: "bulletin", name: "Emma Laurent" })}
            >
              <FileText size={16} /> Prévisualiser un bulletin
            </button>
          </Panel>
          <Panel>
            <div className="table-toolbar">
              <h3>{isFamily ? "Mon bulletin publié" : "Bulletins de la classe"}</h3>
              <select className="field compact" aria-label="Classe des bulletins">
                <option>4e A</option>
              </select>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Moyenne indicative</th>
                  <th>État</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {students
                  .filter((r) => !isFamily || r.name === "Emma Laurent")
                  .map((r, i) => (
                    <tr key={r.sub} aria-label={"Élève " + r.name}>
                      <td>
                        <span className="name-cell">
                          <Avatar name={r.name} />
                          <b>{r.name}</b>
                        </span>
                      </td>
                      <td>
                        <b>
                          {(isFamily ? 16.2 : (notes[i] ?? 0) * 0.35 + 14 * 0.65)
                            .toFixed(2)
                            .replace(".", ",")}
                        </b>
                        <small className="muted"> / 20</small>
                      </td>
                      <td>
                        <Badge>
                          {isFamily ? "Publié" : notes[i] === null ? "Incomplet" : reportStage}
                        </Badge>
                      </td>
                      <td>
                        <button
                          className="text-link"
                          onClick={() => setModal({ kind: "bulletin", name: r.name })}
                        >
                          Aperçu <ArrowUpRight size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Panel>
        </div>
        <div className="info-line">
          <FileText size={15} />
          Les moyennes affichées sont illustratives. L’aperçu détaille la formule utilisée et n’est
          pas un bulletin officiel.
        </div>
      </>
    );
  }

  function attendance() {
    const list = students.filter(
      (r) =>
        (!isFamily || r.name === "Emma Laurent") &&
        r.name.toLowerCase().includes(search.toLowerCase()),
    );
    return (
      <>
        <PageHead
          title="Présences & absences"
          subtitle="Être attentif à chaque élève, chaque jour."
          action={
            !isFamily ? (
              <button
                className="btn dark"
                onClick={() =>
                  setModal({ kind: "confirm", name: "Valider l’appel de la classe ?" })
                }
              >
                <Check size={16} /> Valider l’appel
              </button>
            ) : undefined
          }
        />
        <div className="stats-row three">
          <Stat
            label="Présents"
            value={String(
              students.filter((r) => (attend[r.sub] || "Présent") === "Présent").length,
            )}
            delta="Aujourd’hui |Classe de démonstration"
            icon={Users}
          />
          <Stat
            label="Absents"
            value={String(students.filter((r) => attend[r.sub] === "Absent").length)}
            delta="À justifier |Aujourd’hui"
            icon={ClipboardCheck}
            color="amber"
          />
          <Stat
            label="Retards"
            value={String(students.filter((r) => attend[r.sub] === "Retard").length)}
            delta="Suivi individuel |Aujourd’hui"
            icon={Clock}
            color="violet"
          />
        </div>
        <Panel>
          <div className="table-toolbar">
            <div>
              <h3>Appel · Mathématiques</h3>
              <p className="small muted">Mercredi 11 novembre 2026 · 08:00 – 09:00</p>
            </div>
            <div className="button-group">
              <span className="class-tag">4e A</span>
              {!isFamily && (
                <button
                  className="btn secondary small-btn"
                  onClick={() => {
                    setAttend(Object.fromEntries(students.map((r) => [r.sub, "Présent"])));
                    notify("Tous les élèves ont été marqués présents.");
                  }}
                >
                  Tous présents
                </button>
              )}
            </div>
          </div>
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
                  <th>Motif / justificatif</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.sub} aria-label={"Élève " + r.name}>
                    <td>
                      <span className="name-cell">
                        <Avatar name={r.name} />
                        <span>
                          <b>{r.name}</b>
                          <small>{r.fields[0]}</small>
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="presence-options">
                        {["Présent", "Absent", "Retard", "Justifié"].map((s) => (
                          <button
                            disabled={isFamily}
                            className={
                              (attend[r.sub] || "Présent") === s
                                ? "selected " +
                                  (s === "Absent" ? "red" : s === "Retard" ? "amber" : "green")
                                : ""
                            }
                            onClick={() => setAttend({ ...attend, [r.sub]: s })}
                            key={s}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <input
                        className="comment-input"
                        aria-label={"Motif pour " + r.name}
                        placeholder="Ajouter un motif…"
                        disabled={isFamily}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="info-line">
          <Bell size={15} />
          Aucune notification réelle n’est envoyée aux familles depuis la maquette.
        </div>
      </>
    );
  }

  return { dashboard, tableScreen, schedule, grades, reports, attendance };
}
