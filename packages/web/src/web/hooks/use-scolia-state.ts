import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { modules, students, gradeValues, type DemoRow } from "../lib/demo-data";
import { groups, downloadCsv, useStored } from "../components/scolia-ui";

export function useScoliaState() {
  const [location, navigate] = useLocation();
  const current = location.replace("/", "") || "dashboard";
  const [profile, setProfile] = useState("Direction");
  const [school, setSchool] = useState("Institution Saint-Exupéry");
  const [year, setYear] = useState("2026–2027");
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<{ kind: string; name?: string; row?: DemoRow } | null>(null);
  const [detail, setDetail] = useState<DemoRow | null>(null);
  const [detailTab, setDetailTab] = useState("Informations");
  const [customRows, setCustomRows] = useStored<Record<string, DemoRow[]>>("scolia-rows", {});
  const [filter, setFilter] = useState("Tous");
  const [checked, setChecked] = useState<string[]>([]);
  const [notes, setNotes] = useStored<(number | null)[]>("scolia-notes", gradeValues);
  const [gradeStage, setGradeStage] = useState("Brouillon");
  const [reportStage, setReportStage] = useState("Brouillon");
  const [scheduleStage, setScheduleStage] = useState("Publié");
  const [week, setWeek] = useState(0);
  const [scheduleView, setScheduleView] = useState("4e A");
  const [attend, setAttend] = useStored<Record<string, string>>("scolia-attendance", {});
  const [paymentRows, setPaymentRows] = useStored<DemoRow[]>("scolia-payments", [
    {
      name: "Emma Laurent",
      sub: "REC-2026-0842",
      fields: ["Scolarité · Novembre", "Virement", "120 €"],
      status: "Enregistré",
    },
    {
      name: "Lucas Martin",
      sub: "REC-2026-0841",
      fields: ["Frais d’inscription", "Espèces", "80 €"],
      status: "Enregistré",
    },
    {
      name: "Inès Rakoto",
      sub: "REC-2026-0840",
      fields: ["Scolarité · Novembre", "Chèque", "240 €"],
      status: "Enregistré",
    },
  ]);
  const [messageRows, setMessageRows] = useStored("scolia-messages", [
    {
      name: "Réunion parents-professeurs",
      text: "Retrouvons-nous le samedi 21 novembre de 9 h à 12 h pour échanger sur la progression de vos enfants.",
      target: "Parents · Collège",
      status: "Publié",
      date: "10 nov. 2026",
    },
    {
      name: "Préparation des bulletins du 1er trimestre",
      text: "La saisie des notes sera clôturée le 12 décembre. Pensez à compléter vos appréciations.",
      target: "Enseignants",
      status: "Publié",
      date: "09 nov. 2026",
    },
    {
      name: "Sortie au musée des sciences",
      text: "Les classes de 4e sont invitées à une sortie pédagogique le 26 novembre. Autorisation parentale requise.",
      target: "4e A · 4e B",
      status: "Brouillon",
      date: "08 nov. 2026",
    },
  ]);
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
  const [portalTab, setPortalTab] = useState("Synthèse");
  const [receipt, setReceipt] = useState<DemoRow | null>(null);
  const notify = (s: string) => setToast(s);
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
  const visibleGroups = isPlatform
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
              "messages",
              ...(profile === "Parent" ? ["payments", "documents"] : ["lessons"]),
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
  const module = modules.find((m) => m.id === current);
  const allRows = module ? customRows[current] || module.rows : [];
  const filtered = allRows.filter(
    (r) =>
      (!isFamily || current !== "documents" || r.fields.includes("Emma Laurent")) &&
      (r.name + " " + r.sub + " " + r.fields.join(" "))
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "Tous" || r.status === filter || r.fields.includes(filter)),
  );
  function setNewProfile(p: string) {
    setProfile(p);
    setSearch("");
    if (p === "Parent" || p === "Élève") setScheduleView("4e A");
    go(p === "Parent" || p === "Élève" ? "portal" : "dashboard");
  }
  function exportModule() {
    if (module) {
      downloadCsv(
        current,
        module.columns,
        filtered.map((r) => [r.name, ...r.fields, r.status]),
      );
      notify("Export CSV téléchargé : données fictives affichées.");
    }
  }
  const moduleButton = () => {
    if (current === "audit") exportModule();
    else if (current === "cash")
      setModal({ kind: "confirm", name: "Clôturer la caisse de démonstration ?" });
    else setModal({ kind: "generic", name: module?.action });
  };
  function allStudentNames() {
    return (customRows.students || students).map((r) => r.name);
  }

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
    scheduleStage,
    setScheduleStage,
    week,
    setWeek,
    scheduleView,
    setScheduleView,
    attend,
    setAttend,
    paymentRows,
    setPaymentRows,
    messageRows,
    setMessageRows,
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
  };
}
export type ScoliaState = ReturnType<typeof useScoliaState>;
