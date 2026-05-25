import Link from "next/link";
import { sendMagicLink } from "./actions";
import { BurundiFlag } from "@/components/aureak/BurundiFlag";

export const metadata = { title: "Connexion · AureakForm" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; email?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const sent = sp.sent === "1";
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

        {sent ? (
          <div className="rounded-2xl border border-[#2bd47d]/30 bg-[#2bd47d]/10 p-6 text-center">
            <div className="text-3xl mb-2">📬</div>
            <h2 className="font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wider text-[#2bd47d] mb-2">
              Email envoyé
            </h2>
            <p className="text-sm text-[#cfd6e6]">
              Un lien magique a été envoyé à <b>{sp.email}</b>. Clique
              dessus depuis ton téléphone pour te connecter.
            </p>
            <p className="text-xs text-[#8b93a7] mt-4">
              Vérifie tes spams si tu ne vois rien dans 1 min.
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 text-xs text-[#c9a44b] underline"
            >
              ← renvoyer
            </Link>
          </div>
        ) : (
          <form
            action={sendMagicLink}
            className="space-y-4 rounded-2xl border border-white/5 bg-[#131826] p-6"
          >
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-[#8b93a7] font-[family-name:var(--font-oswald)] font-bold">
                Ton email
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

            {error && (
              <p className="text-xs text-[#ff4d5e]">
                ⚠️ {error === "missing_email" ? "Email manquant." : error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl py-4 font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase text-sm bg-gradient-to-br from-[#f6e3a1] via-[#c9a44b] to-[#806224] text-[#1c1206] shadow-lg active:scale-[.98] transition"
            >
              Recevoir mon lien magique →
            </button>
            <p className="text-[11px] text-[#8b93a7] text-center">
              Pas de mot de passe. Tu reçois un lien à cliquer.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
