import { createFileRoute, Link } from "@tanstack/react-router";
import { CreateMatchDialog } from "@/components/create-match-dialog";
import { useMe } from "@/components/me-context";
import { Badge } from "@/components/ui/badge";
import { formatMatchDay } from "@/lib/club";
import { getBoard } from "@/lib/club.fn";

export const Route = createFileRoute("/jogos/")({
  ssr: false,
  loader: () => getBoard(),
  component: JogosPage,
});

function JogosPage() {
  const { matches } = Route.useLoaderData();
  const { isAdmin } = useMe();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] tracking-[0.28em] text-muted uppercase">
            Calendário
          </p>
          <h1 className="mt-1 font-display text-4xl">Os jogos</h1>
          <p className="mt-2 text-sm text-muted">
            Marca a data, confirma a galera, anota o placar.
          </p>
        </div>
        {isAdmin ? <CreateMatchDialog /> : null}
      </div>

      <ul className="flex flex-col gap-3">
        {matches.map((match) => (
          <li key={match.id}>
            <Link
              to="/jogos/$id"
              params={{ id: String(match.id) }}
              className="flex items-center justify-between gap-4 rounded-xl bg-surface px-5 py-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {formatMatchDay(match.playedAt)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {match.venue} · {match.kickoff}
                </p>
              </div>
              {match.status === "done" &&
              match.scoreA !== null &&
              match.scoreB !== null ? (
                <p className="shrink-0 font-display text-3xl tabular-nums">
                  {match.scoreA}
                  <span className="mx-1 text-muted">–</span>
                  {match.scoreB}
                </p>
              ) : (
                <Badge>Aberta</Badge>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
