"use client";

type Props = {
  options: { emoji: string; label: string; value: number }[];
  value: number | null;
  onChange: (v: number) => void;
};

export function EmojiPicker({ options, value, onChange }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2 w-full max-w-md mx-auto">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${
              active
                ? "border-[#c9a44b] bg-[#c9a44b]/15 scale-105"
                : "border-white/10 bg-[#131826] hover:border-white/30"
            }`}
          >
            <span style={{ fontSize: active ? 38 : 32 }}>{opt.emoji}</span>
            <span className="text-[9px] uppercase tracking-wider text-[#8b93a7] font-[family-name:var(--font-oswald)]">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
