-- 008 Covering index for every foreign key in public that does not have one
-- (mostly created_by / actor columns; keeps profile deletes and joins cheap).

do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname,
           string_agg(quote_ident(a.attname), ', ' order by k.ord) as cols
    from pg_constraint c
    join pg_namespace n on n.oid = c.connamespace and n.nspname = 'public'
    cross join lateral unnest(c.conkey) with ordinality as k(attnum, ord)
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
    where c.contype = 'f'
      and not exists (
        select 1 from pg_index i
        where i.indrelid = c.conrelid
          and (i.indkey::int2[])[0:cardinality(c.conkey) - 1] = c.conkey
      )
    group by c.conrelid, c.conname
  loop
    execute format('create index if not exists %I on %s (%s)', left(r.conname, 59) || '_idx', r.tbl, r.cols);
  end loop;
end $$;
