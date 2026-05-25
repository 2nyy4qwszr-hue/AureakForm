"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ChartLine, HeartPulse, User } from "lucide-react";

const TABS = [
  { href: "/",        label: "Home",  Icon: Home },
  { href: "/me",      label: "Stats", Icon: ChartLine },
  { href: "/injury",  label: "Bobo",  Icon: HeartPulse },
  { href: "/profile", label: "Moi",   Icon: User },
];

export function BottomTabBar() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-around items-stretch px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+10px)] border-t border-white/5 bg-[#0a0e1a]/92 backdrop-blur-md">
      {TABS.map(({ href, label, Icon }) => {
        const active =
          href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              active ? "text-[#c9a44b]" : "text-[#8b93a7] hover:text-white"
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-[family-name:var(--font-oswald)] font-bold tracking-widest uppercase">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
