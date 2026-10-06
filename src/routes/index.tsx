import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { MatchTicket } from "@/components/match-ticket";
import { RankingTable } from "@/components/ranking-table";
import { Scoreboard } from "@/components/scoreboard";
import { getBoard } from "@/lib/club.fn";

export const Route = createFileRoute("/")({
  ssr: false,
  loader: () => getBoard(),
  component: Home,
});

function Home() {
  const { nextMatch, recent, ranking, scorers, players } = Route.useLoaderData();
  const last = recent[0];
  const topScorer = scorers.find((s) => s.goals > 0);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <p className="text-[0.65rem] tracking-[0.28em] text-muted uppercase">
          Society da Vila
        </p>
        <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">
          Domingo tem pelada.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
          Lista de presença, sorteio de camisa clara e escura, placar e a
          artilharia da galera — {players.length} no elenco.
        </p>
      </section>

      {nextMatch ? <MatchTicket match={nextMatch} /> : null}

      {last ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Último placar</h2>
            <Link
              to="/jogos"
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg"
            >
              Todos os jogos
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <Scoreboard match={last} />
        </section>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Tabela</h2>
            <Link
              to="/tabela"
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg"
            >
              Completa
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <RankingTable rows={ranking} compact />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-2xl">Artilharia</h2>
          <ol className="flex flex-col gap-2">
            {scorers
              .filter((s) => s.goals > 0)
              .slice(0, 6)
              .map((row, i) => (
                <li
                  key={row.player.id}
                  className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-display text-lg text-muted tabular-nums">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">
                      {row.player.nickname}
                    </span>
                  </div>
                  <span className="font-display text-2xl tabular-nums">
                    {row.goals}
                  </span>
                </li>
              ))}
          </ol>
          {topScorer ? (
            <p className="text-xs text-muted">
              Chuteira de ouro informal: {topScorer.player.nickname},{" "}
              {topScorer.goals} gols no ano.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
