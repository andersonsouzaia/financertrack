-- Migração: Sistema de Parcelamento
-- Cria tabelas para gerenciar compras parceladas e suas parcelas

-- Tabela de compras parceladas
CREATE TABLE IF NOT EXISTS compras_parceladas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total > 0),
  total_parcelas INTEGER NOT NULL CHECK (total_parcelas > 0 AND total_parcelas <= 12),
  data_primeira_parcela DATE NOT NULL,
  cartao_id UUID REFERENCES cartoes(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES categorias_saidas(id) ON DELETE SET NULL,
  banco_conta_id UUID REFERENCES bancos_contas(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT compras_parceladas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de parcelas individuais
CREATE TABLE IF NOT EXISTS parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_parcelada_id UUID NOT NULL REFERENCES compras_parceladas(id) ON DELETE CASCADE,
  transacao_id UUID REFERENCES transacoes(id) ON DELETE SET NULL,
  fatura_id UUID REFERENCES faturas_cartoes(id) ON DELETE SET NULL,
  numero_parcela INTEGER NOT NULL CHECK (numero_parcela > 0),
  total_parcelas INTEGER NOT NULL CHECK (total_parcelas > 0),
  valor_parcela DECIMAL(10, 2) NOT NULL CHECK (valor_parcela > 0),
  data_vencimento DATE NOT NULL,
  pago BOOLEAN DEFAULT FALSE,
  data_pagamento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT parcelas_compra_fkey FOREIGN KEY (compra_parcelada_id) REFERENCES compras_parceladas(id) ON DELETE CASCADE,
  CONSTRAINT parcelas_transacao_fkey FOREIGN KEY (transacao_id) REFERENCES transacoes(id) ON DELETE SET NULL,
  CONSTRAINT parcelas_fatura_fkey FOREIGN KEY (fatura_id) REFERENCES faturas_cartoes(id) ON DELETE SET NULL,
  CONSTRAINT unique_parcela_compra UNIQUE (compra_parcelada_id, numero_parcela)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_compras_parceladas_user_id ON compras_parceladas(user_id);
CREATE INDEX IF NOT EXISTS idx_compras_parceladas_cartao_id ON compras_parceladas(cartao_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_compra_id ON parcelas(compra_parcelada_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_transacao_id ON parcelas(transacao_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_fatura_id ON parcelas(fatura_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_data_vencimento ON parcelas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_pago ON parcelas(pago);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_compras_parceladas_updated_at
  BEFORE UPDATE ON compras_parceladas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parcelas_updated_at
  BEFORE UPDATE ON parcelas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE compras_parceladas ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para compras_parceladas
CREATE POLICY "Users can view their own parceled purchases"
  ON compras_parceladas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own parceled purchases"
  ON compras_parceladas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own parceled purchases"
  ON compras_parceladas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own parceled purchases"
  ON compras_parceladas FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para parcelas
CREATE POLICY "Users can view their own installments"
  ON parcelas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM compras_parceladas
      WHERE compras_parceladas.id = parcelas.compra_parcelada_id
      AND compras_parceladas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own installments"
  ON parcelas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM compras_parceladas
      WHERE compras_parceladas.id = parcelas.compra_parcelada_id
      AND compras_parceladas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own installments"
  ON parcelas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM compras_parceladas
      WHERE compras_parceladas.id = parcelas.compra_parcelada_id
      AND compras_parceladas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own installments"
  ON parcelas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM compras_parceladas
      WHERE compras_parceladas.id = parcelas.compra_parcelada_id
      AND compras_parceladas.user_id = auth.uid()
    )
  );

-- Comentários nas tabelas
COMMENT ON TABLE compras_parceladas IS 'Armazena informações sobre compras parceladas';
COMMENT ON TABLE parcelas IS 'Armazena as parcelas individuais de cada compra parcelada';
COMMENT ON COLUMN compras_parceladas.total_parcelas IS 'Número total de parcelas (máximo 12)';
COMMENT ON COLUMN parcelas.numero_parcela IS 'Número da parcela atual (1, 2, 3, etc.)';
COMMENT ON COLUMN parcelas.transacao_id IS 'Referência à transação criada quando a parcela é paga';
COMMENT ON COLUMN parcelas.fatura_id IS 'Referência à fatura do cartão onde a parcela será incluída';
