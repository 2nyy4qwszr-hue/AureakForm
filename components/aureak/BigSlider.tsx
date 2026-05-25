"use client";

import { useState } from "react";

type Props = {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  /** color gradient endpoints — green=good, red=bad (or inverted) */
  inverted?: boolean;
  unit?: string;
  /** override displayed value */
  displayValue?: (v: number) => string;
};

/**
 * Slider tactile très visible : valeur géante au-dessus, gradient en fond,
 * piste épaisse, thumb grosse. Optimisé tap-and-drag mobile.
 */
export function BigSlider({
  min = 1,
  max = 10,
  step = 1,
  value,
  onChange,
  inverted = false,
  unit,
  displayValue,
}: Props) {
  const [v, setV] = useState(value);

  const pct = ((v - min) / (max - min)) * 100;
  const colorStart = inverted ? "#2bd47d" : "#ff4d5e";
  const colorEnd = inverted ? "#ff4d5e" : "#2bd47d";

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <div
          className="font-[family-name:var(--font-bebas)] leading-none"
          style={{
            fontSize: 96,
            color: pctColor(pct, inverted),
          }}
        >
          {displayValue ? displayValue(v) : v}
          {unit && (
            <span className="text-2xl text-[#8b93a7] ml-2 align-middle">
              {unit}
            </span>
          )}
        </div>
      </div>

      <div className="px-2">
        <div
          className="relative h-3 rounded-full overflow-hidden"
          style={{
            background: `linear-gradient(to right, ${colorStart}, ${colorEnd})`,
            opacity: 0.35,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={v}
          onChange={(e) => {
            const nv = Number(e.target.value);
            setV(nv);
            onChange(nv);
          }}
          className="aureakform-range absolute left-0 right-0 mt-[-22px] mx-2 w-[calc(100%-16px)] h-11 appearance-none bg-transparent"
          style={{
            // visible thumb position via background
            background: "transparent",
          }}
          aria-label="slider"
        />
        <style jsx>{`
          .aureakform-range::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #f6e3a1;
            border: 3px solid #c9a44b;
            box-shadow: 0 6px 16px -4px rgba(0,0,0,.6);
            cursor: pointer;
          }
          .aureakform-range::-moz-range-thumb {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #f6e3a1;
            border: 3px solid #c9a44b;
            box-shadow: 0 6px 16px -4px rgba(0,0,0,.6);
            cursor: pointer;
          }
        `}</style>
        <div className="flex justify-between text-[10px] text-[#8b93a7] mt-2 px-1 font-[family-name:var(--font-oswald)] uppercase tracking-widest">
          <span>{min}{unit ?? ""}</span>
          <span style={{ marginLeft: `${pct}%`, transform: "translateX(-50%)" }}>
            {/* spacer */}
          </span>
          <span>{max}{unit ?? ""}</span>
        </div>
      </div>
    </div>
  );
}

function pctColor(pct: number, inverted: boolean): string {
  const adjusted = inverted ? 100 - pct : pct;
  if (adjusted < 30) return "#ff4d5e";
  if (adjusted < 60) return "#ffa42b";
  return "#2bd47d";
}
