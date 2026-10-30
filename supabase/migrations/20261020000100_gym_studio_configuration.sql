alter table public.gym_projects add column if not exists configuration jsonb;
alter table public.gym_projects add constraint gym_projects_configuration_object
  check (configuration is null or (jsonb_typeof(configuration) = 'object' and coalesce(configuration->>'version', '') = '1'));
comment on column public.gym_projects.configuration is 'Versioned configurator brief: height, indicative budget, selected zones and profile.';
