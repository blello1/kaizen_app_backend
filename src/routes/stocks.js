const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar todos os movimentos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.materia_prima_id,
        s.quer_reduzir,
        s.quantidade,
        s.data,
        mp.descricao,
        mp.largura,
        mp.comprimento,
        mp.espessura
      FROM stocks s
      JOIN materia_prima mp ON s.materia_prima_id = mp.id
      ORDER BY s.data DESC
      LIMIT 500
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Movimentos de uma matéria-prima específica
router.get('/materia-prima/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.materia_prima_id,
        s.quer_reduzir,
        s.quantidade,
        s.data,
        mp.descricao,
        mp.largura,
        mp.comprimento,
        mp.espessura
      FROM stocks s
      JOIN materia_prima mp ON s.materia_prima_id = mp.id
      WHERE s.materia_prima_id = $1
      ORDER BY s.data DESC
    `,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registar movimento (entrada ou saída)
router.post('/', async (req, res) => {
  const { materia_prima_id, quer_reduzir, quantidade } = req.body;

  if (!materia_prima_id || quantidade == null || quantidade <= 0) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Bloqueia o registo para evitar condições de corrida
    const materialResult = await client.query(
      'SELECT * FROM materia_prima WHERE id = $1 FOR UPDATE',
      [materia_prima_id]
    );

    if (materialResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });
    }

    const material = materialResult.rows[0];
    const qtdAtual = parseFloat(material.quantidade);
    const qtdMovimento = parseFloat(quantidade);

    const novaQtd = quer_reduzir
      ? qtdAtual - qtdMovimento
      : qtdAtual + qtdMovimento;

    if (novaQtd < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Stock insuficiente. Stock atual: ${qtdAtual}`,
      });
    }

    // Inserir movimento
    const movimentoResult = await client.query(
      `INSERT INTO stocks (materia_prima_id, quer_reduzir, quantidade, data)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [materia_prima_id, !!quer_reduzir, qtdMovimento]
    );

    // Atualizar stock na matéria-prima
    await client.query(
      'UPDATE materia_prima SET quantidade = $1 WHERE id = $2',
      [novaQtd, materia_prima_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      movimento: movimentoResult.rows[0],
      quantidade_anterior: qtdAtual,
      quantidade_nova: novaQtd,
      material: { ...material, quantidade: novaQtd },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
