"use client";

import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthError } from "@supabase/supabase-js";
import { notify } from "@/lib/toast";
import { getUserFriendlyError } from "@/lib/errorSanitizer";
import {
  type AuthLanguage,
  authTranslations,
  getInitialAuthLanguage,
  setStoredAuthLanguage,
  subscribeAuthLanguage,
} from "@/lib/auth-translations";

type AuthMode = "login" | "signup" | "profile-complete" | "forgot-password";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  phone: string;
  whatsapp: string;
  sameAsPhone: boolean;
  address: string;
  identifier: string; // For login (email/username/phone)
}

const INITIAL_FORM_DATA: FormData = {
  email: "",
  password: "",
  confirmPassword: "",
  username: "",
  phone: "",
  whatsapp: "",
  sameAsPhone: true,
  address: "",
  identifier: "",
};

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const lang = useSyncExternalStore<AuthLanguage>(
    subscribeAuthLanguage,
    getInitialAuthLanguage,
    (): AuthLanguage => "bn"
  );
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supabase = createClient();
  const modalRef = useRef<HTMLDivElement>(null);

  // Listen for open modal events
  useEffect(() => {
    const handleOpenModal = (e: CustomEvent<{ mode?: AuthMode }>) => {
      setMode(e.detail?.mode || "login");
      setIsOpen(true);
      setError(null);
      setSuccessMessage(null);
    };

    window.addEventListener("techbd:open-auth-modal", handleOpenModal as EventListener);
    return () => window.removeEventListener("techbd:open-auth-modal", handleOpenModal as EventListener);
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    setFormData(INITIAL_FORM_DATA);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    setSuccessMessage(null);
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleLanguageChange = (newLang: AuthLanguage) => {
    if (newLang === lang) return;
    setStoredAuthLanguage(newLang);
    window.dispatchEvent(
      new CustomEvent("techbd:auth-lang-change", { detail: { lang: newLang } })
    );
  };

  const t = authTranslations[lang];

  // --- HANDLERS ---

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      handleError(err as AuthError);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const email = (formData.email || formData.identifier).trim().toLowerCase();
      if (!email) {
        setError(t.validationEnterEmail);
        setIsLoading(false);
        return;
      }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account/security`,
      });
      if (resetError) throw resetError;

      setSuccessMessage(t.toastResetSentDesc);
      notify.success(t.toastResetSentTitle, {
        description: t.toastResetSentDesc,
        id: "auth-reset-sent",
      });
    } catch (err) {
      handleError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(t.validationPasswordMismatch);
      notify.warning(t.toastPasswordMismatchTitle, {
        description: t.validationPasswordMismatch,
        id: "auth-val",
      });
      setIsLoading(false);
      return;
    }
    if (formData.password.length < 10) {
      setError(t.validationPasswordShort);
      notify.warning(t.toastShortPasswordTitle, {
        description: t.validationPasswordShort,
        id: "auth-val",
      });
      setIsLoading(false);
      return;
    }
    if (!formData.username || formData.username.length < 3 || formData.username.length > 30) {
      setError(t.validationUsernameInvalid);
      notify.warning(t.toastInvalidUsernameTitle, {
        description: t.validationUsernameInvalid,
        id: "auth-val",
      });
      setIsLoading(false);
      return;
    }

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();

      if (formData.phone) {
        const checkRes = await fetch("/api/auth/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: formData.phone }),
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.phoneTaken) {
            setError(t.validationPhoneTaken);
            notify.error(t.toastRegistrationFailedTitle, {
              description: t.validationPhoneTaken,
              id: "auth-phone-taken",
            });
            setIsLoading(false);
            return;
          }
        } else {
          console.warn("Availability check failed:", await checkRes.text());
        }
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
        options: {
          data: {
            username_temp: formData.username,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user && data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        await completeProfile(data.user.id);
      } else if (data.user && !data.session) {
        setError(t.toastVerificationCodeSentDesc);
        notify.info(t.toastVerificationCodeSentTitle, {
          description: t.toastVerificationCodeSentDesc,
          id: "auth-email-confirm",
        });
      }
    } catch (err) {
      handleError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  const completeProfile = async (userId: string) => {
    try {
      const normalizedPhone = normalizePhone(formData.phone);
      const normalizedWhatsapp = formData.sameAsPhone
        ? normalizedPhone
        : normalizePhone(formData.whatsapp);

      const profileData = {
        id: userId,
        username: formData.username.trim(),
        phone_e164: normalizedPhone || null,
        whatsapp_e164: normalizedWhatsapp || null,
        address: formData.address.trim() || null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profilesTable: any = supabase.from("profiles");
      let { error: profileError } = await profilesTable.upsert(profileData, { onConflict: "id" });

      if (profileError && (profileError.code === "42501" || profileError.message.includes("permission denied"))) {
        await supabase.auth.refreshSession();
        await new Promise((resolve) => setTimeout(resolve, 300));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const retryProfilesTable: any = supabase.from("profiles");
        const retryResult = await retryProfilesTable.upsert(profileData, { onConflict: "id" });
        profileError = retryResult.error;
      }

      if (profileError) {
        if (profileError.code === "23505") {
          setMode("profile-complete");
          setError(t.validationUsernameTaken);
          notify.warning(t.toastUsernameTakenTitle, {
            description: t.validationUsernameTaken,
            id: "auth-profile-val",
          });
          return;
        }
        throw profileError;
      }

      setSuccessMessage(t.toastAccountCreatedDesc);
      notify.success(t.toastWelcomeTitle, {
        description: t.toastAccountCreatedDesc,
        id: "auth-account-created",
      });
      closeModal();
      window.location.reload();
    } catch (err) {
      handleError(err as AuthError);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const identifier = formData.identifier.trim();
      let emailToSignIn = identifier;

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

      if (!isEmail) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier,
            password: formData.password,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.email) {
          const msg = data.error || t.toastSignInFailedGeneric;
          setError(msg);
          notify.error(t.toastSignInFailedTitle, {
            description: msg,
            id: "auth-login-fail",
          });
          setIsLoading(false);
          return;
        }

        emailToSignIn = data.email;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: emailToSignIn.toLowerCase(),
        password: formData.password,
      });

      if (loginError) throw loginError;

      notify.success(t.toastWelcomeBackTitle, {
        description: t.toastSignedInDesc,
        id: "auth-signed-in",
      });
      closeModal();
      window.location.reload();
    } catch (err) {
      handleError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (err: AuthError | Error) => {
    console.error("Auth Error:", err);
    const sanitized = getUserFriendlyError(err, t.toastUnexpectedError);
    setError(sanitized);
    notify.error(t.toastAuthFailedTitle, {
      description: sanitized,
      id: "auth-error-toast",
    });
  };

  const normalizePhone = (phone: string): string => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("880") && cleaned.length === 13) return "+" + cleaned;
    if (cleaned.startsWith("0") && cleaned.length === 11) return "+880" + cleaned.slice(1);
    if (cleaned.length >= 10) return "+" + cleaned;
    return phone;
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={closeModal}>
      <div
        className="auth-modal-container"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        data-lang={lang}
      >
        {/* Close Button */}
        <button
          className="auth-modal-close"
          onClick={closeModal}
          aria-label={t.closeModal}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="auth-modal-header">
          {/* Glowing Brand Pill Card */}
          <div className="auth-brand-card">
            <div className="auth-brand-logo-box">
              <img
                src="/img_content/tsb.png"
                alt="Tech Solutions BD"
                width={42}
                height={42}
              />
            </div>
            <div className="auth-brand-text">
              <div className="auth-brand-name">
                <span className="auth-brand-name--white">Tech Solutions</span>{" "}
                <span className="auth-brand-name--blue">BD</span>
              </div>
            </div>
          </div>

          <h2 className="auth-modal-title">
            {mode === "login" && t.loginTitle}
            {mode === "signup" && t.signupTitle}
            {mode === "forgot-password" && t.forgotPasswordTitle}
            {mode === "profile-complete" && t.profileCompleteTitle}
          </h2>
          <p className="auth-modal-subtitle">
            {mode === "login" && t.loginSubtitle}
            {mode === "signup" && t.signupSubtitle}
            {mode === "forgot-password" && t.forgotPasswordSubtitle}
            {mode === "profile-complete" && t.profileCompleteSubtitle}
          </p>
        </div>

        {error && <div className="auth-alert auth-alert--error">{error}</div>}
        {successMessage && <div className="auth-alert auth-alert--success">{successMessage}</div>}

        <div className="auth-modal-body">
          {(mode === "login" || mode === "signup") && (
            <>
              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <span className="auth-google-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.8c-.2-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.8z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.4 7.4 23 12 23z"
                    />
                  </svg>
                </span>
                <span>{t.googleButton}</span>
              </button>

              <div className="auth-divider">
                <span>{t.orWithEmail}</span>
              </div>
            </>
          )}

          {/* LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <polyline points="3 7 12 13 21 7" />
                  </svg>
                </span>
                <input
                  id="auth-identifier"
                  type="text"
                  autoComplete="username"
                  placeholder={t.emailOrUsernamePlaceholder}
                  value={formData.identifier}
                  onChange={(e) => updateField("identifier", e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </span>
                <input
                  id="auth-login-pass"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t.passwordPlaceholder}
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="auth-forgot-row">
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode("forgot-password");
                  }}
                >
                  {t.forgotPasswordLink}
                </button>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>{isLoading ? t.signingIn : t.signInButton}</span>
              </button>

              <p className="auth-switch-text">
                {t.noAccountPrompt}{" "}
                <button type="button" className="auth-link" onClick={() => setMode("signup")}>
                  {t.signUpLink}
                </button>
              </p>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === "forgot-password" && (
            <form onSubmit={handleForgotPassword} className="auth-form">
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <polyline points="3 7 12 13 21 7" />
                  </svg>
                </span>
                <input
                  id="auth-reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t.emailPlaceholder}
                  value={formData.email || formData.identifier}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                <span>{isLoading ? t.sendingResetLink : t.sendResetLinkButton}</span>
              </button>

              <p className="auth-switch-text">
                {t.rememberPasswordPrompt}{" "}
                <button type="button" className="auth-link" onClick={() => setMode("login")}>
                  {t.signInLink}
                </button>
              </p>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="auth-form">
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="auth-username"
                  type="text"
                  autoComplete="username"
                  placeholder={t.usernamePlaceholder}
                  minLength={3}
                  maxLength={30}
                  value={formData.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <polyline points="3 7 12 13 21 7" />
                  </svg>
                </span>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t.emailPlaceholder}
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <input
                  id="auth-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder={t.phonePlaceholder}
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <input
                  id="auth-address"
                  type="text"
                  autoComplete="street-address"
                  placeholder={t.addressPlaceholder}
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </span>
                <input
                  id="auth-pass"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t.signupPasswordPlaceholder}
                  minLength={10}
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>

              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </span>
                <input
                  id="auth-confirm-pass"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t.confirmPasswordPlaceholder}
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? t.hidePassword : t.showPassword}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span>{isLoading ? t.signingUp : t.signUpButton}</span>
              </button>

              <p className="auth-switch-text">
                {t.hasAccountPrompt}{" "}
                <button type="button" className="auth-link" onClick={() => setMode("login")}>
                  {t.signInLink}
                </button>
              </p>
            </form>
          )}

          {/* PROFILE COMPLETE (Fallback if username taken during auto-create) */}
          {mode === "profile-complete" && (
            <div className="auth-form">
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  placeholder={t.newUsernamePlaceholder}
                  value={formData.username}
                  onChange={(e) => updateField("username", e.target.value)}
                />
              </div>
              <button
                className="auth-submit-btn"
                onClick={async () => {
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  if (user) await completeProfile(user.id);
                }}
                disabled={isLoading}
              >
                <span>{isLoading ? t.savingProfile : t.saveProfileButton}</span>
              </button>
            </div>
          )}

          {/* Bottom Bilingual Switcher */}
          <div className="auth-bottom-lang-wrap">
            <div
              className="auth-lang-toggle"
              role="group"
              aria-label={t.langSwitcherAria}
            >
              <button
                type="button"
                className={`auth-lang-btn ${lang === "en" ? "auth-lang-btn--active" : ""}`}
                onClick={() => handleLanguageChange("en")}
                aria-pressed={lang === "en"}
                title="Switch to English"
              >
                EN
              </button>
              <span className="auth-lang-divider" aria-hidden="true">
                |
              </span>
              <button
                type="button"
                className={`auth-lang-btn ${lang === "bn" ? "auth-lang-btn--active" : ""}`}
                onClick={() => handleLanguageChange("bn")}
                aria-pressed={lang === "bn"}
                title="বাংলায় পরিবর্তন করুন"
              >
                বাংলা
              </button>
            </div>
          </div>

          {/* Footer Security Badges */}
          <div className="auth-trust-footer">
            <div className="auth-trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span>{t.sslSecured}</span>
            </div>
            <div className="auth-trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <span>{t.encrypted}</span>
            </div>
            <div className="auth-trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>{t.fastLogin}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
