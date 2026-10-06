import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useMe } from "@/components/me-context";
import { Badge } from "@/components/ui/badge";
import { RSVP_LABEL, type MatchDetail, type Player, type Rsvp } from "@/lib/club";
import { setRsvp } from "@/lib/club.fn";
import { cn } from "@/lib/utils";

const OPTIONS: Rsvp[] = ["yes", "maybe", "no"];

export function RsvpBoard({ match, players }: { match: MatchDetail; players: Player[] }) {
  const router = useRouter();
  const { canEditPlayer } = useMe();
  const byId = new Map(players.map((p) => [p.id, p]));
  const linked = new Set(match.squad.map((s) => s.playerId));
  const rows = [
    ...match.squad.map((s) => ({
      player: byId.get(s.playerId),
      rsvp: s.rsvp,
    })),
    ...players
      .filter((p) => !linked.has(p.id))
      .map((p) => ({ player: p, rsvp: "pending" as Rsvp })),
  ].filter((r): r is { player: Player; rsvp: Rsvp } => Boolean(r.player));

  rows.sort((a, b) => a.player.nickname.localeCompare(b.player.nickname, "pt-BR"));

  async function pick(playerId: number, rsvp: Rsvp) {
    try {
      await setRsvp({ data: { matchId: match.id, playerId, rsvp } });
      await router.invalidate();
    } catch {
      toast.error("Não deu para confirmar");
    }
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map(({ player, rsvp }) => (
        <li
          key={player.id}
          className="flex flex-col gap-2 rounded-lg bg-surface px-3 py-3 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 text-center font-display text-xl text-accent tabular-nums">
              {player.number ?? "–"}
            </span>
            <div>
              <p className="text-sm font-medium">{player.nickname}</p>
              <p className="text-xs text-muted">{player.position}</p>
            </div>
          </div>
          {!canEditPlayer(player.id) ? (
            <p className="text-xs text-muted sm:text-right">{RSVP_LABEL[rsvp]}</p>
          ) : (
            <div className="flex gap-1">
              {OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => pick(player.id, rsvp === opt ? "pending" : opt)}
                  className={cn(
                    "h-10 min-w-16 rounded-md px-3 text-xs font-medium transition-colors duration-150",
                    rsvp === opt
                      ? opt === "yes"
                        ? "bg-win/20 text-win"
                        : opt === "no"
                          ? "bg-loss/20 text-loss"
                          : "bg-subtle text-fg"
                      : "bg-subtle/60 text-muted hover:text-fg",
                  )}
                >
                  {RSVP_LABEL[opt]}
                </button>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function RsvpSummary({ match }: { match: MatchDetail }) {
  const yes = match.squad.filter((s) => s.rsvp === "yes").length;
  const maybe = match.squad.filter((s) => s.rsvp === "maybe").length;
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="accent">{yes} confirmados</Badge>
      <Badge>{maybe} em dúvida</Badge>
    </div>
  );
}
