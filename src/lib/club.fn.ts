import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  balanceTeams,
  computePlayerStats,
  type Match,
  type MatchDetail,
  type MatchStatus,
  type Player,
  type Position,
  type Rsvp,
  type SquadEntry,
  type TeamSide,
} from "@/lib/club";

type PlayerRow = {
  id: number;
  name: string;
  nickname: string;
  position: string;
  number: number | null;
};

type MatchRow = {
  id: number;
  played_at: string;
  venue: string;
  kickoff: string;
  status: string;
  team_a_name: string;
  team_b_name: string;
  score_a: number | null;
  score_b: number | null;
};

type LinkRow = {
  match_id: number;
  player_id: number;
  team: string | null;
  rsvp: string;
  goals: number;
};

function mapPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname,
    position: row.position as Position,
    number: row.number,
  };
}

function mapMatch(row: MatchRow): Match {
  return {
    id: row.id,
    playedAt: row.played_at,
    venue: row.venue,
    kickoff: row.kickoff,
    status: row.status as MatchStatus,
    teamAName: row.team_a_name,
    teamBName: row.team_b_name,
    scoreA: row.score_a,
    scoreB: row.score_b,
  };
}

function mapSquad(row: LinkRow): SquadEntry & { matchId: number } {
  return {
    matchId: row.match_id,
    playerId: row.player_id,
    team: (row.team as TeamSide | null) ?? null,
    rsvp: row.rsvp as Rsvp,
    goals: row.goals,
  };
}

async function loadAll() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const [playerRows, matchRows, linkRows] = await Promise.all([
    sql<PlayerRow>`select id, name, nickname, position, number from players order by number nulls last, nickname`,
    sql<MatchRow>`select id, played_at, venue, kickoff, status, team_a_name, team_b_name, score_a, score_b from matches order by played_at desc`,
    sql<LinkRow>`select match_id, player_id, team, rsvp, goals from match_players`,
  ]);
  const players = playerRows.map(mapPlayer);
  const matches = matchRows.map(mapMatch);
  const squad = linkRows.map(mapSquad);
  return { players, matches, squad };
}

function toDetail(
  match: Match,
  squad: Array<SquadEntry & { matchId: number }>,
): MatchDetail {
  return {
    ...match,
    squad: squad
      .filter((s) => s.matchId === match.id)
      .map(({ matchId: _id, ...rest }) => rest),
  };
}

export const getBoard = createServerFn({ method: "GET" })
  .middleware([authMiddleware]).handler(async ({ context }) => {
    const { getAccess } = await import("@/lib/access.server");
  await getAccess(context.userId);
  const { players, matches, squad } = await loadAll();
  const { getSql } = await import("@/lib/db");
  const sqlDb = await getSql();
  const claimed = await sqlDb<{ player_id: number }>`
    select player_id from members where player_id is not null
  `;
  const ranking = computePlayerStats(players, matches, squad);
  // `matches` vem ordenado do mais recente para o mais antigo; a próxima pelada
  // é a aberta com a data mais próxima, não a mais distante.
  const upcoming =
    matches
      .filter((m) => m.status === "upcoming" || m.status === "live")
      .sort((a, b) => a.playedAt.localeCompare(b.playedAt))[0] ?? null;
  const nextMatch = upcoming ? toDetail(upcoming, squad) : null;
  const recent = matches.filter((m) => m.status === "done").slice(0, 4);
  return {
    players,
    claimedPlayerIds: claimed.map((r) => r.player_id),
    matches,
    ranking,
    nextMatch,
    recent,
    scorers: [...ranking].sort((a, b) => b.goals - a.goals || b.points - a.points),
  };
});

export const getMatchById = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.number() }).parse(data))
  .handler(async ({ data, context }) => {
    const { getAccess } = await import("@/lib/access.server");
    await getAccess(context.userId);
    const { players, matches, squad } = await loadAll();
    const match = matches.find((m) => m.id === data.id);
    if (!match) return null;
    return { match: toDetail(match, squad), players };
  });

const playerInput = z.object({
  name: z.string().trim().min(2).max(60),
  nickname: z.string().trim().min(2).max(20),
  position: z.enum(["GOL", "ZAG", "LAT", "MEI", "ATA"]),
  number: z.number().int().min(1).max(99).nullable(),
});

export const addPlayer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => playerInput.parse(data))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/lib/access.server");
    await requireAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<PlayerRow>`
      insert into players (name, nickname, position, number)
      values (${data.name}, ${data.nickname}, ${data.position}, ${data.number})
      returning id, name, nickname, position, number
    `;
    return mapPlayer(rows[0]!);
  });

export const setRsvp = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z
      .object({
        matchId: z.number(),
        playerId: z.number(),
        rsvp: z.enum(["yes", "maybe", "no", "pending"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireAdminOrSelf } = await import("@/lib/access.server");
    await requireAdminOrSelf(context.userId, data.playerId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into match_players (match_id, player_id, rsvp)
      values (${data.matchId}, ${data.playerId}, ${data.rsvp})
      on conflict (match_id, player_id)
      do update set rsvp = excluded.rsvp
    `;
    return { ok: true as const };
  });

export const setScore = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z
      .object({
        matchId: z.number(),
        scoreA: z.number().int().min(0).max(30),
        scoreB: z.number().int().min(0).max(30),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/lib/access.server");
    await requireAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      update matches
      set score_a = ${data.scoreA},
          score_b = ${data.scoreB},
          status = 'done'
      where id = ${data.matchId}
    `;
    return { ok: true as const };
  });

export const setPlayerGoals = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z
      .object({
        matchId: z.number(),
        playerId: z.number(),
        goals: z.number().int().min(0).max(20),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/lib/access.server");
    await requireAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      update match_players
      set goals = ${data.goals}
      where match_id = ${data.matchId} and player_id = ${data.playerId}
    `;
    return { ok: true as const };
  });

export const createMatch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z
      .object({
        playedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        venue: z.string().trim().min(2).max(80),
        kickoff: z.string().trim().min(1).max(16),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/lib/access.server");
    await requireAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<MatchRow>`
      insert into matches (played_at, venue, kickoff, status)
      values (${data.playedAt}, ${data.venue}, ${data.kickoff}, 'upcoming')
      returning id, played_at, venue, kickoff, status, team_a_name, team_b_name, score_a, score_b
    `;
    return mapMatch(rows[0]!);
  });

export const drawTeams = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ matchId: z.number() }).parse(data))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/lib/access.server");
    await requireAdmin(context.userId);
    const { players, matches, squad } = await loadAll();
    const match = matches.find((m) => m.id === data.matchId);
    if (!match) throw new Error("Pelada não encontrada");
    if (match.status === "done") throw new Error("Esse jogo já foi encerrado");
    const confirmedIds = new Set(
      squad
        .filter((s) => s.matchId === match.id && s.rsvp === "yes")
        .map((s) => s.playerId),
    );
    const confirmed = players.filter((p) => confirmedIds.has(p.id));
    if (confirmed.length < 4) {
      throw new Error("Confirma pelo menos 4 jogadores para sortear");
    }
    const points = new Map(
      computePlayerStats(players, matches, squad).map((r) => [r.player.id, r.points]),
    );
    const { a, b } = balanceTeams(confirmed, points);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    // Um único UPDATE: limpa e atribui os times de uma vez, então uma falha no
    // meio não deixa o sorteio pela metade.
    await sql.query(
      `update match_players
       set team = case
         when player_id = any($2::int[]) then 'a'
         when player_id = any($3::int[]) then 'b'
         else null
       end
       where match_id = $1`,
      [data.matchId, a, b],
    );
    return { a, b };
  });

export const updatePlayer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    playerInput.extend({ id: z.number().int() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireAdminOrSelf } = await import("@/lib/access.server");
    await requireAdminOrSelf(context.userId, data.id);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<PlayerRow>`
      update players
      set name = ${data.name}, nickname = ${data.nickname},
          position = ${data.position}, number = ${data.number}
      where id = ${data.id}
      returning id, name, nickname, position, number
    `;
    if (!rows[0]) throw new Error("Jogador não encontrado");
    return mapPlayer(rows[0]);
  });

export const deletePlayer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.number().int() }).parse(data))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/lib/access.server");
    await requireAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    // match_players tem ON DELETE CASCADE: o histórico dele sai junto.
    await sql`delete from players where id = ${data.id}`;
    return { ok: true as const };
  });

export const deleteMatch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.number().int() }).parse(data))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/lib/access.server");
    await requireAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from matches where id = ${data.id}`;
    return { ok: true as const };
  });

export const reopenMatch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.number().int() }).parse(data))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/lib/access.server");
    await requireAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      update matches
      set status = 'upcoming', score_a = null, score_b = null
      where id = ${data.id}
    `;
    return { ok: true as const };
  });

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getAccess } = await import("@/lib/access.server");
    const access = await getAccess(context.userId);
    return {
      role: access.role,
      playerId: access.playerId,
    };
  });

export const claimPlayer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ playerId: z.number().int() }).parse(data))
  .handler(async ({ data, context }) => {
    const { getAccess } = await import("@/lib/access.server");
    const access = await getAccess(context.userId);
    if (access.playerId) throw new Error("Você já tem um jogador vinculado");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    try {
      const rows = await sql<{ user_id: string }>`
        update members set player_id = ${data.playerId}
        where user_id = ${context.userId} and player_id is null
        returning user_id
      `;
      if (!rows[0]) throw new Error("Não deu para vincular");
    } catch {
      throw new Error("Esse jogador já está vinculado a outra conta");
    }
    return { ok: true as const };
  });

export const createMyPlayer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => playerInput.parse(data))
  .handler(async ({ data, context }) => {
    const { getAccess } = await import("@/lib/access.server");
    const access = await getAccess(context.userId);
    if (access.playerId) throw new Error("Você já tem um jogador vinculado");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    // Cria o jogador e já vincula à conta num único comando.
    const rows = await sql<PlayerRow>`
      with p as (
        insert into players (name, nickname, position, number)
        values (${data.name}, ${data.nickname}, ${data.position}, ${data.number})
        returning id, name, nickname, position, number
      ),
      m as (
        update members set player_id = (select id from p)
        where user_id = ${context.userId} and player_id is null
        returning user_id
      )
      select p.id, p.name, p.nickname, p.position, p.number
      from p, m
    `;
    if (!rows[0]) throw new Error("Não deu para criar o jogador");
    return mapPlayer(rows[0]);
  });

export const unlinkMe = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getAccess } = await import("@/lib/access.server");
    await getAccess(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`update members set player_id = null where user_id = ${context.userId}`;
    return { ok: true as const };
  });
