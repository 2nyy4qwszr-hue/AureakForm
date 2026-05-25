import { PlayerCard } from "@/components/aureak/PlayerCard";

/**
 * /demo — la grille des 4 tiers de cartes, telle qu'on l'a validée
 * sur le wireframe. Sert de référence visuelle et de smoke-test.
 */
export const metadata = { title: "Demo cartes · AureakForm" };

export default function DemoHome() {
  return (
    <main className="max-w-[1280px] mx-auto px-4 py-8 pb-20 flex-1">
      <header className="flex justify-between items-end gap-4 mb-7 px-2">
        <div>
          <div className="font-[family-name:var(--font-bebas)] text-[28px] tracking-[2px]">
            AUREAK<span className="text-[#c9a44b]">FORM</span>
          </div>
          <div className="text-[#8b93a7] text-xs">Demo · les 4 tiers de cartes</div>
        </div>
      </header>

      <div className="grid gap-5 px-2 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
        <PlayerCard
          ovr={87}
          name="Devriendt"
          firstName="Jérémy"
          position="MIL"
          streak={7}
          xp={1240}
          stats={{ forme: 88, sleep: 82, recovery: 85, physical: 91, mental: 90, regularity: 86 }}
        />
        <PlayerCard
          ovr={72}
          name="Martens"
          firstName="Lucas"
          position="ATT"
          streak={3}
          xp={480}
          stats={{ forme: 74, sleep: 68, recovery: 71, physical: 76, mental: 72, regularity: 70 }}
        />
        <PlayerCard
          ovr={58}
          name="Claes"
          firstName="Thomas"
          position="DEF"
          footerLeft="⚠ FATIGUE"
          xp={90}
          stats={{ forme: 52, sleep: 48, recovery: 55, physical: 61, mental: 60, regularity: 58 }}
        />
        <PlayerCard
          ovr={94}
          name="Casteels"
          firstName="Nigel"
          position="GK"
          footerLeft="★ TEAM OF THE WEEK"
          xp={3120}
          stats={{ forme: 95, sleep: 93, recovery: 94, physical: 96, mental: 92, regularity: 94 }}
        />
      </div>
    </main>
  );
}
