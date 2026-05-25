import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckinFlow } from "@/components/aureak/CheckinFlow";

export const metadata = { title: "Check-in du matin · AureakForm" };

export default async function CheckinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!player) redirect("/onboarding");

  return <CheckinFlow />;
}
