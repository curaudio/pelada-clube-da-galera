import { createFileRoute, Link } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { Shuffle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMe } from "@/components/me-context";
import { PlayerKit } from "@/components/player-kit";
import { Button } from "@/components/ui/button";
import { formatMatchDay, type Player } from "@/lib/club";
import { drawTeams, getBoard } from "@/lib/club.fn";

export const Route = createFileRoute("/sorteio")({
  ssr: false,
  loader: () => getBoard(),
  component: SorteioPage,
});

function SorteioPage() {
  const { nextMatch, players } = Route.useLoaderData();
  const router = useRouter();
  const { isAdmin } = useMe();
  const [pending, setPending] = useState(false);
  const byId = new Map(players.map((p) => [p.id, p]));

  if (!nextMatch) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-4xl">Sorteio</h1>
        <p className="text-sm text-muted">
          Não tem pelada aberta. Marca um jogo primeiro.
        </p>
        <Button asChild className="w-fit">
          <Link to="/jogos">Ver jogos</Link>
        </Button>
      </div>
    );
  }

  const match = nextMatch;
  const confirmed = match.squad
    .filter((s) => s.rsvp === "yes")
    .map((s) => byId.get(s.playerId))
    .filter((p): p is Player => Boolean(p));

  const teamA = match.squad
    .filter((s) => s.team === "a")
    .map((s) => byId.get(s.playerId))
    .filter((p): p is Player => Boolean(p));
  const teamB = match.squad
    .filter((s) => s.team === "b")
    .map((s) => byId.get(s.playerId))
    .filter((p): p is Player => Boolean(p));
  const drawn = teamA.length + teamB.length > 0;

  async function onDraw() {
    setPending(true);
    try {
      await drawTeams({ data: { matchId: match.id } });
      toast.success("Times sorteados");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sorteio falhou");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] tracking-[0.28em] text-muted uppercase">
            {formatMatchDay(match.playedAt)}
          </p>
          <h1 className="mt-1 font-display text-4xl">Sorteio</h1>
          <p className="mt-2 max-w-md text-sm text-muted">
            Times equilibrados pelo desempenho, com os goleiros em lados opostos. {confirmed.length}{" "}
            confirmados nesta pelada.
          </p>
        </div>
        {isAdmin ? (
          <Button onClick={onDraw} disabled={pending || confirmed.length < 4}>
            <Shuffle className="size-4" />
            {pending ? "Sorteando…" : drawn ? "Sortear de novo" : "Sortear times"}
          </Button>
        ) : null}
      </div>

      {!drawn && !isAdmin ? (
        <p className="text-sm text-muted">
          O administrador ainda não sorteou os times.
        </p>
      ) : null}

      {drawn ? (
        <div className="grid gap-4 md:grid-cols-2">
          <TeamColumn title={match.teamAName} players={teamA} tone="light" />
          <TeamColumn title={match.teamBName} players={teamB} tone="dark" />
        </div>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-2xl">No bolo</h2>
          {confirmed.length === 0 ? (
            <p className="text-sm text-muted">
              Ninguém confirmou ainda.{" "}
              <Link
                to="/jogos/$id"
                params={{ id: String(match.id) }}
                className="text-fg underline decoration-border underline-offset-4"
              >
                Abrir a lista
              </Link>
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {confirmed.map((p) => (
                <li key={p.id}>
                  <PlayerKit player={p} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function TeamColumn({
  title,
  players,
  tone,
}: {
  title: string;
  players: Player[];
  tone: "light" | "dark";
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="font-display text-2xl">{title}</h2>
        <span className="text-xs text-muted tabular-nums">
          {players.length} jogadores
        </span>
      </div>
      {players.map((p) => (
        <PlayerKit key={p.id} player={p} tone={tone} />
      ))}
    </div>
  );
}
