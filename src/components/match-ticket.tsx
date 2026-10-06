import { Link } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMatchDay, rsvpCounts, type MatchDetail } from "@/lib/club";

export function MatchTicket({ match }: { match: MatchDetail }) {
  const counts = rsvpCounts(match.squad);
  return (
    <article className="relative overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-bg"
        aria-hidden
        style={{
          maskImage:
            "radial-gradient(circle at 0 12px, transparent 6px, black 6.5px)",
          WebkitMaskImage:
            "radial-gradient(circle at 0 12px, transparent 6px, black 6.5px)",
          maskSize: "12px 24px",
          WebkitMaskSize: "12px 24px",
        }}
      />
      <div className="px-6 py-6 pl-8">
        <p className="text-[0.65rem] tracking-[0.28em] text-muted uppercase">
          Próxima pelada · Ingresso
        </p>
        <h2 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
          {formatMatchDay(match.playedAt)}
        </h2>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" />
            {match.venue}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" />
            {match.kickoff}
          </span>
        </div>
        <div className="mt-6 flex items-end justify-between gap-4 border-t border-dashed border-border pt-5">
          <div>
            <p className="font-display text-4xl leading-none tabular-nums">
              {counts.yes}
            </p>
            <p className="mt-1 text-xs text-muted">
              confirmados · {counts.maybe} talvez
            </p>
          </div>
          <Button asChild>
            <Link to="/jogos/$id" params={{ id: String(match.id) }}>
              Confirmar presença
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
