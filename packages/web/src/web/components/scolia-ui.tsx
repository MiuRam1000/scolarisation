import { useState, useEffect, type ReactNode } from "react";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Wallet,
  MessageSquare,
  Settings,
  Search,
  Clock,
  CircleHelp,
  Building2,
  ShieldCheck,
  Library,
  Bus,
  Layers,
  Upload,
  TrendingUp,
  Server,
  LockKeyhole,
} from "lucide-react";
import { modules, specialTitles } from "../lib/demo-data";

export const icons: Record<string, typeof Users> = {
  dashboard: LayoutDashboard,
  students: Users,
  families: Users,
  classes: Layers,
  teachers: GraduationCap,
  subjects: BookOpen,
  schedule: CalendarDays,
  lessons: BookOpen,
  grades: ClipboardCheck,
  reports: FileText,
  exams: GraduationCap,
  attendance: ClipboardCheck,
  discipline: ShieldCheck,
  fees: Wallet,
  payments: Wallet,
  cash: Wallet,
  messages: MessageSquare,
  documents: FileText,
  library: Library,
  transport: Bus,
  settings: Settings,
  years: CalendarDays,
  rooms: Building2,
  permissions: ShieldCheck,
  audit: Clock,
  imports: Upload,
  tenants: Building2,
  subscriptions: Wallet,
  support: CircleHelp,
  portal: LayoutDashboard,
  health: Server,
  login: LockKeyhole,
};
export const groups = [
  { label: "VOTRE ÉTABLISSEMENT", ids: ["dashboard"] },
  { label: "SCOLARITÉ", ids: ["students", "families", "classes", "teachers"] },
  { label: "PÉDAGOGIE", ids: ["schedule", "subjects", "lessons", "grades", "reports", "exams"] },
  { label: "VIE SCOLAIRE", ids: ["attendance", "discipline"] },
  { label: "FINANCES", ids: ["payments", "fees", "cash"] },
  { label: "RESSOURCES", ids: ["messages", "documents", "library", "transport"] },
  {
    label: "CONFIGURATION",
    ids: ["settings", "years", "rooms", "permissions", "imports", "audit"],
  },
  { label: "PLATEFORME", ids: ["tenants", "subscriptions", "support", "health"] },
];
export const title = (id: string) =>
  specialTitles[id] || modules.find((m) => m.id === id)?.title || "Vue d’ensemble";
const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return <span className={"avatar " + (large ? "large" : "")}>{initials(name)}</span>;
}
export function Badge({ children }: { children: ReactNode }) {
  const s = String(children);
  return (
    <span
      className={
        "badge " +
        (/attente|incomplet|retard|Brouillon|préparation/.test(s)
          ? "amber"
          : /Absent|Impayé/.test(s)
            ? "red"
            : /Planifié|Emprunté/.test(s)
              ? "violet"
              : "green")
      }
    >
      <i />
      {children}
    </span>
  );
}
export function Panel({
  title: heading,
  extra,
  children,
  className = "",
}: {
  title?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={"panel " + className}>
      {heading && (
        <div className="panel-title">
          <h3>{heading}</h3>
          {extra}
        </div>
      )}
      {children}
    </section>
  );
}
export function Stat({
  label,
  value,
  delta,
  icon: Icon = Users,
  color = "green",
}: {
  label: string;
  value: string;
  delta: string;
  icon?: typeof Users;
  color?: string;
}) {
  return (
    <div className="stat">
      <div className="stat-label">
        {label}
        <span className={"stat-icon " + color}>
          <Icon size={18} />
        </span>
      </div>
      <strong>{value}</strong>
      <div className="stat-foot">
        <span className={color}>
          <TrendingUp size={13} /> {delta.split("|")[0]}
        </span>
        <small>{delta.split("|")[1] || "ce mois-ci"}</small>
      </div>
    </div>
  );
}
export function downloadCsv(name: string, cols: string[], rows: string[][]) {
  const blob = new Blob(
    [
      "﻿" +
        [cols, ...rows]
          .map((r) => r.map((v) => '"' + v.replace(/"/g, '""') + '"').join(";"))
          .join("\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name + ".csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
export function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

export function PageHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">SCOLIA · VOTRE ESPACE DE TRAVAIL</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: () => void;
}) {
  return (
    <div className="empty">
      <Search size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="btn secondary" onClick={action}>
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
export function FormField({
  label,
  name,
  type = "text",
  value,
  min,
  max,
  step,
}: {
  label: string;
  name?: string;
  type?: string;
  value?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label>
      {label}
      <input
        aria-label={label}
        className="field"
        name={name}
        type={type}
        defaultValue={value}
        required
        min={min}
        max={max}
        step={step}
      />
    </label>
  );
}
export function SchoolArt() {
  return (
    <svg className="school-art" viewBox="0 0 440 280" fill="none" aria-hidden="true">
      <circle cx="247" cy="144" r="106" fill="#f8eaa0" />
      <path d="M96 237c43-13 191-16 264 0" stroke="#cebe65" strokeWidth="1.5" />
      <path d="M155 218V115l93-46 94 46v103" fill="#fffdf2" stroke="#444739" strokeWidth="2" />
      <path d="M140 115L248 58l109 57" stroke="#444739" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M170 99V77h19v12" fill="#f3d46b" stroke="#444739" strokeWidth="2" />
      <path
        d="M214 218v-50c0-17 11-29 34-29s34 12 34 29v50"
        fill="#e4ebc9"
        stroke="#444739"
        strokeWidth="2"
      />
      <path d="M248 140v78" stroke="#444739" strokeWidth="1.5" />
      {[
        [174, 127],
        [299, 127],
        [174, 173],
        [299, 173],
      ].map(([x, y]) => (
        <g key={x + "," + y}>
          <rect
            x={x}
            y={y}
            width="23"
            height="28"
            rx="2"
            fill="#e9eddf"
            stroke="#444739"
            strokeWidth="1.5"
          />
          <path
            d={"M" + (x + 11.5) + " " + y + "v28M" + x + " " + (y + 14) + "h23"}
            stroke="#444739"
            strokeWidth="1"
          />
        </g>
      ))}
      <circle cx="248" cy="105" r="14" fill="#f6db79" stroke="#444739" strokeWidth="1.5" />
      <path d="M248 95v11l7 4" stroke="#444739" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M118 218v-48M370 218v-46" stroke="#444739" strokeWidth="2" />
      <ellipse
        cx="118"
        cy="162"
        rx="21"
        ry="28"
        fill="#7c9671"
        stroke="#444739"
        strokeWidth="1.5"
      />
      <ellipse
        cx="370"
        cy="166"
        rx="18"
        ry="25"
        fill="#a4b686"
        stroke="#444739"
        strokeWidth="1.5"
      />
      <path d="M118 172v46M370 175v43" stroke="#444739" strokeWidth="1.5" />
      <path
        d="M309 68l10-6m-8 18 11 2M98 111l-9-4M202 46l-3-10"
        stroke="#444739"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M326 39l4-8 4 8 8 4-8 4-4 8-4-8-8-4z" fill="#fffdf3" stroke="#b8a853" />
      <path d="M108 204q8-10 16 0M359 220q9-12 17 0" stroke="#444739" strokeWidth="1.5" />
    </svg>
  );
}
