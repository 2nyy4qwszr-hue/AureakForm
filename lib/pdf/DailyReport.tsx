/* @react-pdf/renderer définit ses propres types pour les éléments JSX. */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const COLORS = {
  bg: "#0a0e1a",
  ink: "#f4f5f7",
  muted: "#8b93a7",
  gold: "#c9a44b",
  green: "#2bd47d",
  orange: "#ffa42b",
  red: "#ff4d5e",
  line: "#1a2030",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    color: COLORS.ink,
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  h1: { fontSize: 24, color: COLORS.ink, marginBottom: 2, fontWeight: 700, letterSpacing: 2 },
  h2: { fontSize: 9, color: COLORS.gold, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  sub: { fontSize: 9, color: COLORS.muted, marginBottom: 18 },
  row: { flexDirection: "row" },
  card: { backgroundColor: COLORS.line, padding: 10, borderRadius: 6, marginRight: 8, flex: 1 },
  cardLabel: { fontSize: 7, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  cardValue: { fontSize: 22, fontWeight: 700 },
  section: { marginTop: 18 },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: COLORS.line,
    borderRadius: 4,
    marginBottom: 4,
  },
  ovrPill: {
    width: 36,
    padding: 6,
    borderRadius: 4,
    textAlign: "center",
    fontSize: 13,
    fontWeight: 700,
    marginRight: 10,
  },
  pname: { flex: 1, fontSize: 11 },
  ppos: { fontSize: 8, color: COLORS.muted, width: 30 },
  pmeta: { fontSize: 8, color: COLORS.muted, width: 140, textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 7,
    color: COLORS.muted,
    textAlign: "center",
  },
});

export type ReportPlayer = {
  id: string;
  name: string;
  position: string | null;
  ovr: number | null;
  checkedIn: boolean;
  fatigue?: number | null;
  soreness?: number | null;
  sleep_hours?: number | null;
};

export type ReportInjury = {
  id: string;
  player_name: string;
  body_part: string;
  body_side: string | null;
  type: string | null;
  intensity: number | null;
  declared_at: string;
  comment: string | null;
};

type Props = {
  date: string;
  selection: string;
  players: ReportPlayer[];
  injuries: ReportInjury[];
};

export function DailyReport({ date, selection, players, injuries }: Props) {
  const checkedIn = players.filter((p) => p.checkedIn).length;
  const alerts = players.filter((p) => p.ovr !== null && p.ovr < 60).length;
  const bronze = players
    .filter((p) => p.ovr !== null && p.ovr < 60)
    .sort((a, b) => (a.ovr ?? 0) - (b.ovr ?? 0));
  const top3 = [...players]
    .filter((p) => p.ovr !== null)
    .sort((a, b) => (b.ovr ?? 0) - (a.ovr ?? 0))
    .slice(0, 3);
  const noShow = players.filter((p) => !p.checkedIn);

  return (
    <Document title={`AureakForm — Daily ${date}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>AUREAKFORM</Text>
        <Text style={s.sub}>
          {selection} · {new Date(date).toLocaleDateString("fr-FR", {
            weekday: "long", day: "2-digit", month: "long", year: "numeric",
          })}
        </Text>

        {/* Summary */}
        <View style={s.row}>
          <View style={s.card}>
            <Text style={s.cardLabel}>Joueurs</Text>
            <Text style={s.cardValue}>{players.length}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardLabel}>Check-ins</Text>
            <Text style={s.cardValue}>{checkedIn}/{players.length}</Text>
          </View>
          <View style={[s.card, alerts > 0 ? { backgroundColor: "#3a1218" } : {}]}>
            <Text style={s.cardLabel}>Alertes ovr&lt;60</Text>
            <Text style={[s.cardValue, alerts > 0 ? { color: COLORS.red } : {}]}>{alerts}</Text>
          </View>
          <View style={[s.card, { marginRight: 0 }, injuries.length > 0 ? { backgroundColor: "#3a1218" } : {}]}>
            <Text style={s.cardLabel}>Bobos ouverts</Text>
            <Text style={[s.cardValue, injuries.length > 0 ? { color: COLORS.red } : {}]}>{injuries.length}</Text>
          </View>
        </View>

        {/* Bronze / alertes */}
        {bronze.length > 0 && (
          <View style={s.section}>
            <Text style={s.h2}>⚠ Joueurs en alerte ({bronze.length})</Text>
            {bronze.map((p) => (
              <View key={p.id} style={s.playerRow}>
                <Text style={[s.ovrPill, { backgroundColor: "#3a1218", color: COLORS.red }]}>
                  {p.ovr ?? "—"}
                </Text>
                <Text style={s.pname}>{p.name}</Text>
                <Text style={s.ppos}>{p.position ?? ""}</Text>
                <Text style={s.pmeta}>
                  Fatigue {p.fatigue ?? "—"}/10 · Douleur {p.soreness ?? "—"}/10
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Top 3 */}
        {top3.length > 0 && (
          <View style={s.section}>
            <Text style={s.h2}>★ Top 3 readiness</Text>
            {top3.map((p) => (
              <View key={p.id} style={s.playerRow}>
                <Text style={[s.ovrPill, { backgroundColor: "#0d2f1a", color: COLORS.green }]}>
                  {p.ovr ?? "—"}
                </Text>
                <Text style={s.pname}>{p.name}</Text>
                <Text style={s.ppos}>{p.position ?? ""}</Text>
                <Text style={s.pmeta}>
                  Sommeil {p.sleep_hours ?? "—"}h · OK
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Injuries */}
        {injuries.length > 0 && (
          <View style={s.section} break={injuries.length > 5}>
            <Text style={s.h2}>Blessures ouvertes ({injuries.length})</Text>
            {injuries.map((inj) => (
              <View key={inj.id} style={s.playerRow}>
                <Text style={[s.ovrPill, { backgroundColor: "#3a1218", color: COLORS.red }]}>
                  {inj.intensity ?? "—"}
                </Text>
                <Text style={s.pname}>
                  {inj.player_name} · {inj.body_part}
                  {inj.body_side && inj.body_side !== "center" ? ` (${inj.body_side === "left" ? "G" : "D"})` : ""}
                </Text>
                <Text style={s.pmeta}>
                  {inj.type ?? "—"} · {new Date(inj.declared_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* No-show */}
        {noShow.length > 0 && (
          <View style={s.section}>
            <Text style={s.h2}>Sans check-in aujourd{"’"}hui ({noShow.length})</Text>
            <Text style={{ fontSize: 9, color: COLORS.muted, lineHeight: 1.4 }}>
              {noShow.map((p) => p.name).join(" · ")}
            </Text>
          </View>
        )}

        <Text style={s.footer}>
          AureakForm · {selection} · généré le {new Date().toLocaleString("fr-FR")}
        </Text>
      </Page>
    </Document>
  );
}
