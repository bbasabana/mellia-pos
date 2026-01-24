"use client";

/**
 * Login Page - SIMPLE & CLEAN
 * Minimal design with logo, no shadows
 */

import { useState, FormEvent, useCallback, memo } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "@/styles/theme.scss";
import "@/styles/login.scss";

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      try {
        console.log("🔐 Attempting login with:", { email });

        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        console.log("🔐 Login result:", result);

        if (result?.error) {
          console.log("❌ Login error code:", result.error);
          // Show explicit error if it's one of our thrown errors
          const errorMsg = result.error === "CredentialsSignin"
            ? "Email ou mot de passe incorrect"
            : result.error;
          setError(errorMsg);
        } else if (result?.ok) {
          console.log("✅ Login successful, redirecting...");
          router.push("/dashboard");
          router.refresh();
        } else {
          console.error("❌ Unexpected result:", result);
          setError("Une erreur est survenue. Réessayez.");
        }
      } catch (err) {
        console.error("❌ Login exception:", err);
        setError("Une erreur est survenue. Réessayez.");
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, router]
  );

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      if (error) setError("");
    },
    [error]
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      if (error) setError("");
    },
    [error]
  );

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <Image
            src="/images/logos/logo.png"
            alt="Mellia POS"
            width={180}
            height={60}
            priority
          />
          <p>Système de caisse restaurant</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={handleEmailChange}
              placeholder="votre@email.com"
              required
              autoComplete="email"
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input"
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !email || !password}
            style={{ marginTop: "var(--spacing-xs)" }}
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="login-footer">© 2026 Mellia POS</div>
      </div>
    </div>
  );
}

export default memo(LoginPage);
