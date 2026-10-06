import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus, RotateCcw, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMe } from "@/components/me-context";
import { PlayerKit } from "@/components/player-kit";
import { RsvpBoard, RsvpSummary } from "@/components/rsvp-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMatchDay, type MatchDetail, type Player } from "@/lib/club";
import { deleteMatch, getMatchById, reopenMatch, setPlayerGoals, setScore } from "@/lib/club.fn";

export const Route = createFileRoute("/jogos/$id")({
  ssr: false,
  loader: async ({ params }) => {
    const id = Number(params.id);
    const data = await getMatchById({ data: { id } });
    if (!data) throw new Error("Pelada não encontrada");
    return data;
  },
  component: MatchPage,
});

function MatchPage() {
  const { match, players } = Route.useLoaderData();
  const { isAdmin } = useMe();
  const byId = new Map(players.map((p) => [p.id, p]));
  const isOpen = match.status !== "done";

  const teamA = match.squad
    .filter((s) => s.team === "a")
    .map((s) => ({ ...s, player: byId.get(s.playerId) }))
    .filter((s): s is typeof s & { player: Player } => Boolean(s.player));
  const teamB = match.squad
    .filter((s) => s.team === "b")
    .map((s) => ({ ...s, player: byId.get(s.playerId) }))
    .filter((s): s is typeof s & { player: Player } => Boolean(s.player));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          to="/jogos"
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg"
        >
          <ArrowLeft className="size-3.5" />
          Jogos
        </Link>
        <h1 className="mt-3 font-display text-4xl leading-tight">
          {formatMatchDay(match.playedAt)}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {match.venue} · {match.kickoff}
        </p>
      </div>

      <MatchActions match={match} players={players} />

      {isOpen ? (
        <>
          <RsvpSummary match={match} />
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-2xl">Quem vai</h2>
            <RsvpBoard match={match} players={players} />
          </section>
          {isAdmin ? (
            <ScoreForm
              matchId={match.id}
              initialA={match.scoreA ?? 0}
              initialB={match.scoreB ?? 0}
              nameA={match.teamAName}
              nameB={match.teamBName}
            />
          ) : null}
        </>
      ) : (
        <div className="rounded-xl bg-surface px-5 py-6 text-center shadow-[var(--shadow-border)]">
          <p className="text-[0.65rem] tracking-[0.22em] text-muted uppercase">Placar final</p>
          <p className="mt-3 font-display text-6xl tabular-nums">
            {match.scoreA}
            <span className="mx-2 text-muted">–</span>
            {match.scoreB}
          </p>
          <p className="mt-2 text-sm text-muted">
            {match.teamAName} · {match.teamBName}
          </p>
        </div>
      )}

      {teamA.length > 0 || teamB.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h2 className="text-xs tracking-[0.18em] text-muted uppercase">{match.teamAName}</h2>
            {teamA.map((row) => (
              <GoalRow
                key={row.playerId}
                matchId={match.id}
                player={row.player}
                goals={row.goals}
                tone="light"
                editable={!isOpen && isAdmin}
              />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xs tracking-[0.18em] text-muted uppercase">{match.teamBName}</h2>
            {teamB.map((row) => (
              <GoalRow
                key={row.playerId}
                matchId={match.id}
                player={row.player}
                goals={row.goals}
                tone="dark"
                editable={!isOpen && isAdmin}
              />
            ))}
          </div>
        </section>
      ) : isOpen ? (
        <p className="text-sm text-muted">
          Depois da lista, o sorteio monta os times na aba Sorteio.
        </p>
      ) : null}
    </div>
  );
}

function ScoreForm({
  matchId,
  initialA,
  initialB,
  nameA,
  nameB,
}: {
  matchId: number;
  initialA: number;
  initialB: number;
  nameA: string;
  nameB: string;
}) {
  const router = useRouter();
  const [a, setA] = useState(String(initialA));
  const [b, setB] = useState(String(initialB));
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await setScore({
        data: { matchId, scoreA: Number(a), scoreB: Number(b) },
      });
      toast.success("Placar fechado");
      await router.invalidate();
    } catch {
      toast.error("Não deu para salvar o placar");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
    >
      <h2 className="font-display text-2xl">Fechar placar</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="score-a">{nameA}</Label>
          <Input
            id="score-a"
            inputMode="numeric"
            value={a}
            onChange={(e) => setA(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="score-b">{nameB}</Label>
          <Input
            id="score-b"
            inputMode="numeric"
            value={b}
            onChange={(e) => setB(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Encerrar jogo"}
      </Button>
    </form>
  );
}

function GoalRow({
  matchId,
  player,
  goals,
  tone,
  editable,
}: {
  matchId: number;
  player: Player;
  goals: number;
  tone: "light" | "dark";
  editable: boolean;
}) {
  const router = useRouter();

  async function bump(next: number) {
    try {
      await setPlayerGoals({ data: { matchId, playerId: player.id, goals: next } });
      await router.invalidate();
    } catch {
      toast.error("Não deu para anotar o gol");
    }
  }

  if (!editable) {
    return <PlayerKit player={player} tone={tone} goals={goals} />;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <PlayerKit player={player} tone={tone} goals={goals} />
      </div>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-10"
          onClick={() => bump(Math.max(0, goals - 1))}
          aria-label="Tirar gol"
        >
          <Minus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-10"
          onClick={() => bump(goals + 1)}
          aria-label="Marcar gol"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function MatchActions({ match, players }: { match: MatchDetail; players: Player[] }) {
  const router = useRouter();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const { isAdmin } = useMe();
  const isOpen = match.status !== "done";

  function share() {
    const byId = new Map(players.map((p) => [p.id, p]));
    const names = (rsvp: string) =>
      match.squad
        .filter((s) => s.rsvp === rsvp)
        .map((s) => byId.get(s.playerId)?.nickname)
        .filter(Boolean) as string[];
    const yes = names("yes");
    const maybe = names("maybe");
    const lines = [
      `⚽ Pelada · ${formatMatchDay(match.playedAt)}`,
      `📍 ${match.venue} · ${match.kickoff}`,
      "",
      `Confirmados (${yes.length}):`,
      ...yes.map((n, i) => `${i + 1}. ${n}`),
    ];
    if (maybe.length) lines.push("", `Em dúvida: ${maybe.join(", ")}`);
    lines.push("", `Confirma aqui: ${window.location.href}`);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener",
    );
  }

  async function reopen() {
    if (!window.confirm("Reabrir o jogo? O placar atual será apagado.")) return;
    setPending(true);
    try {
      await reopenMatch({ data: { id: match.id } });
      toast.success("Jogo reaberto");
      await router.invalidate();
    } catch {
      toast.error("Não deu para reabrir o jogo");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!window.confirm("Apagar essa pelada? Presenças, times e gols dela somem.")) return;
    setPending(true);
    try {
      await deleteMatch({ data: { id: match.id } });
      toast.success("Pelada apagada");
      await navigate({ to: "/jogos" });
    } catch {
      toast.error("Não deu para apagar a pelada");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isOpen ? (
        <Button type="button" variant="secondary" onClick={share}>
          <Share2 className="size-4" />
          Lista no WhatsApp
        </Button>
      ) : isAdmin ? (
        <Button type="button" variant="secondary" disabled={pending} onClick={reopen}>
          <RotateCcw className="size-4" />
          Reabrir jogo
        </Button>
      ) : null}
      {isAdmin ? (
        <Button type="button" variant="secondary" disabled={pending} onClick={remove}>
          <Trash2 className="size-4" />
          Apagar pelada
        </Button>
      ) : null}
    </div>
  );
}
