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
  Printer,
  Clock,
  ShieldCheck,
  Mail,
  Upload,
  TrendingUp,
  Server,
  AlertCircle,
} from "lucide-react";
import { formatMoney } from "../lib/finance";
import {
  DOCUMENT_KIND_LABELS,
  fetchAdministrativeDocument,
  type AdministrativeDocumentKind,
} from "../lib/documents";
import { renderAdministrativeDocumentHtml } from "../lib/document-print";
import { LESSON_STATUSES, type LessonStatus } from "../lib/lessons";
import { EXAM_STATUSES, EXAM_TYPES, type ExamInput } from "../lib/exams";
import { exportExamsCsv, exportFinanceInvoicesCsv, exportFinancePaymentsCsv } from "../lib/exports";
import {
  Avatar,
  Badge,
  Panel,
  Stat,
  downloadCsv,
  downloadCsvContent,
  PageHead,
  Empty,
  FormField,
  SchoolArt,
} from "../components/scolia-ui";

import type { ScoliaState } from "../hooks/use-scolia-state";
import { useState, type ReactNode } from "react";
export function buildSecondaryViews(ctx: ScoliaState, schedule: () => ReactNode) {
  const {
    profile,
    school,
    setSchool,
    year,
    search,
    setSearch,
    setModal,
    filter,
    setFilter,
    financeSnapshot,
    financeLoading,
    financeError,
    cancelFinancePayment,
    communicationSnapshot,
    communicationLoading,
    communicationError,
    archiveAnnouncement,
    administrativeDocumentsSnapshot,
    administrativeDocumentsLoading,
    administrativeDocumentsError,
    generateAdministrativeDocument,
    validateAdministrativeDocument,
    cancelAdministrativeDocument,
    classList,
    pedagogieSnapshot,
    attendanceSnapshot,
    studentsData,
    canManage,
    settings,
    setSettings,
    saveSettings,
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
    lessonsSnapshot,
    lessonsLoading,
    lessonsError,
    createLesson,
    updateLesson,
    removeLesson,
    examsSnapshot,
    examsLoading,
    examsError,
    createExam,
    updateExam,
    removeExam,
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
    const canWrite = (canManage || profile === "Comptable") && !isFamily;
    const stats = financeSnapshot?.stats ?? {
      invoiced: 0,
      collected: 0,
      outstanding: 0,
      todayCollected: 0,
      receiptCount: 0,
      invoiceCount: 0,
      cashClosedToday: false,
    };
    const visible = (financeSnapshot?.payments ?? []).filter((payment) =>
      `${payment.studentName} ${payment.receiptNumber} ${payment.invoiceLabel} ${payment.method}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    const openReceipt = (payment: (typeof visible)[number]) =>
      setReceipt({
        name: payment.studentName,
        sub: payment.receiptNumber,
        fields: [
          payment.invoiceLabel,
          payment.method,
          formatMoney(payment.amountCents),
          payment.paidAt,
          payment.status,
        ],
        status: payment.status,
      });
    const cancel = async (payment: (typeof visible)[number]) => {
      const reason = window.prompt(
        `Motif d’annulation du reçu ${payment.receiptNumber} ?`,
      );
      if (!reason?.trim()) return;
      try {
        await cancelFinancePayment(payment.id, reason.trim());
        notify(`Reçu ${payment.receiptNumber} annulé et solde recalculé.`);
      } catch (error) {
        notify(error instanceof Error ? error.message : "Annulation impossible.");
      }
    };
    if (financeLoading) {
      return (
        <>
          <PageHead
            title={isFamily ? "Mes paiements & reçus" : "Encaissements"}
            subtitle="Des paiements suivis, des familles sereines."
          />
          <Panel>
            <Empty title="Chargement des encaissements" text="Récupération des paiements réels." />
          </Panel>
        </>
      );
    }
    return (
      <>
        <PageHead
          title={isFamily ? "Mes paiements & reçus" : "Encaissements"}
          subtitle="Des paiements suivis, des familles sereines."
          action={
            canWrite ? (
              <button
                className="btn dark"
                onClick={() => setModal({ kind: "payment", name: "Enregistrer un paiement" })}
              >
                <Plus size={16} /> Enregistrer un paiement
              </button>
            ) : undefined
          }
        />
        {financeError ? (
          <div className="info-line">
            <AlertCircle size={15} /> {financeError}
          </div>
        ) : null}
        <div className="stats-row three">
          <Stat
            label="Total encaissé"
            value={formatMoney(stats.collected)}
            delta={`${stats.receiptCount} reçu(s) validé(s)`}
            icon={Wallet}
          />
          <Stat
            label="Encaissé aujourd’hui"
            value={formatMoney(stats.todayCollected)}
            delta={stats.cashClosedToday ? "Caisse clôturée" : "Caisse ouverte"}
            icon={CalendarDays}
            color="amber"
          />
          <Stat
            label="Solde restant dû"
            value={formatMoney(stats.outstanding)}
            delta={`${stats.invoiceCount} frais actif(s)`}
            icon={FileText}
            color="violet"
          />
        </div>
        <Panel
          title="Derniers paiements"
          extra={
            <button
              className="text-link"
              onClick={async () => {
                try {
                  const result = await exportFinancePaymentsCsv();
                  downloadCsvContent(result.filename, result.content);
                  notify(`Export CSV des paiements téléchargé (${result.count} ligne(s)).`);
                } catch {
                  downloadCsv(
                    "encaissements",
                    ["Élève", "Reçu", "Frais", "Mode", "Montant", "Date", "Statut"],
                    visible.map((payment) => [
                      payment.studentName,
                      payment.receiptNumber,
                      payment.invoiceLabel,
                      payment.method,
                      formatMoney(payment.amountCents),
                      payment.paidAt,
                      payment.status,
                    ]),
                  );
                  notify("Export CSV téléchargé.");
                }
              }}
            >
              <Download size={15} /> Exporter
            </button>
          }
        >
          <div className="table-search">
            <FileText size={16} />
            <input
              aria-label="Rechercher un encaissement"
              placeholder="Rechercher un élève, un reçu ou un frais…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Élève / reçu</th>
                  <th>Frais</th>
                  <th>Mode de paiement</th>
                  <th>Montant</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.length ? (
                  visible.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <span className="name-cell">
                          <Avatar name={payment.studentName} />
                          <span>
                            <b>{payment.studentName}</b>
                            <small>
                              {payment.receiptNumber} · {payment.className || "Classe non renseignée"}
                            </small>
                          </span>
                        </span>
                      </td>
                      <td>{payment.invoiceLabel || "—"}</td>
                      <td>{payment.method}</td>
                      <td>{formatMoney(payment.amountCents)}</td>
                      <td>{payment.paidAt}</td>
                      <td>
                        <Badge>{payment.status}</Badge>
                      </td>
                      <td>
                        <div className="button-group">
                          <button className="text-link" onClick={() => openReceipt(payment)}>
                            Voir le reçu <ArrowUpRight size={15} />
                          </button>
                          {canManage && payment.status === "Validé" ? (
                            <button className="text-link danger" onClick={() => cancel(payment)}>
                              Annuler
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <span className="muted">Aucun paiement enregistré.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="info-line">
          <ShieldCheck size={15} />
          Les paiements et reçus sont enregistrés dans la base. Aucun transfert bancaire n’est
          déclenché depuis cette interface.
        </div>
      </>
    );
  }

  function fees() {
    const canWrite = (canManage || profile === "Comptable") && !isFamily;
    const stats = financeSnapshot?.stats ?? {
      invoiced: 0,
      collected: 0,
      outstanding: 0,
      todayCollected: 0,
      receiptCount: 0,
      invoiceCount: 0,
      cashClosedToday: false,
    };
    const invoices = (financeSnapshot?.invoices ?? []).filter((invoice) =>
      `${invoice.studentName} ${invoice.label} ${invoice.className}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    return (
      <>
        <PageHead
          title={isFamily ? "Mes frais scolaires" : "Frais & échéances"}
          subtitle="Des tarifs clairs et des échéanciers adaptés aux familles."
          action={
            canWrite ? (
              <button
                className="btn dark"
                onClick={() => setModal({ kind: "invoice", name: "Créer des frais" })}
              >
                <Plus size={16} /> Créer des frais
              </button>
            ) : undefined
          }
        />
        {financeError ? (
          <div className="info-line">
            <AlertCircle size={15} /> {financeError}
          </div>
        ) : null}
        <div className="stats-row three">
          <Stat
            label="Frais facturés"
            value={formatMoney(stats.invoiced)}
            delta={`${stats.invoiceCount} frais actif(s)`}
            icon={FileText}
          />
          <Stat
            label="Encaissé"
            value={formatMoney(stats.collected)}
            delta="Paiements validés"
            icon={Wallet}
          />
          <Stat
            label="Reste à recouvrer"
            value={formatMoney(stats.outstanding)}
            delta="Solde des frais actifs"
            icon={CalendarDays}
            color="amber"
          />
        </div>
        <Panel
          title="Frais et échéances"
          extra={
            <button
              className="text-link"
              onClick={async () => {
                try {
                  const result = await exportFinanceInvoicesCsv();
                  downloadCsvContent(result.filename, result.content);
                  notify(`Export CSV des frais téléchargé (${result.count} ligne(s)).`);
                } catch {
                  downloadCsv(
                    "frais-echeances",
                    ["Élève", "Frais", "Montant", "Payé", "Solde", "Échéance", "Statut"],
                    invoices.map((invoice) => [
                      invoice.studentName,
                      invoice.label,
                      formatMoney(invoice.amountCents),
                      formatMoney(invoice.paidCents),
                      formatMoney(invoice.balanceCents),
                      invoice.dueDate,
                      invoice.status,
                    ]),
                  );
                  notify("Export CSV téléchargé.");
                }
              }}
            >
              <Download size={15} /> Exporter
            </button>
          }
        >
          <div className="table-search">
            <FileText size={16} />
            <input
              aria-label="Rechercher des frais"
              placeholder="Rechercher un élève ou un frais…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Frais</th>
                  <th>Montant</th>
                  <th>Payé</th>
                  <th>Solde</th>
                  <th>Échéance</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length ? (
                  invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <span className="name-cell">
                          <Avatar name={invoice.studentName} />
                          <span>
                            <b>{invoice.studentName}</b>
                            <small>{invoice.className || "Classe non renseignée"}</small>
                          </span>
                        </span>
                      </td>
                      <td>{invoice.label}</td>
                      <td>{formatMoney(invoice.amountCents)}</td>
                      <td>{formatMoney(invoice.paidCents)}</td>
                      <td>{formatMoney(invoice.balanceCents)}</td>
                      <td>{invoice.dueDate}</td>
                      <td>
                        <Badge>{invoice.status}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <span className="muted">Aucun frais enregistré.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="info-line">
          <ShieldCheck size={15} />
          {isFamily
            ? "Vous consultez uniquement les frais et paiements de vos enfants."
            : "Les frais, encaissements et soldes sont conservés dans la base de l’établissement."}
        </div>
      </>
    );
  }

  function cash() {
    const canWrite = canManage || profile === "Comptable";
    const today = new Date().toISOString().slice(0, 10);
    const todayPayments = (financeSnapshot?.payments ?? []).filter(
      (payment) => payment.paidAt === today && payment.status === "Validé",
    );
    const closures = financeSnapshot?.closures ?? [];
    const todayTotal = todayPayments.reduce((sum, payment) => sum + payment.amountCents, 0);
    const closedToday = closures.some((closure) => closure.date === today);
    return (
      <>
        <PageHead
          title="Journal de caisse"
          subtitle="Contrôler les encaissements du jour et clôturer la caisse."
          action={
            canWrite && !closedToday ? (
              <button
                className="btn dark"
                onClick={() => setModal({ kind: "cash-close", name: "Clôturer la caisse" })}
              >
                <Check size={16} /> Clôturer la caisse
              </button>
            ) : undefined
          }
        />
        {financeError ? (
          <div className="info-line">
            <AlertCircle size={15} /> {financeError}
          </div>
        ) : null}
        <div className="stats-row three">
          <Stat
            label="Encaissé aujourd’hui"
            value={formatMoney(todayTotal)}
            delta={closedToday ? "Caisse clôturée" : "Clôture en attente"}
            icon={Wallet}
          />
          <Stat
            label="Reçus du jour"
            value={String(todayPayments.length)}
            delta="Paiements validés"
            icon={FileText}
            color="violet"
          />
          <Stat
            label="Clôtures enregistrées"
            value={String(closures.length)}
            delta="Historique de caisse"
            icon={Clock}
            color="amber"
          />
        </div>
        <Panel title="Encaissements du jour">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Reçu</th>
                  <th>Élève</th>
                  <th>Frais</th>
                  <th>Mode</th>
                  <th>Montant</th>
                  <th>Encaissé par</th>
                </tr>
              </thead>
              <tbody>
                {todayPayments.length ? (
                  todayPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.receiptNumber}</td>
                      <td>{payment.studentName}</td>
                      <td>{payment.invoiceLabel}</td>
                      <td>{payment.method}</td>
                      <td>{formatMoney(payment.amountCents)}</td>
                      <td>{payment.receivedByName || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <span className="muted">Aucun encaissement aujourd’hui.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Historique des clôtures">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Reçus</th>
                  <th>Clôturée par</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {closures.length ? (
                  closures.map((closure) => (
                    <tr key={closure.id}>
                      <td>{closure.date}</td>
                      <td>{formatMoney(closure.totalCents)}</td>
                      <td>{closure.paymentCount}</td>
                      <td>{closure.closedByName || "—"}</td>
                      <td>{closure.note || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <span className="muted">Aucune clôture enregistrée.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="info-line">
          <ShieldCheck size={15} />
          Une clôture agrège les paiements validés du jour ; les annulations restent tracées dans
          le journal et ne sont pas comptées.
        </div>
      </>
    );
  }

  function messages() {
    const canWrite = canManage && !isFamily;
    const items = (communicationSnapshot?.announcements ?? []).filter(
      (announcement) =>
        (filter === "Tous" || announcement.status === filter) &&
        `${announcement.title} ${announcement.body} ${announcement.audience}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
    const asRow = (announcement: (typeof items)[number]) => ({
      name: announcement.title,
      sub: announcement.id,
      fields: [
        announcement.body,
        announcement.audience,
        announcement.className,
        announcement.createdByName,
        announcement.publishedAt || announcement.createdAt,
      ],
      status: announcement.status,
    });
    const archive = async (announcement: (typeof items)[number]) => {
      try {
        await archiveAnnouncement(announcement.id);
        notify("Annonce archivée.");
      } catch (error) {
        notify(error instanceof Error ? error.message : "Archivage impossible.");
      }
    };
    if (communicationLoading) {
      return (
        <>
          <PageHead
            title="Communication"
            subtitle="Rapprocher l’école, les équipes et les familles."
          />
          <Panel>
            <Empty title="Chargement des annonces" text="Récupération des annonces réelles." />
          </Panel>
        </>
      );
    }
    return (
      <>
        <PageHead
          title="Communication"
          subtitle="Rapprocher l’école, les équipes et les familles."
          action={
            canWrite ? (
              <button
                className="btn dark"
                onClick={() => setModal({ kind: "message", name: "Nouvelle annonce" })}
              >
                <Plus size={16} /> Nouvelle annonce
              </button>
            ) : undefined
          }
        />
        {communicationError ? (
          <div className="info-line">
            <AlertCircle size={15} /> {communicationError}
          </div>
        ) : null}
        <div className="tabs standalone">
          {["Tous", "Publié", "Brouillon", "Archivé"]
            .filter((tab) => canWrite || tab === "Tous" || tab === "Publié")
            .map((tab) => (
              <button
                key={tab}
                className={filter === tab ? "active" : ""}
                onClick={() => setFilter(tab)}
              >
                {tab === "Tous" ? "Toutes les annonces" : tab}
              </button>
            ))}
        </div>
        <div className="message-grid">
          {items.length ? (
            items.map((announcement, index) => (
              <Panel key={announcement.id}>
                <div className="message-top">
                  <span className={"attention-icon " + (index % 2 ? "violet" : "amber")}>
                    <Mail size={22} />
                  </span>
                  <Badge>{announcement.status}</Badge>
                </div>
                <small className="eyebrow muted">
                  {announcement.audience}
                  {announcement.className ? ` · ${announcement.className}` : ""}
                </small>
                <h2>{announcement.title}</h2>
                <p>{announcement.body}</p>
                <div className="message-bottom">
                  <span>
                    {new Date(
                      announcement.publishedAt || announcement.createdAt,
                    ).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <div className="button-group">
                    {announcement.status === "Brouillon" && canWrite ? (
                      <button
                        className="text-link"
                        onClick={() =>
                          setModal({
                            kind: "publish-message",
                            name: announcement.title,
                            row: asRow(announcement),
                          })
                        }
                      >
                        Publier <ArrowRight size={15} />
                      </button>
                    ) : (
                      <button
                        className="text-link"
                        onClick={() =>
                          setModal({
                            kind: "read-message",
                            name: announcement.title,
                            row: asRow(announcement),
                          })
                        }
                      >
                        Lire l’annonce <ArrowRight size={15} />
                      </button>
                    )}
                    {canWrite && announcement.status === "Publié" ? (
                      <button className="text-link danger" onClick={() => archive(announcement)}>
                        Archiver
                      </button>
                    ) : null}
                  </div>
                </div>
              </Panel>
            ))
          ) : (
            <Panel>
              <Empty
                title="Aucune annonce"
                text={
                  canWrite
                    ? "Créez une annonce puis publiez-la pour la rendre visible."
                    : "Aucune annonce publiée pour votre profil pour le moment."
                }
              />
            </Panel>
          )}
        </div>
        <div className="info-line">
          <Mail size={15} />
          Les annonces publiées sont visibles dans les espaces autorisés. Aucun e-mail ou SMS
          n’est envoyé automatiquement.
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
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const values = { ...settings, ...Object.fromEntries(f) } as Record<string, string>;
                setSettings(values as typeof settings);
                try {
                  await saveSettings(values);
                  notify("Paramètres enregistrés dans la base de l’établissement.");
                } catch (error) {
                  notify(
                    error instanceof Error ? error.message : "Enregistrement des paramètres impossible.",
                  );
                }
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

  function lessonsScreen() {
    const canWrite = (canManage || profile === "Enseignant") && !isFamily;
    const lessons = lessonsSnapshot?.lessons ?? [];
    const classOptions = lessonsSnapshot?.classes ?? [];
    const subjectOptions = lessonsSnapshot?.subjects ?? [];
    const dateLabel = (value: string) => {
      if (!value) return "—";
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
    };
    const timeLabel = (lesson: (typeof lessons)[number]) =>
      [lesson.startTime, lesson.endTime].filter(Boolean).join(" – ") || "—";

    function readLessonForm(form: HTMLFormElement) {
      const data = new FormData(form);
      return {
        classId: String(data.get("classId") ?? ""),
        subjectId: String(data.get("subjectId") ?? ""),
        teacherName: String(data.get("teacherName") ?? ""),
        date: String(data.get("date") ?? ""),
        startTime: String(data.get("startTime") ?? ""),
        endTime: String(data.get("endTime") ?? ""),
        title: String(data.get("title") ?? ""),
        content: String(data.get("content") ?? ""),
        homework: String(data.get("homework") ?? ""),
        status: String(data.get("status") ?? "Planifié") as LessonStatus,
      };
    }

    const lessonFormFields = (lesson?: (typeof lessons)[number]) => (
      <>
        <FormField label="Classe">
          <select name="classId" defaultValue={lesson?.classId ?? ""} required>
            <option value="">— Sélectionner une classe —</option>
            {classOptions.map((classe) => (
              <option key={classe.id} value={classe.id}>
                {classe.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Matière">
          <select name="subjectId" defaultValue={lesson?.subjectId ?? ""}>
            <option value="">— Optionnelle —</option>
            {subjectOptions.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Enseignant">
          <input name="teacherName" defaultValue={lesson?.teacherName ?? ""} placeholder="Nom" />
        </FormField>
        <FormField label="Date">
          <input type="date" name="date" defaultValue={lesson?.date ?? ""} />
        </FormField>
        <FormField label="Début">
          <input type="time" name="startTime" defaultValue={lesson?.startTime ?? ""} />
        </FormField>
        <FormField label="Fin">
          <input type="time" name="endTime" defaultValue={lesson?.endTime ?? ""} />
        </FormField>
        <FormField label="Titre de la séance">
          <input
            name="title"
            defaultValue={lesson?.title ?? ""}
            placeholder="Ex. Les équations du premier degré"
            required
          />
        </FormField>
        <FormField label="Contenu du cours">
          <textarea
            name="content"
            rows={3}
            defaultValue={lesson?.content ?? ""}
            placeholder="Notions abordées, activités…"
          />
        </FormField>
        <FormField label="Devoirs">
          <textarea
            name="homework"
            rows={2}
            defaultValue={lesson?.homework ?? ""}
            placeholder="Travail à faire pour la prochaine séance"
          />
        </FormField>
        <FormField label="Statut">
          <select name="status" defaultValue={lesson?.status ?? "Planifié"}>
            {LESSON_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FormField>
      </>
    );

    return (
      <>
        <PageHead
          title="Cahier de textes"
          subtitle="Suivez les séances réalisées, les contenus abordés et les devoirs donnés."
        />
        {lessonsError ? <div className="error-message">{lessonsError}</div> : null}
        <div className="report-layout">
          {canWrite ? (
            <Panel title="Ajouter une séance">
              <form
                className="settings-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const formElement = event.currentTarget;
                  const values = readLessonForm(formElement);
                  if (!values.classId) {
                    notify("Sélectionnez une classe.");
                    return;
                  }
                  try {
                    await createLesson(values);
                    notify("Séance ajoutée au cahier de textes.");
                    formElement.reset();
                  } catch (error) {
                    notify(error instanceof Error ? error.message : "Ajout impossible.");
                  }
                }}
              >
                {lessonFormFields()}
                <button className="btn dark" type="submit">
                  <Plus size={16} /> Ajouter la séance
                </button>
              </form>
            </Panel>
          ) : null}
          <Panel title={`Séances${lessons.length ? ` (${lessons.length})` : ""}`}>
            {lessonsLoading ? <p className="muted">Chargement du cahier de textes…</p> : null}
            {!lessonsLoading && lessons.length === 0 ? (
              <Empty
                title="Aucune séance"
                text={
                  canWrite
                    ? "Ajoutez une première séance pour tenir le cahier de textes."
                    : "Aucune séance publiée pour votre classe."
                }
              />
            ) : null}
            <div className="lesson-list">
              {lessons.map((lesson) => (
                <details className="lesson-item" key={lesson.id}>
                  <summary>
                    <span>
                      <b>{lesson.title}</b>
                      <small>
                        {dateLabel(lesson.date)} · {timeLabel(lesson)} · {lesson.className}
                        {lesson.subjectName ? ` · ${lesson.subjectName}` : ""}
                        {lesson.teacherName ? ` · ${lesson.teacherName}` : ""}
                      </small>
                    </span>
                    <Badge value={lesson.status} />
                  </summary>
                  <div className="lesson-body">
                    {lesson.content ? (
                      <p>
                        <strong>Cours :</strong> {lesson.content}
                      </p>
                    ) : null}
                    {lesson.homework ? (
                      <p>
                        <strong>Devoirs :</strong> {lesson.homework}
                      </p>
                    ) : null}
                    {!lesson.content && !lesson.homework ? (
                      <p className="muted">Aucun contenu renseigné.</p>
                    ) : null}
                    {canWrite ? (
                      <>
                        <form
                          className="settings-form"
                          onSubmit={async (event) => {
                            event.preventDefault();
                            const formElement = event.currentTarget;
                            const values = readLessonForm(formElement);
                            try {
                              await updateLesson({ id: lesson.id, ...values });
                              notify("Séance mise à jour.");
                            } catch (error) {
                              notify(
                                error instanceof Error ? error.message : "Mise à jour impossible.",
                              );
                            }
                          }}
                        >
                          {lessonFormFields(lesson)}
                          <button className="btn dark" type="submit">
                            <Check size={16} /> Enregistrer
                          </button>
                        </form>
                        <button
                          className="text-link danger"
                          onClick={async () => {
                            if (!window.confirm(`Supprimer la séance « ${lesson.title} » ?`)) return;
                            try {
                              await removeLesson(lesson.id);
                              notify("Séance supprimée.");
                            } catch (error) {
                              notify(
                                error instanceof Error ? error.message : "Suppression impossible.",
                              );
                            }
                          }}
                        >
                          Supprimer la séance
                        </button>
                      </>
                    ) : null}
                  </div>
                </details>
              ))}
            </div>
          </Panel>
        </div>
      </>
    );
  }

  function documentsScreen() {
    const canWrite = canManage && !isFamily;
    const documents = administrativeDocumentsSnapshot?.documents ?? [];
    const activeStudents = studentsData.filter(
      (student) => !["Archivé", "Transféré", "Sorti", "Désinscrit"].includes(student.status),
    );
    const dateLabel = (value: string | number | Date) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("fr-FR");
    };

    async function printDocument(id: string) {
      const preview = window.open("", "_blank", "width=920,height=760");
      try {
        const document = await fetchAdministrativeDocument(id);
        const html = renderAdministrativeDocumentHtml(document);
        if (preview) {
          preview.document.open();
          preview.document.write(html);
          preview.document.close();
          window.setTimeout(() => {
            preview.focus();
            preview.print();
          }, 350);
          return;
        }
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${document.reference}.html`;
        link.click();
        URL.revokeObjectURL(url);
        notify("Document téléchargé. Ouvrez-le pour l'imprimer ou l'enregistrer en PDF.");
      } catch (error) {
        preview?.close();
        notify(error instanceof Error ? error.message : "Document indisponible.");
      }
    }

    return (
      <>
        <PageHead
          title="Documents & éditions"
          subtitle="Générez, numérotez et validez les documents administratifs officiels."
        />
        {administrativeDocumentsError ? (
          <div className="error-message">{administrativeDocumentsError}</div>
        ) : null}
        <div className="report-layout">
          <Panel title="Générer un document">
            <p className="muted">
              Les données sont figées à la génération et la référence est numérotée par
              établissement. Validez le brouillon avant remise au destinataire.
            </p>
            {canWrite ? (
              <form
                className="settings-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const formElement = event.currentTarget;
                  const form = new FormData(formElement);
                  const kind = String(form.get("kind") ?? "certificate") as AdministrativeDocumentKind;
                  const studentId = String(form.get("studentId") ?? "");
                  const classId = String(form.get("classId") ?? "");
                  if (kind === "class_list" && !classId) {
                    notify("Sélectionnez une classe pour éditer la liste.");
                    return;
                  }
                  if (kind !== "class_list" && !studentId) {
                    notify("Sélectionnez un élève pour ce document.");
                    return;
                  }
                  try {
                    const result = await generateAdministrativeDocument({
                      kind,
                      studentId,
                      classId,
                    });
                    notify(`Document ${result.reference} généré en brouillon.`);
                    formElement.reset();
                  } catch (error) {
                    notify(
                      error instanceof Error ? error.message : "Génération impossible.",
                    );
                  }
                }}
              >
                <FormField label="Type de document">
                  <select name="kind" defaultValue="certificate">
                    {(
                      Object.entries(DOCUMENT_KIND_LABELS) as Array<
                        [AdministrativeDocumentKind, string]
                      >
                    ).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Élève (certificat et attestation)">
                  <select name="studentId" defaultValue="">
                    <option value="">— Sélectionner un élève —</option>
                    {activeStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} — {student.reference}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Classe (liste de classe)">
                  <select name="classId" defaultValue="">
                    <option value="">— Sélectionner une classe —</option>
                    {classList.map((classe) => (
                      <option key={classe.id} value={classe.id}>
                        {classe.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <button className="btn dark full" type="submit">
                  <Plus size={16} /> Générer le document
                </button>
              </form>
            ) : (
              <div className="info-box">
                <ShieldCheck size={22} />
                <p>
                  Seules la direction et l'administration peuvent générer ou valider un document.
                  Vous pouvez consulter les documents existants.
                </p>
              </div>
            )}
          </Panel>
          <Panel title="Documents générés">
            <div className="summary-strip">
              <span>
                <b>{documents.length}</b> document(s)
              </span>
              <span>
                <i className="green-dot" />
                {documents.filter((document) => document.status === "Validé").length} validé(s)
              </span>
              <span>
                <Clock size={14} /> Numérotation par établissement
              </span>
            </div>
            {administrativeDocumentsLoading ? (
              <Empty title="Chargement des documents" text="Récupération des documents réels." />
            ) : documents.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Document</th>
                      <th>Destinataire</th>
                      <th>Créé le</th>
                      <th>Statut</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((document) => (
                      <tr key={document.id}>
                        <td>
                          <b>{document.reference}</b>
                        </td>
                        <td>
                          <FileText size={15} /> {document.title}
                        </td>
                        <td>{document.recipient || "—"}</td>
                        <td>{dateLabel(document.createdAt)}</td>
                        <td>
                          <Badge>{document.status}</Badge>
                        </td>
                        <td>
                          <div className="row-actions">
                            {canWrite && document.status === "Brouillon" ? (
                              <button
                                className="text-link"
                                onClick={async () => {
                                  try {
                                    await validateAdministrativeDocument(document.id);
                                    notify(`${document.reference} validé.`);
                                  } catch (error) {
                                    notify(
                                      error instanceof Error
                                        ? error.message
                                        : "Validation impossible.",
                                    );
                                  }
                                }}
                              >
                                Valider
                              </button>
                            ) : null}
                            {document.status !== "Annulé" ? (
                              <button
                                className="icon-btn"
                                aria-label={`Imprimer ${document.reference}`}
                                title="Imprimer ou enregistrer en PDF"
                                onClick={() => void printDocument(document.id)}
                              >
                                <Printer size={16} />
                              </button>
                            ) : null}
                            {canWrite && document.status !== "Annulé" ? (
                              <button
                                className="text-link danger"
                                onClick={async () => {
                                  const reason = window.prompt(
                                    `Motif d'annulation de ${document.reference} :`,
                                  );
                                  if (!reason?.trim()) return;
                                  try {
                                    await cancelAdministrativeDocument(
                                      document.id,
                                      reason.trim(),
                                    );
                                    notify(`${document.reference} annulé.`);
                                  } catch (error) {
                                    notify(
                                      error instanceof Error
                                        ? error.message
                                        : "Annulation impossible.",
                                    );
                                  }
                                }}
                              >
                                Annuler
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="Aucun document généré"
                text="Générez un premier certificat, une attestation ou une liste de classe."
              />
            )}
            <p className="muted small">
              Les brouillons portent un filigrane « non officiel ». Une annulation conserve la
              référence et laisse une trace dans le journal d'audit.
            </p>
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
              Import CSV avec prévalidation et insertion réelle côté serveur. Colonnes : nom ;
              classe ; responsable.
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
                  setImportResult(null);
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
            {importResult ? (
              <div className="info-box">
                <Check size={20} />
                <p>
                  {importResult.imported.length} élève(s) importé(s).
                  {importResult.errors.length
                    ? ` ${importResult.errors.length} ligne(s) rejetée(s) par le serveur.`
                    : " Toutes les lignes ont été acceptées."}
                </p>
              </div>
            ) : null}
            {importResult?.errors.length ? (
              <div className="error-message">
                {importResult.errors
                  .slice(0, 6)
                  .map((error) => `Ligne ${error.row} : ${error.message}`)
                  .join(" · ")}
              </div>
            ) : null}
            <div className="info-line">
              Les fichiers XLSX ne sont pas traités ; utilisez un CSV UTF-8.
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
                    disabled={importBusy}
                    onClick={async () => {
                      const valid = importRows.filter(
                        (r) =>
                          r.length === 3 && r.every(Boolean) && !allStudentNames().includes(r[0]),
                      );
                      if (!valid.length) {
                        notify("Aucune ligne valide à importer.");
                        return;
                      }
                      setImportError("");
                      try {
                        const result = await importStudentRows(
                          valid.map((row) => ({
                            name: row[0],
                            className: row[1],
                            guardianName: row[2],
                          })),
                        );
                        setImportRows([]);
                        notify(
                          `${result.imported.length} dossier(s) importé(s)${
                            result.errors.length
                              ? `, ${result.errors.length} ligne(s) rejetée(s)`
                              : ""
                          }.`,
                        );
                        if (result.imported.length && !result.errors.length) go("students");
                      } catch (error) {
                        setImportError(
                          error instanceof Error ? error.message : "Import impossible.",
                        );
                      }
                    }}
                  >
                    {importBusy ? "Import en cours…" : "Confirmer les lignes valides"}{" "}
                    <Check size={16} />
                  </button>
                  <p className="muted small">
                    La prévalidation locale est confirmée par le serveur : classe existante,
                    doublon et champs obligatoires sont vérifiés à nouveau.
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
    const child = studentsData[0];
    const reports = (pedagogieSnapshot?.reportCards ?? [])
      .filter((report) => report.studentId === child?.id && report.status === "Publié")
      .sort((a, b) =>
        String(b.publishedAt || b.generatedAt).localeCompare(
          String(a.publishedAt || a.generatedAt),
        ),
      );
    const latestReport = reports[0];
    const attendance = attendanceSnapshot?.stats;
    const tracked = attendance
      ? attendance.present + attendance.absent + attendance.late
      : 0;
    const attendanceRate =
      tracked > 0 && attendance
        ? Math.round((attendance.present / tracked) * 1000) / 10
        : null;
    const outstanding = financeSnapshot?.stats.outstanding ?? 0;
    const announcement = (communicationSnapshot?.announcements ?? []).find(
      (item) => item.status === "Publié",
    );

    if (!child) {
      return (
        <>
          <PageHead
            title={profile === "Parent" ? "Espace parent" : "Espace élève"}
            subtitle="Une fenêtre sur la vie scolaire."
          />
          <Panel>
            <Empty
              title="Aucun dossier associé"
              text="Votre compte n’est pas encore relié à un dossier élève. Contactez l’administration."
            />
          </Panel>
        </>
      );
    }

    return (
      <>
        <PageHead
          title={`Bonjour, ${child.name.split(" ")[0]}.`}
          subtitle={
            profile === "Parent"
              ? "Une fenêtre sur la vie scolaire de votre enfant."
              : "Votre journée, vos progrès, votre école."
          }
        />
        <div className="child-banner">
          <Avatar name={child.name} large />
          <div>
            <span className="eyebrow">{profile === "Parent" ? "MON ENFANT" : "MON PROFIL"}</span>
            <h2>{child.name}</h2>
            <p>
              {child.className || "Classe non renseignée"} · {school} · {year}
            </p>
          </div>
          <Badge>{child.status || "Actif"}</Badge>
        </div>
        <div className="tabs standalone">
          {["Synthèse", "Résultats", "Agenda"].map((tab) => (
            <button
              className={portalTab === tab ? "active" : ""}
              key={tab}
              onClick={() => setPortalTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        {portalTab === "Résultats" ? (
          latestReport ? (
            <div className="stats-row three">
              <Stat
                label="Moyenne publiée"
                value={`${latestReport.average.toFixed(2).replace(".", ",")} / 20`}
                delta={latestReport.periodName || "Période publiée"}
                icon={TrendingUp}
              />
              <Stat
                label="Bulletins publiés"
                value={String(reports.length)}
                delta="Visibles dans votre espace"
                icon={FileText}
                color="violet"
              />
              <button className="portal-card" onClick={() => go("reports")}>
                <FileText size={24} />
                <b>Consulter le bulletin</b>
                <span>
                  {latestReport.periodName || "Bulletins"} <ArrowRight size={16} />
                </span>
              </button>
            </div>
          ) : (
            <Panel>
              <Empty
                title="Aucun bulletin publié"
                text="Les résultats apparaîtront ici après validation et publication par l’établissement."
              />
            </Panel>
          )
        ) : portalTab === "Agenda" ? (
          schedule()
        ) : (
          <>
            <div className="stats-row three">
              <Stat
                label="Moyenne publiée"
                value={
                  latestReport
                    ? `${latestReport.average.toFixed(2).replace(".", ",")} / 20`
                    : "—"
                }
                delta={latestReport?.periodName || "Aucun bulletin publié"}
                icon={TrendingUp}
              />
              <Stat
                label="Assiduité validée"
                value={attendanceRate === null ? "—" : `${attendanceRate} %`}
                delta={
                  attendance
                    ? `${attendance.present} présent(s) · ${attendance.absent} absence(s)`
                    : "Aucun appel validé"
                }
                icon={ClipboardCheck}
                color="amber"
              />
              <button className="portal-card" onClick={() => go("payments")}>
                <Wallet size={24} />
                <b>{outstanding > 0 ? "Solde à régler" : "Compte à jour"}</b>
                <span>
                  {formatMoney(outstanding)} <ArrowRight size={16} />
                </span>
              </button>
            </div>
            <div className="dashboard-grid">
              <Panel title="L’école vous informe">
                {announcement ? (
                  <div className="family-news">
                    <span className="attention-icon amber">
                      <MessageSquare size={22} />
                    </span>
                    <h3>{announcement.title}</h3>
                    <p>{announcement.body}</p>
                    <button className="text-link" onClick={() => go("messages")}>
                      Lire les annonces <ArrowRight size={15} />
                    </button>
                  </div>
                ) : (
                  <Empty
                    title="Aucune annonce publiée"
                    text="Les informations de l’établissement apparaîtront ici."
                  />
                )}
              </Panel>
              <Panel title="Derniers résultats publiés">
                {reports.length ? (
                  <div className="course-list">
                    <div>
                      <b>{reports[0].periodName || "Bulletin"}</b>
                      <small>
                        Moyenne {reports[0].average.toFixed(2).replace(".", ",")} / 20
                      </small>
                    </div>
                    <button className="text-link" onClick={() => go("reports")}>
                      Voir <ArrowRight size={15} />
                    </button>
                  </div>
                ) : (
                  <Empty
                    title="Aucun résultat publié"
                    text="Les bulletins validés et publiés seront affichés ici."
                  />
                )}
              </Panel>
            </div>
          </>
        )}
        <div className="info-line">
          <ShieldCheck size={15} />
          Les données de ce portail sont filtrées côté serveur sur les dossiers réellement
          associés à votre compte.
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

  function examsScreen() {
    const exams = examsSnapshot?.exams ?? [];
    const canWrite = canManage || profile === "Enseignant";
    const [editingId, setEditingId] = useState<string | null>(null);
    const editing = editingId ? exams.find((exam) => exam.id === editingId) : null;
    const visible = exams.filter((exam) =>
      `${exam.title} ${exam.type} ${exam.classesLabel} ${exam.datesLabel} ${exam.status}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    const parseExamForm = (form: HTMLFormElement): ExamInput => {
      const data = new FormData(form);
      return {
        title: String(data.get("title") ?? "").trim(),
        type: String(data.get("type") ?? "Examen") as ExamInput["type"],
        classesLabel: String(data.get("classesLabel") ?? "").trim(),
        datesLabel: String(data.get("datesLabel") ?? "").trim(),
        candidatesCount: Number(data.get("candidatesCount") ?? 0),
        status: String(data.get("status") ?? "Brouillon") as ExamInput["status"],
        notes: String(data.get("notes") ?? "").trim(),
        periodId: "",
        academicYearId: "",
      };
    };
    const examFields = (exam?: (typeof exams)[number]) => (
      <>
        <label>
          Titre
          <input className="field" name="title" defaultValue={exam?.title ?? ""} required />
        </label>
        <label>
          Type
          <select className="field" name="type" defaultValue={exam?.type ?? "Examen"}>
            {EXAM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          Classes
          <input
            className="field"
            name="classesLabel"
            defaultValue={exam?.classesLabel ?? ""}
            placeholder="Ex. 3e A — 3e B"
          />
        </label>
        <label>
          Dates
          <input
            className="field"
            name="datesLabel"
            defaultValue={exam?.datesLabel ?? ""}
            placeholder="Ex. 18 – 19 janv."
          />
        </label>
        <label>
          Candidats
          <input
            className="field"
            name="candidatesCount"
            type="number"
            min={0}
            defaultValue={String(exam?.candidatesCount ?? 0)}
          />
        </label>
        <label>
          Statut
          <select className="field" name="status" defaultValue={exam?.status ?? "Brouillon"}>
            {EXAM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="full">
          Notes
          <textarea className="field" name="notes" rows={3} defaultValue={exam?.notes ?? ""} />
        </label>
      </>
    );

    return (
      <>
        <PageHead
          title="Examens & délibérations"
          subtitle="Planifiez les épreuves et suivez les décisions des conseils."
          action={
            <button
              className="btn secondary"
              onClick={async () => {
                try {
                  const result = await exportExamsCsv();
                  downloadCsvContent(result.filename, result.content);
                  notify(`Export CSV examens téléchargé (${result.count} ligne(s)).`);
                } catch (error) {
                  notify(error instanceof Error ? `Export impossible : ${error.message}` : "Export impossible.");
                }
              }}
            >
              <Download size={16} /> Exporter
            </button>
          }
        />
        {examsError ? <div className="error-message">{examsError}</div> : null}
        {canWrite ? (
          <Panel title={editing ? "Modifier un examen / une délibération" : "Planifier un examen / une délibération"}>
            <form
              className="form-grid"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = event.currentTarget;
                try {
                  const values = parseExamForm(form);
                  if (editing) {
                    await updateExam({ ...values, id: editing.id });
                    notify("Examen/délibération mis à jour.");
                    setEditingId(null);
                  } else {
                    await createExam(values);
                    notify("Examen/délibération enregistré.");
                    form.reset();
                  }
                } catch (error) {
                  notify(error instanceof Error ? error.message : "Enregistrement impossible.");
                }
              }}
            >
              {examFields(editing ?? undefined)}
              <div className="button-group full">
                <button className="btn dark" type="submit">
                  {editing ? "Enregistrer les modifications" : "Planifier"}
                </button>
                {editing ? (
                  <button className="btn secondary" type="button" onClick={() => setEditingId(null)}>
                    Annuler
                  </button>
                ) : null}
              </div>
            </form>
          </Panel>
        ) : null}
        <div className="summary-strip">
          <span>
            <b>{visible.length}</b> élément(s)
          </span>
          <span>
            <i className="green-dot" />
            {visible.filter((exam) => exam.status === "Planifié" || exam.status === "En cours").length} planifié(s)/en cours
          </span>
        </div>
        <Panel
          title="Examens & délibérations"
          extra={
            <div className="table-search compact">
              <FileText size={15} />
              <input
                aria-label="Rechercher un examen"
                placeholder="Rechercher un examen ou une délibération…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          }
        >
          {examsLoading ? <p className="muted">Chargement des examens…</p> : null}
          {!examsLoading && visible.length === 0 ? (
            <Empty
              title="Aucun examen enregistré"
              text="Planifiez les sessions d'examens et les délibérations de l'établissement."
            />
          ) : null}
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Examen / délibération</th>
                  <th>Classes</th>
                  <th>Dates</th>
                  <th>Candidats</th>
                  <th>Statut</th>
                  {canWrite ? <th aria-label="Actions" /> : null}
                </tr>
              </thead>
              <tbody>
                {visible.map((exam) => (
                  <tr key={exam.id}>
                    <td>
                      <span className="name-cell">
                        <Avatar name={exam.title} />
                        <span>
                          <b>{exam.title}</b>
                          <small>{exam.type}{exam.notes ? ` · ${exam.notes}` : ""}</small>
                        </span>
                      </span>
                    </td>
                    <td>{exam.classesLabel || "—"}</td>
                    <td>{exam.datesLabel || "—"}</td>
                    <td>{exam.candidatesCount}</td>
                    <td>
                      <Badge>{exam.status}</Badge>
                    </td>
                    {canWrite ? (
                      <td>
                        <div className="button-group">
                          <button className="text-link" onClick={() => setEditingId(exam.id)}>
                            Modifier
                          </button>
                          <button
                            className="text-link danger"
                            onClick={async () => {
                              if (!window.confirm(`Supprimer « ${exam.title} » ?`)) return;
                              try {
                                await removeExam(exam.id);
                                if (editingId === exam.id) setEditingId(null);
                                notify("Examen/délibération supprimé.");
                              } catch (error) {
                                notify(error instanceof Error ? error.message : "Suppression impossible.");
                              }
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

  return {
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
  };
}
