-- HS 008: Renombrar exercisedb_id → dataset_id (dataset local hasaneyldrm/exercises-dataset)

alter table public.exercise_catalog
  rename column exercisedb_id to dataset_id;

drop index if exists exercise_catalog_exercisedb_id_idx;

create index if not exists exercise_catalog_dataset_id_idx
  on public.exercise_catalog(dataset_id)
  where dataset_id is not null;

-- Limpiar IDs legacy de ExerciseDB (se reimportan desde el dataset local)
update public.exercise_catalog
set dataset_id = null
where dataset_id is not null and dataset_id !~ '^\d{4}$';
