create table if not exists public.projecoes_orcamento (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null default auth.uid(),
    nome text not null,
    tipo text not null, -- 'viagem', 'apartamento', 'negocio', 'aposentadoria', 'imovel', 'educacao', 'customizado'
    dados jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint projecoes_orcamento_pkey primary key (id),
    constraint projecoes_orcamento_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade
);

alter table public.projecoes_orcamento enable row level security;

create policy "Users can view their own projections"
    on public.projecoes_orcamento for select
    using (auth.uid() = user_id);

create policy "Users can insert their own projections"
    on public.projecoes_orcamento for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own projections"
    on public.projecoes_orcamento for update
    using (auth.uid() = user_id);

create policy "Users can delete their own projections"
    on public.projecoes_orcamento for delete
    using (auth.uid() = user_id);
