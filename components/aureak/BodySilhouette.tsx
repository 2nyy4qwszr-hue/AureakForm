"use client";

import { useState } from "react";

export type BodyZone = {
  id: string;
  label: string;
  side: "left" | "right" | "center";
  view: "front" | "back";
};

type Props = {
  view: "front" | "back";
  selected: string | null;
  onSelect: (zone: BodyZone) => void;
};

/**
 * Silhouette SVG simplifiée — zones tactiles larges
 * (priorité : usabilité doigt > précision anatomique).
 */
export function BodySilhouette({ view, selected, onSelect }: Props) {
  return (
    <svg
      viewBox="0 0 200 460"
      className="w-full max-w-[280px] mx-auto"
      style={{ overflow: "visible" }}
    >
      {/* Silhouette globale en fond */}
      <BodyBackground view={view} />
      {(view === "front" ? FRONT_ZONES : BACK_ZONES).map((z) => (
        <ZoneButton
          key={z.id}
          zone={z}
          selected={selected === z.id}
          onClick={() => onSelect(z)}
        />
      ))}
    </svg>
  );
}

function ZoneButton({
  zone,
  selected,
  onClick,
}: {
  zone: BodyZone & { path: string };
  selected: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <g style={{ cursor: "pointer" }} onClick={onClick}
       onMouseEnter={() => setHover(true)}
       onMouseLeave={() => setHover(false)}>
      <path
        d={zone.path}
        fill={selected ? "#ff4d5e" : hover ? "#c9a44b" : "transparent"}
        stroke={selected ? "#ff4d5e" : "rgba(255,255,255,.18)"}
        strokeWidth={selected ? 1.5 : 1}
        opacity={selected ? 0.85 : hover ? 0.5 : 1}
      />
    </g>
  );
}

function BodyBackground({ view }: { view: "front" | "back" }) {
  const fill = "#1a2030";
  const stroke = "rgba(255,255,255,.08)";
  return (
    <>
      {/* head */}
      <circle cx="100" cy="32" r="22" fill={fill} stroke={stroke} />
      {/* neck */}
      <rect x="92" y="50" width="16" height="14" fill={fill} stroke={stroke} />
      {/* torso */}
      <path
        d="M68 64 L132 64 L138 200 L62 200 Z"
        fill={fill}
        stroke={stroke}
      />
      {/* arms */}
      <path d="M62 70 L40 80 L36 200 L52 200 L60 90 Z" fill={fill} stroke={stroke} />
      <path d="M138 70 L160 80 L164 200 L148 200 L140 90 Z" fill={fill} stroke={stroke} />
      {/* hands */}
      <circle cx="38" cy="208" r="10" fill={fill} stroke={stroke} />
      <circle cx="162" cy="208" r="10" fill={fill} stroke={stroke} />
      {/* hip */}
      <path d="M62 200 L138 200 L142 240 L58 240 Z" fill={fill} stroke={stroke} />
      {/* thighs */}
      <path d="M58 240 L98 240 L94 340 L66 340 Z" fill={fill} stroke={stroke} />
      <path d="M102 240 L142 240 L134 340 L106 340 Z" fill={fill} stroke={stroke} />
      {/* knees */}
      <ellipse cx="80" cy="346" rx="14" ry="8" fill={fill} stroke={stroke} />
      <ellipse cx="120" cy="346" rx="14" ry="8" fill={fill} stroke={stroke} />
      {/* calves */}
      <path d="M66 354 L94 354 L90 430 L72 430 Z" fill={fill} stroke={stroke} />
      <path d="M106 354 L134 354 L128 430 L110 430 Z" fill={fill} stroke={stroke} />
      {/* feet */}
      <ellipse cx="81" cy="442" rx="14" ry="10" fill={fill} stroke={stroke} />
      <ellipse cx="119" cy="442" rx="14" ry="10" fill={fill} stroke={stroke} />
      {/* hint text */}
      <text x="100" y="455" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.3)">
        {view === "front" ? "FACE" : "DOS"}
      </text>
    </>
  );
}

// Zones tactiles — paths englobant les segments du corps avec marge confortable.
type ZoneWithPath = BodyZone & { path: string };

const FRONT_ZONES: ZoneWithPath[] = [
  { id: "head",          label: "Tête",            side: "center", view: "front", path: "M78,10 a22,22 0 1,0 44,0 a22,22 0 1,0 -44,0" },
  { id: "neck",          label: "Nuque/cou",       side: "center", view: "front", path: "M92,50 h16 v14 h-16 z" },
  { id: "chest",         label: "Pectoraux",       side: "center", view: "front", path: "M68,64 h64 v60 h-64 z" },
  { id: "abs",           label: "Abdos",           side: "center", view: "front", path: "M70,124 h60 v50 h-60 z" },
  { id: "shoulder-l",    label: "Épaule",          side: "left",   view: "front", path: "M40,72 L62,68 L60,90 L38,86 Z" },
  { id: "shoulder-r",    label: "Épaule",          side: "right",  view: "front", path: "M138,68 L160,72 L162,86 L140,90 Z" },
  { id: "arm-l",         label: "Bras",            side: "left",   view: "front", path: "M36,90 L60,90 L54,180 L36,180 Z" },
  { id: "arm-r",         label: "Bras",            side: "right",  view: "front", path: "M140,90 L164,90 L164,180 L146,180 Z" },
  { id: "hand-l",        label: "Main/poignet",    side: "left",   view: "front", path: "M28,200 L48,200 L50,220 L28,220 Z" },
  { id: "hand-r",        label: "Main/poignet",    side: "right",  view: "front", path: "M152,200 L172,200 L172,220 L150,220 Z" },
  { id: "hip-l",         label: "Hanche/aine",     side: "left",   view: "front", path: "M58,200 L100,200 L100,240 L58,240 Z" },
  { id: "hip-r",         label: "Hanche/aine",     side: "right",  view: "front", path: "M100,200 L142,200 L142,240 L100,240 Z" },
  { id: "quad-l",        label: "Quadriceps",      side: "left",   view: "front", path: "M58,240 L98,240 L94,340 L66,340 Z" },
  { id: "quad-r",        label: "Quadriceps",      side: "right",  view: "front", path: "M102,240 L142,240 L134,340 L106,340 Z" },
  { id: "knee-l",        label: "Genou",           side: "left",   view: "front", path: "M64,340 h32 v16 h-32 z" },
  { id: "knee-r",        label: "Genou",           side: "right",  view: "front", path: "M104,340 h32 v16 h-32 z" },
  { id: "shin-l",        label: "Tibia",           side: "left",   view: "front", path: "M66,356 L94,356 L90,432 L72,432 Z" },
  { id: "shin-r",        label: "Tibia",           side: "right",  view: "front", path: "M106,356 L134,356 L128,432 L110,432 Z" },
  { id: "ankle-foot-l",  label: "Cheville/pied",   side: "left",   view: "front", path: "M65,432 h32 v22 h-32 z" },
  { id: "ankle-foot-r",  label: "Cheville/pied",   side: "right",  view: "front", path: "M103,432 h32 v22 h-32 z" },
];

const BACK_ZONES: ZoneWithPath[] = [
  { id: "back-head",     label: "Arrière tête",    side: "center", view: "back", path: "M78,10 a22,22 0 1,0 44,0 a22,22 0 1,0 -44,0" },
  { id: "back-neck",     label: "Nuque",           side: "center", view: "back", path: "M92,50 h16 v14 h-16 z" },
  { id: "upper-back",    label: "Trapèzes/haut dos",side:"center", view: "back", path: "M68,64 h64 v54 h-64 z" },
  { id: "lower-back",    label: "Lombaires",       side: "center", view: "back", path: "M70,118 h60 v52 h-60 z" },
  { id: "glute-l",       label: "Fessier",         side: "left",   view: "back", path: "M58,170 L100,170 L100,240 L58,240 Z" },
  { id: "glute-r",       label: "Fessier",         side: "right",  view: "back", path: "M100,170 L142,170 L142,240 L100,240 Z" },
  { id: "tricep-l",      label: "Triceps",         side: "left",   view: "back", path: "M36,90 L60,90 L54,180 L36,180 Z" },
  { id: "tricep-r",      label: "Triceps",         side: "right",  view: "back", path: "M140,90 L164,90 L164,180 L146,180 Z" },
  { id: "hamstring-l",   label: "Ischios",         side: "left",   view: "back", path: "M58,240 L98,240 L94,340 L66,340 Z" },
  { id: "hamstring-r",   label: "Ischios",         side: "right",  view: "back", path: "M102,240 L142,240 L134,340 L106,340 Z" },
  { id: "back-knee-l",   label: "Arrière genou",   side: "left",   view: "back", path: "M64,340 h32 v16 h-32 z" },
  { id: "back-knee-r",   label: "Arrière genou",   side: "right",  view: "back", path: "M104,340 h32 v16 h-32 z" },
  { id: "calf-l",        label: "Mollet",          side: "left",   view: "back", path: "M66,356 L94,356 L90,432 L72,432 Z" },
  { id: "calf-r",        label: "Mollet",          side: "right",  view: "back", path: "M106,356 L134,356 L128,432 L110,432 Z" },
  { id: "achilles-l",    label: "Tendon Achille",  side: "left",   view: "back", path: "M65,432 h32 v22 h-32 z" },
  { id: "achilles-r",    label: "Tendon Achille",  side: "right",  view: "back", path: "M103,432 h32 v22 h-32 z" },
];
