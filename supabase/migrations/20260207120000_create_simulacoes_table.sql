
create table if not exists public.simulacoes_juros_compostos (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null default auth.uid(),
    nome text not null,
    valor_inicial numeric not null default 0,
    aporte_mensal numeric not null default 0,
    taxa_mensal numeric not null default 0,
    periodo_meses integer not null default 12,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint simulacoes_juros_compostos_pkey primary key (id),
    constraint simulacoes_juros_compostos_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade
);

-- Enable RLS
alter table public.simulacoes_juros_compostos enable row level security;

-- Create policies
create policy "Users can view their own simulations"
    on public.simulacoes_juros_compostos for select
    using (auth.uid() = user_id);

create policy "Users can insert their own simulations"
    on public.simulacoes_juros_compostos for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own simulations"
    on public.simulacoes_juros_compostos for update
    using (auth.uid() = user_id);

create policy "Users can delete their own simulations"
    on public.simulacoes_juros_compostos for delete
    using (auth.uid() = user_id);

-- Create index
create index if not exists simulacoes_juros_compostos_user_id_idx on public.simulacoes_juros_compostos(user_id);
