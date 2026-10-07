-- 012 Breed reference seed. Values copied from the cited source pages (retrieved 2026-10-07); lb converted at 0.4536 kg and rounded to 0.1 kg.
-- A range is stored only when the source gives both ends. A breed with no sourced range shows "Breed-specific reference unavailable".

insert into breeds (code, name, aliases, coat, maturity_months_min, maturity_months_max, maturity_notes, care_notes, source, source_url, last_reviewed) values
  ('british-shorthair', 'British Shorthair', '{"British Blue","BSH","British"}', 'short', 60, 60, 'Slow to mature; full physical maturity can take up to 5 years.', 'Short coats: groom at least weekly.', 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/british/', '2026-10-07'),
  ('ragdoll', 'Ragdoll', '{"Rag doll"}', 'semi-long', 48, 48, 'Slow to mature; full size can take about 4 years.', 'Longer coats: groom daily to prevent mats behind ears, under legs and on the back legs.', 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/ragdoll/', '2026-10-07'),
  ('maine-coon', 'Maine Coon', '{"Maine Coon Cat","Mainecoon"}', 'semi-long', 48, 48, 'Slow to mature; full size can take 3 to 4 years.', 'Longer coats: groom daily to prevent mats behind ears, under legs and on the back legs.', 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/maine-coon/', '2026-10-07'),
  ('persian', 'Persian', '{"Persia","Kucing Persia","Persian Longhair"}', 'long', null, null, null, 'Long coats: groom daily to prevent mats behind ears, under legs and on the back legs.', 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/persian/', '2026-10-07'),
  ('siamese', 'Siamese', '{"Siam","Kucing Siam"}', 'short', null, null, null, 'Short coats: groom at least weekly.', 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/siamese/', '2026-10-07'),
  ('bengal', 'Bengal', '{}', 'short', 24, 24, 'Usually reaches adult size by about 2 years.', 'Short coats: groom at least weekly.', 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/bengal/', '2026-10-07'),
  ('scottish-fold', 'Scottish Fold', '{"Scottish","Fold"}', 'short', null, null, null, 'Short coats: groom at least weekly.', 'PetMD breed profile, vet reviewed', 'https://www.petmd.com/cat/breeds/scottish-fold', '2026-10-07'),
  ('sphynx', 'Sphynx', '{"Sphinx","Canadian Sphynx"}', 'hairless', null, null, null, 'No coat to brush; skin needs regular gentle cleaning.', 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/sphynx/', '2026-10-07'),
  ('russian-blue', 'Russian Blue', '{"Russian"}', 'short', null, null, null, 'Short coats: groom at least weekly.', 'CFA breed profile', 'https://cfa.org/breed/russian-blue/', '2026-10-07'),
  ('abyssinian', 'Abyssinian', '{"Aby"}', 'short', null, null, null, 'Short coats: groom at least weekly.', 'PetMD breed profile, vet reviewed', 'https://www.petmd.com/cat/breeds/abyssinian', '2026-10-07'),
  ('exotic-shorthair', 'Exotic Shorthair', '{"Exotic","Exotic Short Hair"}', 'short', null, null, null, 'Short coats: groom at least weekly.', 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/exotic-shorthair/', '2026-10-07'),
  ('norwegian-forest-cat', 'Norwegian Forest Cat', '{"Norwegian Forest","Wegie","Skogkatt"}', 'semi-long', 60, 60, 'Slow to mature; full size can take about 5 years.', 'Longer coats: groom daily to prevent mats behind ears, under legs and on the back legs.', 'CFA breed profile', 'https://cfa.org/breed/norwegian-forest-cat/', '2026-10-07'),
  ('american-shorthair', 'American Shorthair', '{"American Short Hair","ASH"}', 'short', null, null, null, 'Short coats: groom at least weekly.', 'PetMD breed profile, vet reviewed', 'https://www.petmd.com/cat/breeds/american-shorthair', '2026-10-07'),
  ('domestic-shorthair', 'Domestic Shorthair', '{"Domestic Short Hair","DSH","Kampung","Kucing Kampung","Domestic","Mixed","Mixed breed","Moggy","Short hair","Shorthair"}', 'short', null, null, null, 'Short coats: groom at least weekly.', null, null, '2026-10-07'),
  ('domestic-longhair', 'Domestic Longhair', '{"Domestic Long Hair","DLH","Long hair","Longhair"}', 'long', null, null, null, 'Long coats: groom daily to prevent mats behind ears, under legs and on the back legs.', 'VCA Animal Hospitals', 'https://vcahospitals.com/know-your-pet/cat-breeds/domestic-long-hair', '2026-10-07')
on conflict (code) do update set name = excluded.name, aliases = excluded.aliases, coat = excluded.coat,
  maturity_months_min = excluded.maturity_months_min, maturity_months_max = excluded.maturity_months_max,
  maturity_notes = excluded.maturity_notes, care_notes = excluded.care_notes, source = excluded.source,
  source_url = excluded.source_url, last_reviewed = excluded.last_reviewed;

insert into breed_weight_references (breed_code, sex, min_kg, max_kg, source, source_url, last_reviewed) values
  ('british-shorthair', 'female', 3.2, 5.4, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/british/', '2026-10-07'),
  ('british-shorthair', 'male', 4.1, 7.7, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/british/', '2026-10-07'),
  ('british-shorthair', 'any', 3.2, 7.7, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/british/', '2026-10-07'),
  ('ragdoll', 'female', 4.0, 6.0, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/ragdoll/', '2026-10-07'),
  ('maine-coon', 'any', 4.5, 9.1, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/maine-coon/', '2026-10-07'),
  ('persian', 'female', 2.7, 5.4, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/persian/', '2026-10-07'),
  ('siamese', 'female', 3.6, 5.4, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/siamese/', '2026-10-07'),
  ('siamese', 'male', 4.5, 6.8, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/siamese/', '2026-10-07'),
  ('siamese', 'any', 3.6, 6.8, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/siamese/', '2026-10-07'),
  ('bengal', 'female', 3.6, 5.4, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/bengal/', '2026-10-07'),
  ('bengal', 'male', 4.5, 6.8, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/bengal/', '2026-10-07'),
  ('bengal', 'any', 3.6, 6.8, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/bengal/', '2026-10-07'),
  ('sphynx', 'female', 2.7, 3.6, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/sphynx/', '2026-10-07'),
  ('sphynx', 'male', 3.6, 5.0, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/sphynx/', '2026-10-07'),
  ('sphynx', 'any', 2.7, 5.0, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/sphynx/', '2026-10-07'),
  ('russian-blue', 'female', 2.3, 3.6, 'CFA breed profile', 'https://cfa.org/breed/russian-blue/', '2026-10-07'),
  ('russian-blue', 'any', 2.3, 4.5, 'CFA breed profile', 'https://cfa.org/breed/russian-blue/', '2026-10-07'),
  ('abyssinian', 'any', 3.6, 5.4, 'PetMD breed profile, vet reviewed', 'https://www.petmd.com/cat/breeds/abyssinian', '2026-10-07'),
  ('exotic-shorthair', 'female', 3.2, 5.4, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/exotic-shorthair/', '2026-10-07'),
  ('exotic-shorthair', 'male', 5.4, 6.4, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/exotic-shorthair/', '2026-10-07'),
  ('exotic-shorthair', 'any', 3.2, 6.4, 'GCCF breed profile', 'https://www.gccfcats.org/getting-a-cat/choosing/cat-breeds/exotic-shorthair/', '2026-10-07'),
  ('norwegian-forest-cat', 'female', 4.1, 5.4, 'CFA breed profile', 'https://cfa.org/breed/norwegian-forest-cat/', '2026-10-07'),
  ('norwegian-forest-cat', 'male', 5.4, 7.3, 'CFA breed profile', 'https://cfa.org/breed/norwegian-forest-cat/', '2026-10-07'),
  ('norwegian-forest-cat', 'any', 4.1, 7.3, 'CFA breed profile', 'https://cfa.org/breed/norwegian-forest-cat/', '2026-10-07'),
  ('american-shorthair', 'any', 2.7, 6.8, 'PetMD breed profile, vet reviewed', 'https://www.petmd.com/cat/breeds/american-shorthair', '2026-10-07')
on conflict (breed_code, sex, source) do update set min_kg = excluded.min_kg, max_kg = excluded.max_kg,
  source_url = excluded.source_url, last_reviewed = excluded.last_reviewed;

-- Link existing cats whose free-text breed matches a breed name or alias.
update cats c set breed_code = b.code
from breeds b
where c.breed_code is null and c.breed is not null
  and (lower(trim(c.breed)) = lower(b.name) or lower(trim(c.breed)) = any (select lower(a) from unnest(b.aliases) a));
