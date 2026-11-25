import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  MapPin,
  User,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SchoolArt } from "../components/scolia-ui";
import { loginRequest, registerRequest, type Session } from "../lib/auth";

type Mode = "login" | "register";

export function AuthScreen() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const email = String(form.get("email") ?? "");
      const password = String(form.get("password") ?? "");
      const session: Session =
        mode === "login"
          ? await loginRequest(email, password)
          : await registerRequest({
              schoolName: String(form.get("schoolName") ?? ""),
              name: String(form.get("name") ?? ""),
              email,
              password,
              address: String(form.get("address") ?? "") || undefined,
            });
      queryClient.setQueryData(["session"], session);
      await queryClient.invalidateQueries({ queryKey: ["scolarite"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="login-screen-root">
      {/* Cercles décoratifs d'ambiance */}
      <div className="login-ambient-circle login-ambient-top-right" aria-hidden="true" />
      <div className="login-ambient-circle login-ambient-bottom-right" aria-hidden="true" />
      <div className="login-ambient-circle login-ambient-bottom-left" aria-hidden="true" />

      <div className="login-wrapper">
        {/* Colonne gauche : Carte éditoriale jaune */}
        <div className="login-hero-card">
          <div className="login-hero-glow-tr" aria-hidden="true" />
          <div className="login-hero-glow-bl" aria-hidden="true" />

          <div className="login-hero-header">
            <span className="login-hero-brand">
              <GraduationCap size={24} strokeWidth={2.2} className="login-hero-cap" />
              scolia <span className="login-hero-dot">.</span>
            </span>
          </div>

          <h1 className="login-hero-title">
            Une école qui avance.
            <br />
            Ensemble.
          </h1>

          <p className="login-hero-tagline">
            Un espace pour apprendre, accompagner et grandir.
          </p>

          <div className="login-hero-art">
            <SchoolArt />
          </div>
        </div>

        {/* Colonne droite : Carte blanche avec formulaire */}
        <section className="login-form-card">
          <div className="login-form-eyebrow-container">
            <span className="login-form-eyebrow-accent" aria-hidden="true" />
            <span className="login-form-eyebrow">
              {mode === "login" ? "BIENVENUE DANS VOTRE ESPACE" : "CRÉER VOTRE ÉTABLISSEMENT"}
            </span>
          </div>

          <h2 className="login-form-title">
            {mode === "login" ? "Se connecter" : "Ouvrir un espace"}
          </h2>

          <p className="login-form-subtitle">
            {mode === "login"
              ? "Accédez aux dossiers réels de votre établissement."
              : "Le compte créé devient propriétaire (Direction) de l’établissement."}
          </p>

          <form onSubmit={submit} className="login-form">
            {mode === "register" && (
              <>
                <label className="login-field-item">
                  <span className="login-field-label">Établissement</span>
                  <div className="login-field-input-box">
                    <Building2 size={16} strokeWidth={1.8} className="login-field-icon" />
                    <input
                      className="login-field-input"
                      name="schoolName"
                      placeholder="Nom de l’établissement"
                      aria-label="Nom de l’établissement"
                      autoComplete="organization"
                      required
                      minLength={2}
                    />
                  </div>
                </label>
                <label className="login-field-item">
                  <span className="login-field-label">Adresse de l’établissement</span>
                  <div className="login-field-input-box">
                    <MapPin size={16} strokeWidth={1.8} className="login-field-icon" />
                    <input
                      className="login-field-input"
                      name="address"
                      placeholder="Adresse de l’établissement"
                      aria-label="Adresse de l’établissement"
                      autoComplete="street-address"
                    />
                  </div>
                </label>
                <label className="login-field-item">
                  <span className="login-field-label">Votre nom</span>
                  <div className="login-field-input-box">
                    <User size={16} strokeWidth={1.8} className="login-field-icon" />
                    <input
                      className="login-field-input"
                      name="name"
                      placeholder="Votre nom"
                      aria-label="Votre nom"
                      autoComplete="name"
                      required
                      minLength={2}
                    />
                  </div>
                </label>
              </>
            )}

            <label className="login-field-item">
              <span className="login-field-label">Adresse e-mail</span>
              <div className="login-field-input-box">
                <Mail size={16} strokeWidth={1.8} className="login-field-icon" />
                <input
                  className="login-field-input login-field-input-email"
                  name="email"
                  type="email"
                  defaultValue="dev@tilleuls.test"
                  placeholder="votre@etablissement.fr"
                  aria-label="Adresse e-mail"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="login-field-item">
              <span className="login-field-label">Mot de passe</span>
              <div className="login-field-input-box">
                <Lock size={16} strokeWidth={1.8} className="login-field-icon" />
                <input
                  className="login-field-input"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  aria-label="Mot de passe"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={mode === "register" ? 8 : 1}
                />
              </div>
            </label>

            {error && (
              <div className="login-error-pill" role="alert">
                <AlertCircle size={15} strokeWidth={2} className="login-error-icon" />
                <span>{error}</span>
              </div>
            )}

            <button className="login-submit-btn" type="submit" disabled={pending}>
              {pending ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <>
                  {mode === "login" ? "Se connecter" : "Créer mon espace"}{" "}
                  <ArrowRight size={16} strokeWidth={2} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer-switch">
            <button
              className="login-footer-btn"
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? (
                <>
                  <span className="login-footer-muted">Pas encore de compte ?</span>{" "}
                  <span className="login-footer-bold">Créer un établissement</span>
                </>
              ) : (
                <>
                  <span className="login-footer-muted">J’ai déjà un compte —</span>{" "}
                  <span className="login-footer-bold">se connecter</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
