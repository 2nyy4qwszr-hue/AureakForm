import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostSessionForm } from "./PostSessionForm";

export const metadata = { title: "Post-séance · AureakForm" };

export default async function PostSessionPage() {
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

  return <PostSessionForm />;
}
