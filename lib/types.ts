/** Shared Supabase row types — kept hand-written for MVP. */

export type Position = "GK" | "DEF" | "MIL" | "ATT";

export type PlayerRow = {
  id: string;
  selection_id: string | null;
  user_id: string | null;
  first_name: string;
  last_name: string;
  position: Position | null;
  jersey_number: number | null;
  photo_url: string | null;
  date_of_birth: string | null;
  created_at: string;
};

export type DailyCheckinRow = {
  id: string;
  player_id: string;
  date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  fatigue: number | null;
  muscle_soreness: number | null;
  soreness_zone: string | null;
  stress: number | null;
  mood: number | null;
  appetite: number | null;
  readiness_score: number | null;
  created_at: string;
};

export type PostSessionRow = {
  id: string;
  player_id: string;
  session_date: string;
  session_type: "training" | "match" | null;
  rpe: number | null;
  enjoyment: number | null;
  self_performance: number | null;
  minutes: number | null;
  created_at: string;
};

export type InjuryRow = {
  id: string;
  player_id: string;
  declared_at: string;
  body_part: string;
  body_side: "left" | "right" | "center" | null;
  body_view: "front" | "back" | null;
  type: "contracture" | "douleur" | "coup" | "autre" | null;
  intensity: number | null;
  comment: string | null;
  resolved_at: string | null;
};

export type SelectionRow = {
  id: string;
  name: string;
  country_code: string;
  created_at: string;
};

export type RequestKind = "morning_checkin" | "post_session";

export type RequestRow = {
  id: string;
  selection_id: string;
  kind: RequestKind;
  title: string | null;
  message: string | null;
  context: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  due_at: string | null;
  active: boolean;
};
