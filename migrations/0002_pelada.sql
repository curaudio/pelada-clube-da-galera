create table if not exists players (
  id         serial primary key,
  name       text not null,
  nickname   text not null,
  position   text not null,
  number     integer,
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id           serial primary key,
  played_at    date not null,
  venue        text not null default 'Society da Vila',
  kickoff      text not null default '10h',
  status       text not null default 'upcoming',
  team_a_name  text not null default 'Camisa Clara',
  team_b_name  text not null default 'Camisa Escura',
  score_a      integer,
  score_b      integer,
  created_at   timestamptz not null default now()
);

create table if not exists match_players (
  id         serial primary key,
  match_id   integer not null references matches(id) on delete cascade,
  player_id  integer not null references players(id) on delete cascade,
  team       text,
  rsvp       text not null default 'pending',
  goals      integer not null default 0,
  unique (match_id, player_id)
);

create index if not exists match_players_match_id_idx on match_players (match_id);
create index if not exists matches_played_at_idx on matches (played_at desc);

insert into players (id, name, nickname, position, number) values
  (1,  'Arthur Mendes',   'Tuca',    'GOL', 1),
  (2,  'Diego Alves',     'Magrelo', 'ZAG', 4),
  (3,  'Bruno Costa',     'Nego',    'ZAG', 3),
  (4,  'Eduardo Lima',    'Duda',    'LAT', 2),
  (5,  'Carlos Henrique', 'Cacá',    'LAT', 6),
  (6,  'Robson Dias',     'Binho',   'MEI', 8),
  (7,  'Kenji Nakamura',  'Japa',    'MEI', 10),
  (8,  'Leonardo Souza',  'Léo',     'MEI', 5),
  (9,  'Fernando Rocha',  'Fefo',    'ATA', 9),
  (10, 'Gustavo Pires',   'Guga',    'ATA', 11),
  (11, 'Pedro Antunes',   'Pato',    'ATA', 7),
  (12, 'Rafael Gomes',    'Mineiro', 'GOL', 12),
  (13, 'Francisco Melo',  'Chico',   'ZAG', 13),
  (14, 'Marcelo Pinto',   'Rato',    'MEI', 14),
  (15, 'Tiago Barbosa',   'Tiago',   'ATA', 17),
  (16, 'Vinícius Reis',   'Vini',    'LAT', 16);

insert into matches (id, played_at, venue, kickoff, status, team_a_name, team_b_name, score_a, score_b) values
  (1, '2026-09-13', 'Society da Vila', '10h', 'done',     'Camisa Clara', 'Camisa Escura', 4, 3),
  (2, '2026-09-20', 'Society da Vila', '10h', 'done',     'Camisa Clara', 'Camisa Escura', 2, 2),
  (3, '2026-09-27', 'Campo do SESC',   '9h',  'done',     'Camisa Clara', 'Camisa Escura', 1, 3),
  (4, '2026-10-04', 'Society da Vila', '10h', 'done',     'Camisa Clara', 'Camisa Escura', 5, 2),
  (5, '2026-10-11', 'Society da Vila', '10h', 'upcoming', 'Camisa Clara', 'Camisa Escura', null, null);

-- Match 1  4-3  Clara: Tuca Duda Magrelo Cacá Binho Japa Fefo Guga
--           Escura: Mineiro Nego Chico Vini Léo Rato Pato Tiago
insert into match_players (match_id, player_id, team, rsvp, goals) values
  (1, 1,  'a', 'yes', 0),
  (1, 4,  'a', 'yes', 0),
  (1, 2,  'a', 'yes', 0),
  (1, 5,  'a', 'yes', 0),
  (1, 6,  'a', 'yes', 0),
  (1, 7,  'a', 'yes', 1),
  (1, 9,  'a', 'yes', 2),
  (1, 10, 'a', 'yes', 1),
  (1, 12, 'b', 'yes', 0),
  (1, 3,  'b', 'yes', 0),
  (1, 13, 'b', 'yes', 0),
  (1, 16, 'b', 'yes', 0),
  (1, 8,  'b', 'yes', 0),
  (1, 14, 'b', 'yes', 0),
  (1, 11, 'b', 'yes', 2),
  (1, 15, 'b', 'yes', 1);

-- Match 2  2-2
insert into match_players (match_id, player_id, team, rsvp, goals) values
  (2, 1,  'a', 'yes', 0),
  (2, 3,  'a', 'yes', 0),
  (2, 2,  'a', 'yes', 0),
  (2, 16, 'a', 'yes', 0),
  (2, 6,  'a', 'yes', 1),
  (2, 8,  'a', 'yes', 0),
  (2, 9,  'a', 'yes', 1),
  (2, 15, 'a', 'yes', 0),
  (2, 12, 'b', 'yes', 0),
  (2, 13, 'b', 'yes', 0),
  (2, 4,  'b', 'yes', 0),
  (2, 5,  'b', 'yes', 0),
  (2, 7,  'b', 'yes', 1),
  (2, 14, 'b', 'yes', 0),
  (2, 11, 'b', 'yes', 1),
  (2, 10, 'b', 'yes', 0);

-- Match 3  1-3
insert into match_players (match_id, player_id, team, rsvp, goals) values
  (3, 12, 'a', 'yes', 0),
  (3, 2,  'a', 'yes', 0),
  (3, 13, 'a', 'yes', 0),
  (3, 4,  'a', 'yes', 0),
  (3, 8,  'a', 'yes', 1),
  (3, 14, 'a', 'yes', 0),
  (3, 11, 'a', 'yes', 0),
  (3, 16, 'a', 'yes', 0),
  (3, 1,  'b', 'yes', 0),
  (3, 3,  'b', 'yes', 0),
  (3, 5,  'b', 'yes', 0),
  (3, 6,  'b', 'yes', 0),
  (3, 7,  'b', 'yes', 0),
  (3, 9,  'b', 'yes', 2),
  (3, 10, 'b', 'yes', 1),
  (3, 15, 'b', 'yes', 0);

-- Match 4  5-2
insert into match_players (match_id, player_id, team, rsvp, goals) values
  (4, 1,  'a', 'yes', 0),
  (4, 3,  'a', 'yes', 0),
  (4, 2,  'a', 'yes', 0),
  (4, 5,  'a', 'yes', 0),
  (4, 7,  'a', 'yes', 2),
  (4, 6,  'a', 'yes', 0),
  (4, 9,  'a', 'yes', 2),
  (4, 10, 'a', 'yes', 1),
  (4, 12, 'b', 'yes', 0),
  (4, 13, 'b', 'yes', 0),
  (4, 4,  'b', 'yes', 0),
  (4, 16, 'b', 'yes', 0),
  (4, 8,  'b', 'yes', 0),
  (4, 14, 'b', 'yes', 0),
  (4, 11, 'b', 'yes', 1),
  (4, 15, 'b', 'yes', 1);

-- Upcoming: mixed RSVP, no teams yet
insert into match_players (match_id, player_id, team, rsvp, goals) values
  (5, 1,  null, 'yes',     0),
  (5, 2,  null, 'yes',     0),
  (5, 3,  null, 'yes',     0),
  (5, 4,  null, 'yes',     0),
  (5, 5,  null, 'yes',     0),
  (5, 6,  null, 'yes',     0),
  (5, 7,  null, 'yes',     0),
  (5, 8,  null, 'maybe',   0),
  (5, 9,  null, 'yes',     0),
  (5, 10, null, 'yes',     0),
  (5, 11, null, 'yes',     0),
  (5, 12, null, 'yes',     0),
  (5, 13, null, 'maybe',   0),
  (5, 14, null, 'yes',     0),
  (5, 15, null, 'no',      0),
  (5, 16, null, 'pending', 0);

select setval('players_id_seq', (select max(id) from players));
select setval('matches_id_seq', (select max(id) from matches));
select setval('match_players_id_seq', (select max(id) from match_players));
