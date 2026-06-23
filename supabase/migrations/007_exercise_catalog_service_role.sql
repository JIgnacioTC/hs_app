-- HS 007: Permitir actualización del catálogo global (sync ExerciseDB vía service role o admin)

create policy "Service role manages exercise catalog"
  on public.exercise_catalog
  for all
  to service_role
  using (true)
  with check (true);
