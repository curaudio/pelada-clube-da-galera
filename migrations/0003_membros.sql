-- Contas do clube: papel (admin/membro) e vínculo com o jogador do elenco.
create table if not exists members (
  user_id    text primary key,
  role       text not null default 'member' check (role in ('admin', 'member')),
  player_id  integer unique references players(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Só pode existir UM administrador.
create unique index if not exists members_single_admin
  on members (role) where role = 'admin';
