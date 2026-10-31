-- 021 Ask PawLog: one running conversation per cat, answered by the `ask` edge function.
-- Off until the owner switches it on. Messages are written with the caller's JWT, so RLS applies;
-- the function deletes the household's messages older than 30 days on each call.

alter table households add column ai_enabled boolean not null default false;

create table ask_messages (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  cat_id          uuid not null references cats (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null check (char_length(content) between 1 and 8000),
  urgency         text check (urgency in ('none', 'monitor', 'book', 'today', 'emergency')),
  answer          jsonb,
  red_flag        text,
  model           text,
  input_tokens    integer,
  output_tokens   integer,
  client_event_id uuid unique,
  created_by      uuid not null default auth.uid() references profiles (id),
  created_at      timestamptz not null default now(),
  check (role = 'user' or urgency is not null)
);
create index ask_messages_cat_time_idx on ask_messages (cat_id, created_at desc);
create index ask_messages_household_time_idx on ask_messages (household_id, created_at);
create index ask_messages_created_by_idx on ask_messages (created_by);

alter table ask_messages enable row level security;
create policy "ask_messages: member read" on ask_messages for select using (is_household_member(household_id));
create policy "ask_messages: editor insert" on ask_messages for insert
  with check (can_edit_household(household_id) and created_by = auth.uid());
create policy "ask_messages: editor delete" on ask_messages for delete using (can_edit_household(household_id));

create trigger ask_messages_tenant before insert on ask_messages
  for each row execute function enforce_tenant_consistency();
