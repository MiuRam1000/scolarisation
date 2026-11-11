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
} from "lucide-react";
import { students, profileNames, type DemoRow } from "../lib/demo-data";
import { icons, title, Avatar, Badge, FormField } from "../components/scolia-ui";

import { useScoliaState } from "../hooks/use-scolia-state";
import { buildPrimaryViews } from "./scolia-primary";
import { buildSecondaryViews } from "./scolia-secondary";
export default function Scolia() {
  const ctx = useScoliaState();
  const {
    current,
    profile,
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
    notes,
    setGradeStage,
    reportStage,
    setReportStage,
    scheduleStage,
    setScheduleStage,
    scheduleView,
    setScheduleView,
    paymentRows,
    setPaymentRows,
    messageRows,
    setMessageRows,
    receipt,
    setReceipt,
    notify,
    go,
    isFamily,
    isPlatform,
    visibleGroups,
    module,
    allRows,
    setNewProfile,
  } = ctx;
  const { dashboard, tableScreen, schedule, grades, reports, attendance } = buildPrimaryViews(ctx);
  const { payments, messages, settingsScreen, imports, portal, health, login } =
    buildSecondaryViews(ctx, schedule);
  function body() {
    if (module) return tableScreen();
    switch (current) {
      case "schedule":
        return schedule();
      case "grades":
        return grades();
      case "reports":
        return reports();
      case "attendance":
        return attendance();
      case "payments":
        return payments();
      case "messages":
        return messages();
      case "settings":
        return settingsScreen();
      case "imports":
        return imports();
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
          <select
            aria-label="Changer d’établissement"
            value={school}
            onChange={(e) => {
              setSchool(e.target.value);
              notify("Établissement de démonstration sélectionné.");
            }}
          >
            <option>Institution Saint-Exupéry</option>
            <option>Collège Les Horizons</option>
          </select>
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
            onClick={() => setModal({ kind: "profile", name: "Explorer les espaces" })}
          >
            <Avatar
              name={
                profile === "Enseignant"
                  ? "Marie Lefèvre"
                  : isFamily
                    ? "Sophie Laurent"
                    : "Alexandre Rivière"
              }
            />
            <span>
              <b>
                {profile === "Enseignant"
                  ? "Marie Lefèvre"
                  : isFamily
                    ? "Sophie Laurent"
                    : "Alexandre Rivière"}
              </b>
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
                <i />
              </button>
              {notifications && (
                <div className="notification-popover">
                  <h3>
                    Notifications <span className="count">3</span>
                  </h3>
                  {[
                    ["Notes à compléter", "grades"],
                    ["Échéance du 15 novembre", "fees"],
                    ["Nouvelle annonce de l’école", "messages"],
                  ].map(([t, id]) => (
                    <button
                      key={id}
                      onClick={() => {
                        go(id);
                        setNotifications(false);
                      }}
                    >
                      <span className="mini-check">
                        <Bell size={15} />
                      </span>
                      <span>
                        <b>{t}</b>
                        <small>Démonstration · Aujourd’hui</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Avatar name="Alexandre Rivière" />
          </div>
        </header>
        <div className="demo-bar">
          <span>
            <span className="live-dot" /> PROTOTYPE INTERACTIF{" "}
            <small>· Données fictives, actions locales</small>
          </span>
          <label>
            Explorer en tant que{" "}
            <select
              aria-label="Profil de démonstration"
              value={profile}
              onChange={(e) => setNewProfile(e.target.value)}
            >
              {profileNames.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
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
            <span>Maquette UI/UX · Novembre 2026</span>
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
              {["Informations", "Historique", ...(current === "students" ? ["Scolarité"] : [])].map(
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
                <div className="detail-fields">
                  {detail.fields.map((f, i) => (
                    <div key={i}>
                      <small>{module?.columns[i + 1]}</small>
                      <b>{f}</b>
                    </div>
                  ))}
                </div>
                {current === "students" && (
                  <div className="info-box">
                    <Users size={21} />
                    <p>
                      Dossier fictif. Les données personnelles et les pièces jointes ne sont pas
                      collectées.
                    </p>
                  </div>
                )}
                <button
                  className="btn secondary full"
                  onClick={() => {
                    setModal({ kind: "generic", name: "Modifier la fiche", row: detail });
                    setDetail(null);
                  }}
                >
                  Modifier la fiche <ArrowRight size={16} />
                </button>
              </>
            ) : detailTab === "Historique" ? (
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
            className={"modal " + (modal?.kind === "bulletin" ? "wide" : "")}
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
                  <b>Institution Saint-Exupéry</b>
                  <small>REÇU DE DÉMONSTRATION · NON OFFICIEL</small>
                </div>
                <div className="detail-fields">
                  {[
                    ["Référence", receipt.sub],
                    ["Élève", receipt.name],
                    ["Frais", receipt.fields[0]],
                    ["Mode de paiement", receipt.fields[1]],
                    ["Montant reçu", receipt.fields[2]],
                    ["Date", "11 novembre 2026"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <small>{k}</small>
                      <b>{v}</b>
                    </div>
                  ))}
                </div>
                <button className="btn dark full" onClick={() => window.print()}>
                  <Printer size={16} /> Imprimer le reçu de démonstration
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
            Explorez chaque parcours. Le changement de rôle est une simulation, pas une autorisation
            réelle.
          </p>
          <div className="profile-options">
            {profileNames.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setNewProfile(p);
                  setModal(null);
                }}
              >
                <span className="attention-icon green">
                  {p === "Plateforme SaaS" ? <Building2 size={20} /> : <Users size={20} />}
                </span>
                {p}
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
          <button
            className="text-link"
            onClick={() => {
              setModal(null);
              go("login");
            }}
          >
            <LogOut size={16} /> Voir l’écran de connexion
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
    if (kind === "bulletin") {
      const index = students.findIndex((r) => r.name === modal.name);
      const math = isFamily ? 16 : (notes[index < 0 ? 0 : index] ?? 0);
      const lines = [
        ["Mathématiques", math, 4],
        ["Français", 15, 4],
        ["Histoire-géographie", 14.5, 3],
        ["Anglais", 17, 2],
        ["Sciences physiques", 15.5, 2],
      ] as [string, number, number][];
      const avg = lines.reduce((s, l) => s + l[1] * l[2], 0) / 15;
      return (
        <>
          <div className="bulletin">
            <div className="bulletin-top">
              <span className="school-logo">
                <GraduationCap size={27} />
              </span>
              <div>
                <h3>Institution Saint-Exupéry</h3>
                <p>Bulletin du premier trimestre · {year}</p>
              </div>
              <Badge>{isFamily ? "Publié (fictif)" : reportStage}</Badge>
            </div>
            <div className="bulletin-person">
              <b>{modal.name}</b>
              <span>Classe 4e A · Document de démonstration</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Matière</th>
                  <th>Coeff.</th>
                  <th>Moyenne /20</th>
                  <th>Appréciation</th>
                </tr>
              </thead>
              <tbody>
                {lines.map(([name, n, c]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{c}</td>
                    <td>
                      <b>{n.toFixed(2).replace(".", ",")}</b>
                    </td>
                    <td>Travail régulier et sérieux.</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bulletin-result">
              <span>Moyenne pondérée illustrative</span>
              <b>
                {avg.toFixed(2).replace(".", ",")} <small>/ 20</small>
              </b>
            </div>
            <p className="muted small">
              Calcul : Σ (moyenne matière × coefficient) / 15. Mathématiques reprend la note locale
              ; les autres matières sont fixes. Cet aperçu n’est pas un bulletin officiel.
            </p>
            <div className="bulletin-comment">
              <b>Appréciation générale</b>
              <p>Un trimestre encourageant. Poursuivez vos efforts avec confiance.</p>
            </div>
          </div>
          <button className="btn dark full" onClick={() => window.print()}>
            <Printer size={16} /> Imprimer l’aperçu
          </button>
        </>
      );
    }
    if (kind === "generate")
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setScheduleStage("Brouillon");
            setModal(null);
            notify("Proposition fictive créée. Aucun moteur d’optimisation n’est exécuté.");
          }}
        >
          <p className="muted">
            Préparez une nouvelle version illustrative. Le planning publié précédent reste la
            référence visuelle.
          </p>
          <label>
            Classe
            <select
              className="field"
              value={scheduleView}
              onChange={(e) => setScheduleView(e.target.value)}
            >
              <option>4e A</option>
              <option>3e B</option>
              <option>6e A</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              aria-label="Respecter les disponibilités des enseignants"
              defaultChecked
            />{" "}
            Respecter les disponibilités des enseignants
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              aria-label="Éviter les conflits de salle et de classe"
              defaultChecked
            />{" "}
            Éviter les conflits de salle et de classe
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              aria-label="Répartir les matières dans la semaine"
              defaultChecked
            />{" "}
            Répartir les matières dans la semaine
          </label>
          <div className="info-box">
            <Sparkles size={20} />
            <p>Ces contraintes illustrent le futur générateur ; elles ne sont pas calculées ici.</p>
          </div>
          <button className="btn dark full" type="submit">
            <Sparkles size={16} /> Créer la proposition fictive
          </button>
        </form>
      );
    if (kind === "lesson")
      return (
        <>
          <div className="detail-fields">
            <div>
              <small>Classe / vue</small>
              <b>{scheduleView}</b>
            </div>
            <div>
              <small>État</small>
              <b>{scheduleStage}</b>
            </div>
            <div>
              <small>Séance</small>
              <b>Cours de démonstration · 1 heure</b>
            </div>
          </div>
          <button
            className="btn secondary full"
            onClick={() => {
              setModal(null);
              go("lessons");
            }}
          >
            <BookOpen size={16} /> Ouvrir le cahier de textes
          </button>
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
    if (kind === "payment")
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const newRow = {
              name: String(f.get("student")),
              sub: "DEMO-REC-" + Date.now(),
              fields: [
                String(f.get("fee")),
                String(f.get("method")),
                String(f.get("amount")) + " €",
              ],
              status: "Enregistré",
            };
            setPaymentRows([newRow, ...paymentRows]);
            setModal(null);
            setReceipt(newRow);
            notify("Paiement fictif enregistré localement. Aucun argent transféré.");
          }}
        >
          <label>
            Élève
            <select className="field" name="student">
              {students.map((r) => (
                <option key={r.sub}>{r.name}</option>
              ))}
            </select>
          </label>
          <label>
            Échéance
            <select className="field" name="fee">
              <option>Scolarité · Novembre</option>
              <option>Frais d’inscription</option>
              <option>Transport scolaire</option>
            </select>
          </label>
          <div className="form-grid">
            <FormField
              label="Montant reçu (€)"
              name="amount"
              type="number"
              value="120"
              min="0.01"
              max="100000"
              step="0.01"
            />
            <label>
              Mode
              <select className="field" name="method">
                <option>Virement</option>
                <option>Espèces</option>
                <option>Chèque</option>
              </select>
            </label>
          </div>
          <FormField label="Référence du paiement fictif" name="reference" value="DEMO-2026" />
          <div className="info-box">
            <Wallet size={20} />
            <p>Encaissement simulé. Les montants ne sont pas reliés à un solde réel.</p>
          </div>
          <button className="btn dark full" type="submit">
            Confirmer et créer le reçu <Check size={16} />
          </button>
        </form>
      );
    if (kind === "message")
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setMessageRows([
              {
                name: String(f.get("name")),
                text: String(f.get("text")),
                target: String(f.get("target")),
                status: "Brouillon",
                date: "11 nov. 2026",
              },
              ...messageRows,
            ]);
            setModal(null);
            notify("Annonce enregistrée en brouillon local.");
          }}
        >
          <FormField label="Titre de l’annonce" name="name" />
          <label>
            Destinataires
            <select className="field" name="target">
              <option>Toutes les familles</option>
              <option>Enseignants</option>
              <option>Parents · 4e A</option>
            </select>
          </label>
          <label>
            Message
            <textarea
              aria-label="Message de l’annonce"
              className="field"
              name="text"
              required
              rows={5}
              placeholder="Rédigez votre annonce…"
            />
          </label>
          <button className="btn dark full" type="submit">
            Enregistrer le brouillon
          </button>
        </form>
      );
    if (kind === "publish-message")
      return (
        <>
          <p>Publier cette annonce dans la maquette ? Aucun e-mail ni SMS ne sera envoyé.</p>
          <button
            className="btn dark full"
            onClick={() => {
              setMessageRows(
                messageRows.map((m) => (m.name === modal.name ? { ...m, status: "Publié" } : m)),
              );
              setModal(null);
              notify("Annonce publiée dans la maquette uniquement.");
            }}
          >
            Confirmer la publication
          </button>
        </>
      );
    if (kind === "read-message") {
      const m = messageRows.find((m) => m.name === modal.name);
      return (
        <>
          <Badge>{m?.target}</Badge>
          <p className="reading-text">{m?.text}</p>
          <small className="muted">{m?.date} · Institution Saint-Exupéry</small>
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
    if (kind === "generic" && module)
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
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
            Saisie de démonstration : utilisez uniquement des données fictives.
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
                  {["6e A", "6e B", "5e B", "4e A", "3e A", "3e B", "Terminale A"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            ) : (
              <FormField
                key={c}
                label={c}
                name={"field" + i}
                value={
                  modal.row?.fields[i] || (current === "students" && i === 2 ? "11/11/2026" : "")
                }
              />
            ),
          )}
          <label>
            Statut
            <select
              name="status"
              className="field"
              defaultValue={modal.row?.status || module.rows[0].status}
            >
              {[
                ...new Set([
                  module.rows[0].status,
                  "Actif",
                  "En attente",
                  "Brouillon",
                  "Validé",
                  "Dossier incomplet",
                ]),
              ].map((s) => (
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
    return null;
  }
}
