import { getSql } from "@/lib/db";

export type Role = "admin" | "member";

export type Access = {
  userId: string;
  role: Role;
  playerId: number | null;
};

/**
 * Papel da conta no clube. Na primeira vez que uma conta aparece, ela vira
 * membro; se ainda não existe administrador, vira o administrador (o índice
 * único `members_single_admin` garante que só exista um, mesmo com cadastros
 * simultâneos).
 */
export async function getAccess(userId: string): Promise<Access> {
  const sql = await getSql();
  const find = () =>
    sql<{ role: string; player_id: number | null }>`
      select role, player_id from members where user_id = ${userId}
    `;
  let rows = await find();
  if (!rows[0]) {
    try {
      await sql`
        insert into members (user_id, role)
        values (
          ${userId},
          case when exists (select 1 from members where role = 'admin')
               then 'member' else 'admin' end
        )
        on conflict (user_id) do nothing
      `;
    } catch {
      // Outro cadastro virou admin no mesmo instante: entra como membro.
      await sql`
        insert into members (user_id, role) values (${userId}, 'member')
        on conflict (user_id) do nothing
      `;
    }
    rows = await find();
  }
  const row = rows[0];
  return {
    userId,
    role: row?.role === "admin" ? "admin" : "member",
    playerId: row?.player_id ?? null,
  };
}

export async function requireAdmin(userId: string): Promise<Access> {
  const access = await getAccess(userId);
  if (access.role !== "admin") {
    throw new Error("Só o administrador pode fazer isso");
  }
  return access;
}

/** Administrador, ou o próprio jogador da conta. */
export async function requireAdminOrSelf(
  userId: string,
  playerId: number,
): Promise<Access> {
  const access = await getAccess(userId);
  if (access.role !== "admin" && access.playerId !== playerId) {
    throw new Error("Você só pode mexer no seu próprio perfil");
  }
  return access;
}
