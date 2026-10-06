import { FormPills } from "@/components/form-pills";
import type { PlayerStat } from "@/lib/club";
import { cn } from "@/lib/utils";

export function RankingTable({
  rows,
  compact = false,
}: {
  rows: PlayerStat[];
  compact?: boolean;
}) {
  const shown = compact ? rows.slice(0, 8) : rows;
  const maxPoints = Math.max(1, ...shown.map((r) => r.points));

  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <div className="grid grid-cols-[2rem_1fr_auto] gap-3 border-b border-border px-4 py-3 text-[0.65rem] tracking-[0.16em] text-muted uppercase">
        <span>#</span>
        <span>Jogador</span>
        <span className="text-right">Pts · Gols</span>
      </div>
      <ol>
        {shown.map((row, i) => (
          <li
            key={row.player.id}
            className="relative grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 py-3"
          >
            <span
              className="absolute inset-y-0 left-0 bg-accent/10"
              style={{ width: `${(row.points / maxPoints) * 100}%` }}
              aria-hidden
            />
            <span
              className={cn(
                "relative font-display text-lg tabular-nums",
                i === 0 ? "text-accent" : "text-muted",
              )}
            >
              {i + 1}
            </span>
            <div className="relative min-w-0">
              <p className="truncate text-sm font-medium">
                {row.player.nickname}
                <span className="ml-2 text-xs text-muted">
                  {row.player.position}
                </span>
              </p>
              <div className="mt-1 flex items-center gap-2">
                <FormPills form={row.form} />
                <span className="text-[0.65rem] text-muted tabular-nums">
                  {row.games}J {row.wins}V {row.draws}E {row.losses}D
                </span>
              </div>
            </div>
            <div className="relative text-right">
              <p className="font-display text-xl leading-none tabular-nums">
                {row.points}
              </p>
              <p className="mt-1 text-xs text-muted tabular-nums">
                {row.goals} gols
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
