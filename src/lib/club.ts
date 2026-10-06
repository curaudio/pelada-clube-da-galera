import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export type Position = "GOL" | "ZAG" | "LAT" | "MEI" | "ATA";
export type Rsvp = "yes" | "maybe" | "no" | "pending";
export type TeamSide = "a" | "b";
export type MatchStatus = "upcoming" | "live" | "done";

export type Player = {
  id: number;
  name: string;
  nickname: string;
  position: Position;
  number: number | null;
};

export type Match = {
  id: number;
  playedAt: string;
  venue: string;
  kickoff: string;
  status: MatchStatus;
  teamAName: string;
  teamBName: string;
  scoreA: number | null;
  scoreB: number | null;
};

export type SquadEntry = {
  playerId: number;
  team: TeamSide | null;
  rsvp: Rsvp;
  goals: number;
};

export type MatchDetail = Match & {
  squad: SquadEntry[];
};

export type PlayerStat = {
  player: Player;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  points: number;
  form: Array<"W" | "D" | "L">;
};

export const POSITIONS: { id: Position; label: string }[] = [
  { id: "GOL", label: "Goleiro" },
  { id: "ZAG", label: "Zagueiro" },
  { id: "LAT", label: "Lateral" },
  { id: "MEI", label: "Meia" },
  { id: "ATA", label: "Atacante" },
];

export const RSVP_LABEL: Record<Rsvp, string> = {
  yes: "Vou",
  maybe: "Talvez",
  no: "Fora",
  pending: "Sem resposta",
};

export function positionLabel(pos: Position) {
  return POSITIONS.find((p) => p.id === pos)?.label ?? pos;
}

export function formatMatchDay(isoDate: string) {
  const raw = format(parseISO(isoDate), "EEEE, d 'de' MMMM", { locale: ptBR });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatShortDay(isoDate: string) {
  const raw = format(parseISO(isoDate), "d MMM", { locale: ptBR });
  return raw.replace(".", "");
}

export function computePlayerStats(
  players: Player[],
  matches: Match[],
  squad: Array<SquadEntry & { matchId: number }>,
): PlayerStat[] {
  const byPlayer = new Map<number, PlayerStat>();
  for (const player of players) {
    byPlayer.set(player.id, {
      player,
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals: 0,
      points: 0,
      form: [],
    });
  }

  const finished = [...matches]
    .filter(
      (m) => m.status === "done" && m.scoreA !== null && m.scoreB !== null,
    )
    .sort((a, b) => a.playedAt.localeCompare(b.playedAt));

  for (const match of finished) {
    const scoreA = match.scoreA ?? 0;
    const scoreB = match.scoreB ?? 0;
    const resultA: "W" | "D" | "L" =
      scoreA > scoreB ? "W" : scoreA === scoreB ? "D" : "L";
    const resultB: "W" | "D" | "L" =
      resultA === "W" ? "L" : resultA === "L" ? "W" : "D";

    for (const row of squad.filter((s) => s.matchId === match.id)) {
      const stat = byPlayer.get(row.playerId);
      if (!stat || !row.team) continue;
      const result = row.team === "a" ? resultA : resultB;
      stat.games += 1;
      stat.goals += row.goals;
      if (result === "W") {
        stat.wins += 1;
        stat.points += 3;
      } else if (result === "D") {
        stat.draws += 1;
        stat.points += 1;
      } else {
        stat.losses += 1;
      }
      stat.form.push(result);
      if (stat.form.length > 5) stat.form.shift();
    }
  }

  return [...byPlayer.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.player.nickname.localeCompare(b.player.nickname, "pt-BR");
  });
}

export function rsvpCounts(squad: SquadEntry[]) {
  return {
    yes: squad.filter((s) => s.rsvp === "yes").length,
    maybe: squad.filter((s) => s.rsvp === "maybe").length,
    no: squad.filter((s) => s.rsvp === "no").length,
    pending: squad.filter((s) => s.rsvp === "pending").length,
  };
}

export function shuffleTeams(players: Player[]): {
  a: number[];
  b: number[];
} {
  const keepers = players.filter((p) => p.position === "GOL");
  const field = players.filter((p) => p.position !== "GOL");
  const shuffled = [...field];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j]!;
    shuffled[j] = tmp!;
  }
  const a: number[] = [];
  const b: number[] = [];
  if (keepers[0]) a.push(keepers[0].id);
  if (keepers[1]) b.push(keepers[1].id);
  for (const extra of keepers.slice(2)) shuffled.push(extra);
  shuffled.forEach((p, i) => {
    if (i % 2 === 0) a.push(p.id);
    else b.push(p.id);
  });
  return { a, b };
}

/**
 * Sorteio equilibrado: goleiros separados e, para o restante, cada jogador vai
 * para o time com menos pontos acumulados (empate: menos jogadores, depois
 * aleatório). Quem tem mais pontos é distribuído primeiro.
 */
export function balanceTeams(
  players: Player[],
  pointsById: Map<number, number>,
): { a: number[]; b: number[] } {
  const rand = () => Math.random() - 0.5;
  const pts = (p: Player) => pointsById.get(p.id) ?? 0;
  const keepers = players.filter((p) => p.position === "GOL").sort(rand);
  const field = players
    .filter((p) => p.position !== "GOL")
    .sort(rand)
    .sort((x, y) => pts(y) - pts(x));
  const a: number[] = [];
  const b: number[] = [];
  let sumA = 0;
  let sumB = 0;
  const put = (p: Player, side: TeamSide) => {
    if (side === "a") {
      a.push(p.id);
      sumA += pts(p);
    } else {
      b.push(p.id);
      sumB += pts(p);
    }
  };
  if (keepers[0]) put(keepers[0], "a");
  if (keepers[1]) put(keepers[1], "b");
  // Goleiros extras entram como jogadores de linha.
  const rest = [...field, ...keepers.slice(2)].sort((x, y) => pts(y) - pts(x));
  for (const p of rest) {
    let side: TeamSide;
    if (sumA !== sumB) side = sumA < sumB ? "a" : "b";
    else if (a.length !== b.length) side = a.length < b.length ? "a" : "b";
    else side = Math.random() < 0.5 ? "a" : "b";
    // Nunca deixa a diferença de jogadores passar de 1.
    if (a.length > b.length && side === "a") side = "b";
    if (b.length > a.length && side === "b") side = "a";
    put(p, side);
  }
  return { a, b };
}
