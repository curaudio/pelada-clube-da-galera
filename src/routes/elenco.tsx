import { createFileRoute } from "@tanstack/react-router";
import { AddPlayerDialog, EditPlayerDialog } from "@/components/add-player-dialog";
import { useMe } from "@/components/me-context";
import { POSITIONS, type Position } from "@/lib/club";
import { getBoard } from "@/lib/club.fn";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/elenco")({
  ssr: false,
  loader: () => getBoard(),
  component: ElencoPage,
});

const ORDER: Position[] = ["GOL", "ZAG", "LAT", "MEI", "ATA"];

function ElencoPage() {
  const { players, ranking } = Route.useLoaderData();
  const { isAdmin, canEditPlayer } = useMe();
  const stats = new Map(ranking.map((r) => [r.player.id, r]));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] tracking-[0.28em] text-muted uppercase">
            Elenco
          </p>
          <h1 className="mt-1 font-display text-4xl">A galera</h1>
          <p className="mt-2 text-sm text-muted">
            {players.length} nomes. Apelido na camisa, número opcional.
          </p>
        </div>
        {isAdmin ? <AddPlayerDialog /> : null}
      </div>

      {ORDER.map((pos) => {
        const group = players.filter((p) => p.position === pos);
        if (group.length === 0) return null;
        const label = POSITIONS.find((p) => p.id === pos)?.label ?? pos;
        return (
          <section key={pos} className="flex flex-col gap-3">
            <h2 className="text-xs tracking-[0.2em] text-muted uppercase">
              {label}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {group.map((player) => {
                const row = stats.get(player.id);
                return (
                  <li
                    key={player.id}
                    className="flex items-center gap-4 rounded-lg bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
                  >
                    <span
                      className={cn(
                        "w-10 text-center font-display text-3xl leading-none tabular-nums",
                        "text-accent",
                      )}
                    >
                      {player.number ?? "–"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {player.nickname}
                      </p>
                      <p className="truncate text-xs text-muted">{player.name}</p>
                    </div>
                    <div className="text-right text-xs text-muted tabular-nums">
                      <p>{row?.points ?? 0} pts</p>
                      <p>{row?.goals ?? 0} gols</p>
                    </div>
                    {canEditPlayer(player.id) ? (
                      <EditPlayerDialog player={player} canDelete={isAdmin} />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
