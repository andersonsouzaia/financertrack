
-- Create reserva_emergencia table
CREATE TABLE IF NOT EXISTS public.reserva_emergencia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meta_total NUMERIC DEFAULT 0,
    custo_fixo_mensal NUMERIC DEFAULT 0,
    saldo_atual NUMERIC DEFAULT 0,
    dia_lembrete INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Create historico_reserva table
CREATE TABLE IF NOT EXISTS public.historico_reserva (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reserva_id UUID NOT NULL REFERENCES public.reserva_emergencia(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('aporte', 'resgate')),
    valor NUMERIC NOT NULL,
    categoria TEXT,
    descricao TEXT,
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.reserva_emergencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_reserva ENABLE ROW LEVEL SECURITY;

-- Policy for reserva_emergencia
CREATE POLICY "Users can view their own emergency fund"
    ON public.reserva_emergencia FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emergency fund"
    ON public.reserva_emergencia FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emergency fund"
    ON public.reserva_emergencia FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy for historico_reserva
CREATE POLICY "Users can view their own emergency fund history"
    ON public.historico_reserva FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.reserva_emergencia
        WHERE reserva_emergencia.id = historico_reserva.reserva_id
        AND reserva_emergencia.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own emergency fund history"
    ON public.historico_reserva FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.reserva_emergencia
        WHERE reserva_emergencia.id = historico_reserva.reserva_id
        AND reserva_emergencia.user_id = auth.uid()
    ));

-- Grant permissions
GRANT ALL ON public.reserva_emergencia TO authenticated;
GRANT ALL ON public.historico_reserva TO authenticated;
GRANT ALL ON public.reserva_emergencia TO service_role;
GRANT ALL ON public.historico_reserva TO service_role;
