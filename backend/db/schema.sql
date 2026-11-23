create extension if not exists "pgcrypto";

create table children (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 30),
  age smallint check (age between 3 and 15),
  avatar_key text not null default 'bintang',
  weekly_target smallint not null default 5 check (weekly_target between 1 and 14),
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table child_settings (
  child_id uuid primary key references children(id) on delete cascade,
  font_scale numeric(3,2) not null default 1.00 check (font_scale between 0.85 and 1.50),
  letter_spacing numeric(3,2) not null default 0.05 check (letter_spacing between 0 and 0.30),
  speech_rate numeric(3,2) not null default 0.80 check (speech_rate between 0.40 and 1.20),
  choice_count smallint not null default 3 check (choice_count between 2 and 4),
  session_length smallint not null default 10 check (session_length between 5 and 20),
  updated_at timestamptz not null default now()
);

create table letters (
  symbol text primary key check (symbol ~ '^[a-z]$'),
  phoneme_ipa text not null,
  phoneme_hint text not null,
  tts_syllable text not null,
  category text not null check (category in ('vowel','consonant')),
  is_lookalike boolean not null default false,
  similar_to text[] not null default '{}',
  difficulty smallint not null check (difficulty between 1 and 4),
  example_words jsonb not null default '[]',
  tips text not null default '',
  writing_steps text[] not null default '{}',
  strokes jsonb not null,
  sort_order smallint not null
);

create table exercise_types (
  id text primary key,
  name text not null,
  description text not null,
  how_to_play text not null,
  icon_key text not null,
  is_active boolean not null default true,
  sort_order smallint not null
);

create table words (
  id serial primary key,
  word text not null unique,
  syllables text[] not null,
  emoji text,
  sort_order smallint not null default 0
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  exercise_type text not null references exercise_types(id),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  total_items smallint not null check (total_items > 0),
  correct_items smallint not null check (correct_items >= 0),
  score smallint not null check (score between 0 and 100),
  mood text check (mood in ('happy','neutral','sad')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at >= started_at)
);

create table session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  item_index smallint not null,
  letter text not null references letters(symbol),
  exercise_type text not null references exercise_types(id),
  is_correct boolean not null,
  resolved boolean not null default true,
  attempts smallint not null default 1 check (attempts between 1 and 3),
  hint_used boolean not null default false,
  response_ms integer check (response_ms is null or response_ms between 0 and 120000),
  chosen_value text,
  created_at timestamptz not null default now(),
  unique (session_id, item_index)
);

create table letter_mastery (
  child_id uuid not null references children(id) on delete cascade,
  letter text not null references letters(symbol),
  score smallint not null default 0 check (score between 0 and 100),
  attempts integer not null default 0,
  correct integer not null default 0,
  wrong integer not null default 0,
  last_seen_at timestamptz,
  primary key (child_id, letter)
);

create index idx_sessions_child_started on sessions (child_id, started_at desc);
create index idx_items_session on session_items (session_id);
create index idx_items_child_letter on session_items (child_id, letter);

alter table children enable row level security;
alter table child_settings enable row level security;
alter table letters enable row level security;
alter table exercise_types enable row level security;
alter table words enable row level security;
alter table sessions enable row level security;
alter table session_items enable row level security;
alter table letter_mastery enable row level security;

create or replace function public.create_session_atomic(p_session jsonb, p_items jsonb, p_mastery_updates jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  created_id uuid;
begin
  insert into sessions (
    child_id, name, exercise_type, started_at, ended_at, duration_seconds,
    total_items, correct_items, score, mood, note
  ) values (
    (p_session->>'child_id')::uuid,
    p_session->>'name',
    p_session->>'exercise_type',
    (p_session->>'started_at')::timestamptz,
    (p_session->>'ended_at')::timestamptz,
    (p_session->>'duration_seconds')::integer,
    (p_session->>'total_items')::smallint,
    (p_session->>'correct_items')::smallint,
    (p_session->>'score')::smallint,
    nullif(p_session->>'mood', '')::text,
    nullif(p_session->>'note', '')::text
  ) returning id into created_id;

  insert into session_items (
    session_id, child_id, item_index, letter, exercise_type, is_correct,
    resolved, attempts, hint_used, response_ms, chosen_value
  )
  select created_id, (p_session->>'child_id')::uuid,
         (item->>'item_index')::smallint, item->>'letter', p_session->>'exercise_type',
         (item->>'is_correct')::boolean, (item->>'resolved')::boolean,
         (item->>'attempts')::smallint, (item->>'hint_used')::boolean,
         nullif(item->>'response_ms', '')::integer, nullif(item->>'chosen_value', '')
  from jsonb_array_elements(p_items) as item_rows(item);

  insert into letter_mastery (child_id, letter, score, attempts, correct, wrong, last_seen_at)
  select (p_session->>'child_id')::uuid,
         update_row->>'letter',
         (update_row->>'score')::smallint,
         (update_row->>'attempts')::integer,
         (update_row->>'correct')::integer,
         (update_row->>'wrong')::integer,
         nullif(update_row->>'last_seen_at', '')::timestamptz
  from jsonb_array_elements(p_mastery_updates) as mastery_rows(update_row)
  on conflict (child_id, letter) do update set
    score = excluded.score,
    attempts = excluded.attempts,
    correct = excluded.correct,
    wrong = excluded.wrong,
    last_seen_at = excluded.last_seen_at;

  return created_id;
end;
$$;

revoke all on function public.create_session_atomic(jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_session_atomic(jsonb, jsonb, jsonb) to service_role;
