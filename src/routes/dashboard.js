const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [totais, hoje, alertas, visaoGeral, sete_dias, recentes] = await Promise.all([

      // Totais gerais
      pool.query(`
        SELECT
          COUNT(*)::int                                                                         AS total_materiais,
          SUM(CASE WHEN quantidade <= 0             THEN 1 ELSE 0 END)::int                    AS esgotados,
          SUM(CASE WHEN quantidade > 0 AND quantidade <= estoque_minimo THEN 1 ELSE 0 END)::int AS stock_baixo,
          SUM(CASE WHEN estoque_maximo IS NOT NULL AND quantidade >= estoque_maximo THEN 1 ELSE 0 END)::int AS stock_cheio,
          COUNT(CASE WHEN quantidade > estoque_minimo THEN 1 END)::int                         AS stock_ok
        FROM materia_prima
      `),

      // Movimentos de hoje
      pool.query(`
        SELECT
          COUNT(*)::int                                                             AS total_movimentos,
          COALESCE(SUM(CASE WHEN NOT quer_reduzir THEN 1 ELSE 0 END), 0)::int     AS num_entradas,
          COALESCE(SUM(CASE WHEN     quer_reduzir THEN 1 ELSE 0 END), 0)::int     AS num_saidas,
          COALESCE(SUM(CASE WHEN NOT quer_reduzir THEN quantidade ELSE 0 END), 0) AS qtd_entradas,
          COALESCE(SUM(CASE WHEN     quer_reduzir THEN quantidade ELSE 0 END), 0) AS qtd_saidas
        FROM stocks
        WHERE data::date = CURRENT_DATE
      `),

      // Alertas de stock baixo / esgotado
      pool.query(`
        SELECT id, descricao, largura, comprimento, espessura,
               quantidade, estoque_minimo, estoque_maximo
        FROM materia_prima
        WHERE quantidade <= estoque_minimo
        ORDER BY (quantidade - estoque_minimo) ASC
        LIMIT 10
      `),

      // Visão geral de todos os materiais (para barras de progresso)
      pool.query(`
        SELECT id, descricao, largura, comprimento, espessura,
               quantidade, estoque_minimo, estoque_maximo
        FROM materia_prima
        ORDER BY
          CASE WHEN quantidade <= 0             THEN 0
               WHEN quantidade <= estoque_minimo THEN 1
               ELSE 2
          END,
          descricao
      `),

      // Movimentos dos últimos 7 dias (preenchido com zeros para dias sem movimento)
      pool.query(`
        SELECT
          g.dia::date AS dia,
          COALESCE(SUM(CASE WHEN NOT s.quer_reduzir THEN s.quantidade ELSE 0 END), 0) AS entradas,
          COALESCE(SUM(CASE WHEN     s.quer_reduzir THEN s.quantidade ELSE 0 END), 0) AS saidas,
          COALESCE(COUNT(s.id), 0)::int AS total
        FROM generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          '1 day'::interval
        ) g(dia)
        LEFT JOIN stocks s ON s.data::date = g.dia::date
        GROUP BY g.dia
        ORDER BY g.dia ASC
      `),

      // Últimos 12 movimentos
      pool.query(`
        SELECT s.id, s.materia_prima_id, s.quer_reduzir, s.quantidade, s.data,
               mp.descricao, mp.largura, mp.comprimento, mp.espessura
        FROM stocks s
        JOIN materia_prima mp ON s.materia_prima_id = mp.id
        ORDER BY s.data DESC
        LIMIT 12
      `),
    ]);

    res.json({
      totais:              totais.rows[0],
      hoje:                hoje.rows[0],
      alertas_stock_baixo: alertas.rows,
      visao_geral:         visaoGeral.rows,
      movimentos_7dias:    sete_dias.rows,
      movimentos_recentes: recentes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
