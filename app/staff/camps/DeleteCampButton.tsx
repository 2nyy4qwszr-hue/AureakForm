"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteCamp } from "./actions";

export function DeleteCampButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!confirm(`Supprimer le camp "${name}" ?\nLa liste des convoqués sera également supprimée.\nL'historique des check-ins reste intact.`)) return;
    startTransition(async () => {
      await deleteCamp(id);
    });
  };

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      className="rounded-lg px-2 py-2 text-xs text-[#8b93a7] hover:bg-[#ff4d5e]/10 hover:text-[#ff4d5e] transition"
      title="Supprimer ce camp"
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  );
}
