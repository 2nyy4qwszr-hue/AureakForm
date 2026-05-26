import { signIn } from "./actions";
import { BurundiFlag } from "@/components/aureak/BurundiFlag";

export const metadata = { title: "Connexion · AureakForm" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const error = sp.error;

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-2 justify-center">
          <BurundiFlag width={40} />
          <div className="font-[family-name:var(--font-bebas)] text-3xl tracking-[2px]">
            AUREAK<span className="text-[#c9a44b]">FORM</span>
          </div>
        </div>
        <p className="text-center text-[#8b93a7] text-xs mb-10 uppercase tracking-widest font-[family-name:var(--font-oswald)]">
          Sélection nationale · Burundi
        </p>

        <form
          action={signIn}
          className="space-y-4 rounded-2xl border border-white/5 bg-[#131826] p-6"
        >
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
              Email
            </span>
            <input
              type="email"
              name="email"
              required
              autoFocus
              inputMode="email"
              autoComplete="email"
              placeholder="jeremy@aureak.be"
              className="mt-2 w-full rounded-xl bg-[#0a0e1a] border border-white/10 px-4 py-3.5 text-[16px] focus:outline-none focus:border-[#c9a44b]"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
              Mot de passe
            </span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="mt-2 w-full rounded-xl bg-[#0a0e1a] border border-white/10 px-4 py-3.5 text-[16px] focus:outline-none focus:border-[#c9a44b]"
            />
          </label>

          {error && (
            <p className="text-xs text-[#ff4d5e]">
              {error === "missing_email"
                ? "Email manquant."
                : error === "missing_password"
                  ? "Mot de passe manquant."
                  : error === "Invalid login credentials"
                    ? "Email ou mot de passe incorrect."
                    : error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl py-4 font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-sm bg-gradient-to-br from-[#f6e3a1] via-[#c9a44b] to-[#806224] text-[#1c1206] shadow-lg active:scale-[.98] transition"
          >
            Se connecter
          </button>
        </form>
      </div>
    </main>
  );
}
