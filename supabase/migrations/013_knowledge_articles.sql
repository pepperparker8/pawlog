-- 013 Learn hub articles. Shared reference content, read-only for users, maintained through migrations.

create table knowledge_articles (
  slug          text primary key check (slug ~ '^[a-z0-9-]+$'),
  category      text not null check (category in ('food', 'play', 'training', 'first-aid', 'vet', 'massage', 'mind', 'grooming', 'health')),
  icon          text,
  title         text not null,
  summary       text not null,
  read_minutes  smallint not null default 3 check (read_minutes between 1 and 30),
  body_md       text not null,
  audience      jsonb not null default '{}'::jsonb,
  urgent        boolean not null default false,
  sources       jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  sort_order    smallint not null default 0,
  reviewed      date not null,
  active        boolean not null default true
);
create index knowledge_articles_category_idx on knowledge_articles (category, sort_order) where active;

alter table knowledge_articles enable row level security;
create policy "articles: read" on knowledge_articles for select to authenticated using (active);
grant select on knowledge_articles to authenticated;
