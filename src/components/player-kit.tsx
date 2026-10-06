import type { Player } from "@/lib/club";
import { cn } from "@/lib/utils";

export function PlayerKit({
  player,
  tone = "dark",
  goals,
}: {
  player: Player;
  tone?: "light" | "dark";
  goals?: number;
}) {
  const light = tone === "light";
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5",
        light ? "bg-kit-light text-accent-fg" : "bg-kit-dark text-fg",
      )}
    >
      <span
        className={cn(
          "w-8 text-center font-display text-2xl leading-none tabular-nums",
          light ? "text-accent-fg/80" : "text-accent",
        )}
      >
        {player.number ?? "–"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{player.nickname}</p>
        <p
          className={cn(
            "text-[0.65rem] tracking-[0.14em] uppercase",
            light ? "text-accent-fg/55" : "text-muted",
          )}
        >
          {player.position}
        </p>
      </div>
      {typeof goals === "number" && goals > 0 ? (
        <span className="text-xs font-medium tabular-nums">
          {goals} {goals === 1 ? "gol" : "gols"}
        </span>
      ) : null}
    </div>
  );
}
