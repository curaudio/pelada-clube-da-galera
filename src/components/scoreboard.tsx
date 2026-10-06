import { Link } from "@tanstack/react-router";
import { formatShortDay, type Match } from "@/lib/club";

export function Scoreboard({ match }: { match: Match }) {
  return (
    <Link
      to="/jogos/$id"
      params={{ id: String(match.id) }}
      className="block rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <p className="text-[0.65rem] tracking-[0.22em] text-muted uppercase">
        {formatShortDay(match.playedAt)} · {match.venue}
      </p>
      <p className="mt-4 text-center font-display text-5xl leading-none tabular-nums">
        {match.scoreA ?? "–"}
        <span className="mx-3 text-muted">–</span>
        {match.scoreB ?? "–"}
      </p>
      <div className="mt-3 flex items-center justify-between gap-4 text-sm">
        <p className="min-w-0 truncate font-medium">{match.teamAName}</p>
        <p className="min-w-0 truncate text-right font-medium">{match.teamBName}</p>
      </div>
    </Link>
  );
}
