import { createFileRoute } from "@tanstack/react-router";
import { RankingTable } from "@/components/ranking-table";
import { getBoard } from "@/lib/club.fn";

export const Route = createFileRoute("/tabela")({
  ssr: false,
  loader: () => getBoard(),
  component: TabelaPage,
});

function TabelaPage() {
  const { ranking, scorers } = Route.useLoaderData();
  const maxGoals = Math.max(1, ...scorers.map((s) => s.goals));

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-[0.65rem] tracking-[0.28em] text-muted uppercase">
          Campeonato informal
        </p>
        <h1 className="mt-1 font-display text-4xl">Tabela</h1>
        <p className="mt-2 max-w-lg text-sm text-muted">
          Três pontos por vitória, um pelo empate. Times mudam toda semana —
          a conta é individual.
        </p>
      </div>

      <RankingTable rows={ranking} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl">Artilharia</h2>
        <ul className="flex flex-col gap-2">
          {scorers.map((row) => (
            <li
              key={row.player.id}
              className="relative overflow-hidden rounded-lg bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
            >
              <span
                className="absolute inset-y-0 left-0 bg-accent/10"
                style={{ width: `${(row.goals / maxGoals) * 100}%` }}
                aria-hidden
              />
              <div className="relative flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{row.player.nickname}</p>
                <p className="font-display text-xl tabular-nums">{row.goals}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
