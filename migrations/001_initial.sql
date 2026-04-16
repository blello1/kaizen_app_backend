-- Tabela matéria-prima
CREATE TABLE IF NOT EXISTS materia_prima (
  id            SERIAL PRIMARY KEY,
  descricao     VARCHAR(255)   NOT NULL,
  largura       NUMERIC(10, 2) NOT NULL,
  comprimento   NUMERIC(10, 2) NOT NULL,
  espessura     NUMERIC(10, 2) NOT NULL,
  quantidade    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(10, 2) NOT NULL DEFAULT 0,
  estoque_maximo NUMERIC(10, 2),
  CONSTRAINT uq_materia_prima UNIQUE (descricao, largura, comprimento, espessura)
);

-- Tabela stocks (movimentações)
CREATE TABLE IF NOT EXISTS stocks (
  id               SERIAL PRIMARY KEY,
  materia_prima_id INTEGER        NOT NULL REFERENCES materia_prima(id) ON DELETE CASCADE,
  quer_reduzir     BOOLEAN        NOT NULL DEFAULT false,
  quantidade       NUMERIC(10, 2) NOT NULL,
  data             TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice para pesquisas por matéria-prima
CREATE INDEX IF NOT EXISTS idx_stocks_materia_prima ON stocks(materia_prima_id);
CREATE INDEX IF NOT EXISTS idx_stocks_data ON stocks(data DESC);
