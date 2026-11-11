import {
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Wallet,
  MessageSquare,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Download,
  Check,
  Clock,
  ShieldCheck,
  Mail,
  Upload,
  TrendingUp,
  Server,
} from "lucide-react";
import { students } from "../lib/demo-data";
import {
  Avatar,
  Badge,
  Panel,
  Stat,
  downloadCsv,
  PageHead,
  Empty,
  FormField,
  SchoolArt,
} from "../components/scolia-ui";

import type { ScoliaState } from "../hooks/use-scolia-state";
import type { ReactNode } from "react";
export function buildSecondaryViews(ctx: ScoliaState, schedule: () => ReactNode) {
  const {
    profile,
    school,
    setSchool,
    year,
    search,
    setModal,
    customRows,
    setCustomRows,
    filter,
    setFilter,
    paymentRows,
    messageRows,
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
    portalTab,
    setPortalTab,
    setReceipt,
    notify,
    go,
    isFamily,
    setNewProfile,
    allStudentNames,
  } = ctx;
  function payments() {
    const visible = isFamily ? paymentRows.filter((r) => r.name === "Emma Laurent") : paymentRows;
    return (
      <>
        <PageHead
          title={isFamily ? "Mes paiements & reçus" : "Encaissements"}
          subtitle="Des paiements suivis, des familles sereines."
          action={
            !isFamily ? (
              <button
                className="btn dark"
                onClick={() => setModal({ kind: "payment", name: "Enregistrer un paiement" })}
              >
                <Plus size={16} /> Enregistrer un paiement
              </button>
            ) : undefined
          }
        />
        <div className="stats-row three">
          <Stat
            label="Encaissements de démonstration"
            value={
              paymentRows.reduce((a, r) => a + parseFloat(r.fields[2]), 0).toLocaleString("fr-FR") +
              " €"
            }
            delta="Données locales |Aucune transaction réelle"
            icon={Wallet}
          />
          <Stat
            label="Échéance fictive"
            value="15 nov."
            delta="Scolarité de novembre |Année 2026–2027"
            icon={CalendarDays}
            color="amber"
          />
          <Stat
            label="Reçus enregistrés"
            value={String(paymentRows.length)}
            delta="Références locales uniques |Démonstration"
            icon={FileText}
            color="violet"
          />
        </div>
        <Panel
          title="Derniers paiements"
          extra={
            <button
              className="text-link"
              onClick={() =>
                downloadCsv(
                  "encaissements",
                  ["Élève", "Reçu", "Frais", "Mode", "Montant"],
                  visible.map((r) => [r.name, r.sub, ...r.fields]),
                )
              }
            >
              <Download size={15} /> Exporter
            </button>
          }
        >
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Élève / reçu</th>
                  <th>Frais</th>
                  <th>Mode de paiement</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.sub}>
                    <td>
                      <span className="name-cell">
                        <Avatar name={r.name} />
                        <span>
                          <b>{r.name}</b>
                          <small>{r.sub}</small>
                        </span>
                      </span>
                    </td>
                    {r.fields.map((f, i) => (
                      <td key={i}>{f}</td>
                    ))}
                    <td>
                      <Badge>{r.status}</Badge>
                    </td>
                    <td>
                      <button className="text-link" onClick={() => setReceipt(r)}>
                        Voir le reçu <ArrowUpRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="info-line">
          <ShieldCheck size={15} />
          Devise EUR choisie pour la démonstration uniquement. Ce module n’effectue aucun paiement
          réel.
        </div>
      </>
    );
  }

  function messages() {
    return (
      <>
        <PageHead
          title="Communication"
          subtitle="Rapprocher l’école, les équipes et les familles."
          action={
            !isFamily ? (
              <button
                className="btn dark"
                onClick={() => setModal({ kind: "message", name: "Nouvelle annonce" })}
              >
                <Plus size={16} /> Nouvelle annonce
              </button>
            ) : undefined
          }
        />
        <div className="tabs standalone">
          {["Tous", "Publié", "Brouillon"]
            .filter((t) => !isFamily || t !== "Brouillon")
            .map((t) => (
              <button key={t} className={filter === t ? "active" : ""} onClick={() => setFilter(t)}>
                {t === "Tous" ? "Toutes les annonces" : t}
              </button>
            ))}
        </div>
        <div className="message-grid">
          {messageRows
            .filter(
              (m) =>
                (!isFamily || m.status === "Publié") &&
                (filter === "Tous" || m.status === filter) &&
                (m.name + " " + m.text).toLowerCase().includes(search.toLowerCase()),
            )
            .map((m, i) => (
              <Panel key={i}>
                <div className="message-top">
                  <span className={"attention-icon " + (i % 2 ? "violet" : "amber")}>
                    <Mail size={22} />
                  </span>
                  <Badge>{m.status}</Badge>
                </div>
                <small className="eyebrow muted">{m.target}</small>
                <h2>{m.name}</h2>
                <p>{m.text}</p>
                <div className="message-bottom">
                  <span>{m.date}</span>
                  {m.status === "Brouillon" && !isFamily ? (
                    <button
                      className="text-link"
                      onClick={() => setModal({ kind: "publish-message", name: m.name })}
                    >
                      Publier <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button
                      className="text-link"
                      onClick={() => setModal({ kind: "read-message", name: m.name })}
                    >
                      Lire l’annonce <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              </Panel>
            ))}
        </div>
        <div className="info-line">
          <Mail size={15} />
          Annonces de démonstration : pas d’envoi réel d’e-mail ou de SMS.
        </div>
      </>
    );
  }

  function settingsScreen() {
    return (
      <>
        <PageHead
          title="Paramètres de l’établissement"
          subtitle="Une plateforme qui s’adapte à votre école."
        />
        <div className="settings-layout">
          <Panel className="settings-nav">
            {[
              "Identité",
              "Année scolaire",
              "Notation",
              "Notifications",
              "Abonnement",
              "Sécurité",
            ].map((t) => (
              <button
                key={t}
                className={settingsTab === t ? "active" : ""}
                onClick={() => setSettingsTab(t)}
              >
                {t}
                <ChevronRight size={16} />
              </button>
            ))}
          </Panel>
          <Panel title={settingsTab}>
            <form
              className="settings-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                setSettings({ ...settings, ...Object.fromEntries(f) });
                notify("Paramètres enregistrés dans ce navigateur.");
              }}
            >
              {settingsTab === "Identité" ? (
                <>
                  <div className="identity-block">
                    <span className="school-logo">
                      <GraduationCap size={30} />
                    </span>
                    <div>
                      <b>{settings.name}</b>
                      <p>Identité de l’établissement de démonstration</p>
                    </div>
                  </div>
                  <FormField label="Nom de l’établissement" name="name" value={settings.name} />
                  <div className="form-grid">
                    <FormField
                      label="E-mail de contact"
                      name="email"
                      value={settings.email}
                      type="email"
                    />
                    <FormField label="Téléphone" name="phone" value={settings.phone} />
                  </div>
                  <FormField label="Adresse" name="address" value={settings.address} />
                  <div className="form-grid">
                    <label>
                      Langue
                      <select className="field">
                        <option>Français</option>
                        <option>Malagasy (prévu)</option>
                      </select>
                    </label>
                    <label>
                      Devise
                      <select className="field" name="currency" defaultValue={settings.currency}>
                        <option>EUR — Euro</option>
                        <option>MGA — Ariary</option>
                        <option>XOF — Franc CFA</option>
                      </select>
                    </label>
                  </div>
                </>
              ) : settingsTab === "Année scolaire" ? (
                <>
                  <FormField label="Année active" value={year} />
                  <label>
                    Organisation des périodes
                    <select className="field" name="period" defaultValue={settings.period}>
                      <option>Trimestres</option>
                      <option>Semestres</option>
                    </select>
                  </label>
                  <div className="form-grid">
                    <FormField label="Début de l’année" type="date" value="2026-09-01" />
                    <FormField label="Fin de l’année" type="date" value="2027-07-02" />
                  </div>
                  <button type="button" className="text-link" onClick={() => go("years")}>
                    Gérer toutes les périodes <ArrowRight size={15} />
                  </button>
                </>
              ) : settingsTab === "Notation" ? (
                <>
                  <label>
                    Barème de référence
                    <select className="field">
                      <option>Sur 20</option>
                      <option>Sur 100</option>
                    </select>
                  </label>
                  <label>
                    Arrondis
                    <select className="field" name="rounding" defaultValue={settings.rounding}>
                      <option>2 décimales</option>
                      <option>1 décimale</option>
                    </select>
                  </label>
                  <div className="formula">
                    Moyenne = Σ (note normalisée × coefficient) / Σ coefficients
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      aria-label="Exclure les matières dispensées"
                      defaultChecked
                    />{" "}
                    Exclure les matières dispensées du dénominateur
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      aria-label="Bloquer les bulletins incomplets"
                      defaultChecked
                    />{" "}
                    Bloquer les bulletins incomplets
                  </label>
                  <p className="muted">
                    La modification illustre le paramétrage ; elle ne change pas les calculs du
                    prototype.
                  </p>
                </>
              ) : settingsTab === "Notifications" ? (
                <>
                  {[
                    "Notification dans l’application",
                    "Alerte d’absence aux responsables",
                    "Publication des bulletins",
                    "Rappel des échéances",
                  ].map((t) => (
                    <label className="toggle-row" key={t}>
                      {t}
                      <input type="checkbox" aria-label={t} defaultChecked />
                    </label>
                  ))}
                  <p className="muted">
                    Les canaux e-mail et SMS nécessiteront un fournisseur externe. Aucun envoi n’est
                    activé.
                  </p>
                </>
              ) : settingsTab === "Abonnement" ? (
                <>
                  <div className="plan-card">
                    <span className="eyebrow">OFFRE DE DÉMONSTRATION</span>
                    <h2>Professionnel</h2>
                    <p>Tous les modules · 1 500 élèves · 10 Go de stockage</p>
                    <b>
                      149 € <small>/ mois · tarif fictif</small>
                    </b>
                  </div>
                  <p>Prochain renouvellement : 1er décembre 2026</p>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      setNewProfile("Plateforme SaaS");
                      go("subscriptions");
                    }}
                  >
                    Voir la facturation SaaS <ArrowUpRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <div className="info-box">
                    <ShieldCheck size={23} />
                    <p>
                      La maquette illustre les options de sécurité. Aucune authentification,
                      sauvegarde chiffrée ou isolation multi-tenant n’est implémentée.
                    </p>
                  </div>
                  <label className="toggle-row">
                    Authentification renforcée (prévue)
                    <input type="checkbox" aria-label="Authentification renforcée" defaultChecked />
                  </label>
                  <label className="toggle-row">
                    Journalisation des opérations (prévue)
                    <input
                      type="checkbox"
                      aria-label="Journalisation des opérations"
                      defaultChecked
                    />
                  </label>
                  <button type="button" className="text-link" onClick={() => go("permissions")}>
                    Voir les permissions <ArrowRight size={16} />
                  </button>
                </>
              )}
              {settingsTab !== "Abonnement" && (
                <div className="form-bottom">
                  <span className="muted">Configuration locale de démonstration</span>
                  <button className="btn dark" type="submit">
                    <Check size={16} /> Enregistrer
                  </button>
                </div>
              )}
            </form>
          </Panel>
        </div>
      </>
    );
  }

  function imports() {
    return (
      <>
        <PageHead
          title="Imports & exports"
          subtitle="Des données bien préparées, un démarrage serein."
        />
        <div className="report-layout">
          <Panel title="Importer des élèves">
            <p className="muted">
              Import CSV local avec prévalidation, sans insertion serveur. Colonnes : nom ; classe ;
              responsable.
            </p>
            <button
              className="btn secondary"
              onClick={() =>
                downloadCsv(
                  "modele-eleves",
                  ["nom", "classe", "responsable"],
                  [["Alice Exemple", "4e A", "Parent Exemple"]],
                )
              }
            >
              <Download size={16} /> Télécharger le modèle CSV
            </button>
            <label className="upload-zone">
              <Upload size={30} />
              <b>{importFile || "Choisir votre fichier CSV"}</b>
              <span>Fichier UTF-8, séparateur point-virgule · 1 Mo max.</span>
              <input
                aria-label="Importer un fichier CSV"
                type="file"
                accept=".csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImportError("");
                  setImportRows([]);
                  setImportFile(file.name);
                  if (file.size > 1000000) {
                    setImportError("Le fichier dépasse 1 Mo.");
                    return;
                  }
                  const text = await file.text();
                  const lines = text
                    .replace(/^﻿/, "")
                    .trim()
                    .split(/\r?\n/)
                    .map((l) => l.split(";").map((s) => s.replace(/^"|"$/g, "")));
                  if (lines[0]?.join(";").toLowerCase() !== "nom;classe;responsable") {
                    setImportError(
                      "Colonnes attendues : nom;classe;responsable. Utilisez le modèle fourni.",
                    );
                    return;
                  }
                  setImportRows(lines.slice(1));
                }}
              />
            </label>
            {importError && <div className="error-message">{importError}</div>}
            <div className="info-line">
              Les fichiers XLSX ne sont pas traités dans ce prototype.
            </div>
          </Panel>
          <Panel title="Prévalidation">
            <div className="import-preview">
              {!importRows.length ? (
                <Empty
                  title="Votre aperçu apparaîtra ici"
                  text="Importez un fichier pour vérifier chaque ligne avant de confirmer."
                />
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Classe</th>
                        <th>Contrôle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((r, i) => (
                        <tr key={i}>
                          <td>{r[0] || "—"}</td>
                          <td>{r[1] || "—"}</td>
                          <td>
                            <Badge>
                              {r.length === 3 &&
                              r.every(Boolean) &&
                              !allStudentNames().includes(r[0])
                                ? "Valide"
                                : "Rejeté"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    className="btn dark full"
                    onClick={() => {
                      const valid = importRows.filter(
                        (r) =>
                          r.length === 3 && r.every(Boolean) && !allStudentNames().includes(r[0]),
                      );
                      if (!valid.length) {
                        notify("Aucune ligne valide à importer.");
                        return;
                      }
                      setCustomRows({
                        ...customRows,
                        students: [
                          ...(customRows.students || students),
                          ...valid.map((r, i) => ({
                            name: r[0],
                            sub: "IMP-" + Date.now() + "-" + i,
                            fields: [r[1], r[2], "11/11/2026"],
                            status: "Actif",
                          })),
                        ],
                      });
                      setImportRows([]);
                      notify(valid.length + " dossiers importés dans la démonstration locale.");
                      go("students");
                    }}
                  >
                    Confirmer les lignes valides <Check size={16} />
                  </button>
                  <p className="muted small">
                    Rejet : champ manquant, nombre de colonnes incorrect ou nom déjà présent.
                  </p>
                </>
              )}
            </div>
          </Panel>
        </div>
      </>
    );
  }
  function portal() {
    return (
      <>
        <PageHead
          title={profile === "Parent" ? "Bonjour, Sophie." : "Bonjour, Emma."}
          subtitle={
            profile === "Parent"
              ? "Une fenêtre sur la vie scolaire de votre enfant."
              : "Votre journée, vos progrès, votre école."
          }
        />
        <div className="child-banner">
          <Avatar name="Emma Laurent" large />
          <div>
            <span className="eyebrow">{profile === "Parent" ? "MON ENFANT" : "MON PROFIL"}</span>
            <h2>Emma Laurent</h2>
            <p>4e A · Institution Saint-Exupéry · {year}</p>
          </div>
          <Badge>Élève active</Badge>
        </div>
        <div className="tabs standalone">
          {["Synthèse", "Résultats", "Agenda"].map((t) => (
            <button
              className={portalTab === t ? "active" : ""}
              key={t}
              onClick={() => setPortalTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {portalTab === "Résultats" ? (
          <div className="stats-row three">
            <Stat
              label="Moyenne publiée"
              value="16,20 / 20"
              delta="+0,8 point |Premier trimestre"
              icon={TrendingUp}
            />
            <Stat
              label="Mathématiques"
              value="16 / 20"
              delta="Évaluation publiée |09 novembre"
              icon={BookOpen}
            />
            <button className="portal-card" onClick={() => go("reports")}>
              <FileText size={24} />
              <b>Consulter le bulletin</b>
              <span>
                Premier trimestre <ArrowRight size={16} />
              </span>
            </button>
          </div>
        ) : portalTab === "Agenda" ? (
          schedule()
        ) : (
          <>
            <div className="stats-row three">
              <Stat
                label="Moyenne publiée"
                value="16,20 / 20"
                delta="+0,8 point |Premier trimestre"
                icon={TrendingUp}
              />
              <Stat
                label="Assiduité"
                value="98 %"
                delta="1 absence justifiée |Cette période"
                icon={ClipboardCheck}
              />
              <button
                className="portal-card"
                onClick={() => go(profile === "Parent" ? "payments" : "lessons")}
              >
                <Wallet size={24} />
                <b>{profile === "Parent" ? "Scolarité de novembre" : "Mes devoirs"}</b>
                <span>
                  {profile === "Parent" ? "Reçu disponible" : "2 travaux à préparer"}{" "}
                  <ArrowRight size={16} />
                </span>
              </button>
            </div>
            <div className="dashboard-grid">
              <Panel
                title="Les prochains cours"
                extra={
                  <button className="text-link" onClick={() => go("schedule")}>
                    Planning <ArrowUpRight size={14} />
                  </button>
                }
              >
                {[
                  ["08:00", "Mathématiques", "Équations · Marie Lefèvre"],
                  ["09:00", "Français", "Lecture suivie · Paul Durand"],
                  ["10:00", "Histoire-géographie", "La révolution industrielle · Sarah Ravel"],
                ].map(([t, s, n]) => (
                  <div className="course-list" key={t}>
                    <span>{t}</span>
                    <div>
                      <b>{s}</b>
                      <small>{n}</small>
                    </div>
                    <span className="class-tag">Salle 202</span>
                  </div>
                ))}
              </Panel>
              <Panel title="L’école vous informe">
                <div className="family-news">
                  <span className="attention-icon amber">
                    <MessageSquare size={22} />
                  </span>
                  <h3>Rencontre parents-professeurs</h3>
                  <p>Samedi 21 novembre, de 9 h à 12 h. Un moment pour échanger ensemble.</p>
                  <button className="text-link" onClick={() => go("messages")}>
                    Lire les annonces <ArrowRight size={15} />
                  </button>
                </div>
              </Panel>
            </div>
          </>
        )}
        <div className="info-line">
          <ShieldCheck size={15} />
          Emma est le seul dossier associé au portail fictif. Ce filtrage visuel n’est pas une
          protection serveur.
        </div>
      </>
    );
  }

  function health() {
    return (
      <>
        <PageHead
          title="État des services"
          subtitle="Une vue illustrative de l’exploitation et de la continuité."
        />
        <div className="info-box">
          <Server size={24} />
          <p>
            Données fictives : aucun monitoring, sauvegarde ou test de restauration réel n’est
            connecté.
          </p>
        </div>
        <div className="stats-row three">
          <Stat
            label="Disponibilité fictive"
            value="99,9 %"
            delta="30 derniers jours |Illustration"
            icon={Server}
          />
          <Stat
            label="Sauvegarde illustrée"
            value="03:00"
            delta="11 novembre |État de démonstration"
            icon={ShieldCheck}
          />
          <Stat
            label="Temps de réponse fictif"
            value="124 ms"
            delta="API · moyenne |Illustration"
            icon={Clock}
          />
        </div>
        <Panel title="Services de la plateforme">
          {[
            "Application Web",
            "API métier (à développer)",
            "Stockage documentaire (à connecter)",
            "File de traitement (à développer)",
            "Sauvegardes (à configurer)",
          ].map((s) => (
            <div className="toggle-row" key={s}>
              <span>{s}</span>
              <Badge>{s === "Application Web" ? "Disponible" : "Prévu"}</Badge>
            </div>
          ))}
        </Panel>
      </>
    );
  }

  function login() {
    return (
      <div className="login-layout">
        <div className="login-editorial">
          <span className="brand">
            <GraduationCap />
            scolia<span>.</span>
          </span>
          <h1>
            Une école qui avance.
            <br />
            Ensemble.
          </h1>
          <p>Un espace pour apprendre, accompagner et grandir.</p>
          <SchoolArt />
        </div>
        <Panel>
          <div className="eyebrow">BIENVENUE DANS VOTRE ESPACE</div>
          <h2>Se connecter</h2>
          <p className="muted">Page de connexion illustrative, sans authentification réelle.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              go("dashboard");
              notify("Espace de démonstration ouvert — aucune authentification réelle.");
            }}
          >
            <label>
              Établissement
              <select className="field" value={school} onChange={(e) => setSchool(e.target.value)}>
                <option>Institution Saint-Exupéry</option>
                <option>Collège Les Horizons</option>
              </select>
            </label>
            <FormField label="Adresse e-mail" type="email" value="direction@example.com" />
            <FormField label="Mot de passe fictif" type="password" value="demo-scolia" />
            <button className="btn dark full" type="submit">
              Ouvrir la démonstration <ArrowRight size={16} />
            </button>
          </form>
          <button
            className="text-link"
            onClick={() => setModal({ kind: "reset", name: "Réinitialisation du mot de passe" })}
          >
            Mot de passe oublié ?
          </button>
        </Panel>
      </div>
    );
  }

  return { payments, messages, settingsScreen, imports, portal, health, login };
}
