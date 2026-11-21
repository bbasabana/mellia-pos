"use client";

/**
 * Login Page: one centred form on a light grey background, the logo and the slogan above it.
 */

import { useState, FormEvent, useCallback, memo } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "@/styles/theme.scss";

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
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

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
    <div className="relative min-h-screen flex flex-col bg-[#eef1f5] overflow-hidden">
      {/* Soft colour halos taken from the logo */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#00d3fa]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-[#71de00]/15 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 -bottom-40 h-96 w-96 rounded-full bg-[#ff4900]/10 blur-3xl" />

      <main className="relative flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-7 flex flex-col items-center text-center">
            <Image
              src="/images/logos/logo.png"
              alt="Mellia Restaurant Rapide"
              width={168}
              height={56}
              priority
              className="drop-shadow-sm"
            />
            <p className="mt-4 text-lg font-semibold leading-snug tracking-tight">
              <span className="text-gray-800">Mangez comme chez vous,</span>
              <br />
              <span className="mellia-shimmer bg-clip-text text-transparent">gérez comme un pro.</span>
            </p>
          </div>

          <div className="rounded-2xl bg-white p-7 shadow-xl shadow-gray-900/5 ring-1 ring-gray-200/70">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Connexion</h1>
            <p className="mt-1 text-sm text-gray-500">Entrez vos identifiants pour ouvrir la caisse.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 text-[15px] text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:bg-white"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/60 pl-4 pr-12 text-[15px] text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:bg-white"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f172a] text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-gray-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isLoading || !email || !password}
              >
                {isLoading && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                )}
                {isLoading ? "Connexion…" : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="relative border-t border-gray-300/60 bg-gray-200/70 backdrop-blur px-5 py-4">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 text-xs text-gray-500 sm:flex-row">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00d3fa]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#71de00]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4900]" />
            <span className="ml-1">© {new Date().getFullYear()} Mellia Restaurant Rapide</span>
          </span>
          <span>10, Bypass, Mont-Ngafula · Kinshasa</span>
        </div>
      </footer>
    </div>
  );
}

export default memo(LoginPage);
