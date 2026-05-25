type Props = {
  className?: string;
  /** width in px (height auto-scales to maintain 3:2 ratio) */
  width?: number;
};

/**
 * Drapeau du Burundi 🇧🇮 en SVG inline.
 * Croix blanche en sautoir sur fond rouge/vert, disque blanc central
 * avec 3 étoiles rouges (simplifiées en pastilles à cette taille).
 */
export function BurundiFlag({ className, width = 26 }: Props) {
  return (
    <svg
      className={className}
      width={width}
      viewBox="0 0 3 2"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Drapeau du Burundi"
      style={{ display: "block", borderRadius: 3 }}
    >
      <polygon points="0,0 3,0 1.5,1" fill="#CE1126" />
      <polygon points="3,0 3,2 1.5,1" fill="#1EB53A" />
      <polygon points="0,2 3,2 1.5,1" fill="#CE1126" />
      <polygon points="0,0 0,2 1.5,1" fill="#1EB53A" />
      <line x1="0" y1="0" x2="3" y2="2" stroke="#fff" strokeWidth="0.3" />
      <line x1="3" y1="0" x2="0" y2="2" stroke="#fff" strokeWidth="0.3" />
      <circle cx="1.5" cy="1" r="0.55" fill="#fff" />
      <circle cx="1.5" cy="0.66" r="0.12" fill="#CE1126" />
      <circle cx="1.22" cy="1.17" r="0.12" fill="#CE1126" />
      <circle cx="1.78" cy="1.17" r="0.12" fill="#CE1126" />
    </svg>
  );
}
