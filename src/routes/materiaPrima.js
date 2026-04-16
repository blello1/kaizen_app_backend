const express = require('express');
const router = express.Router();
const pool = require('../db');
const QRCode = require('qrcode');

// Listar todas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM materia_prima ORDER BY descricao ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obter uma por ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM materia_prima WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gerar QR Code para uma matéria-prima
router.get('/:id/qr', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM materia_prima WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });

    const material = result.rows[0];
    const qrData = JSON.stringify({ id: material.id, type: 'materia_prima' });
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

    res.json({ qr: qrDataUrl, material });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar
router.post('/', async (req, res) => {
  const {
    descricao, largura, comprimento, espessura,
    quantidade, estoque_minimo, estoque_maximo,
  } = req.body;

  if (!descricao || largura == null || comprimento == null || espessura == null) {
    return res.status(400).json({ error: 'Campos obrigatórios em falta' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO materia_prima
         (descricao, largura, comprimento, espessura, quantidade, estoque_minimo, estoque_maximo)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        descricao, largura, comprimento, espessura,
        quantidade ?? 0,
        estoque_minimo ?? 0,
        estoque_maximo ?? null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Já existe uma matéria-prima com esses valores' });
    res.status(500).json({ error: err.message });
  }
});

// Atualizar
router.put('/:id', async (req, res) => {
  const {
    descricao, largura, comprimento, espessura,
    quantidade, estoque_minimo, estoque_maximo,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE materia_prima
       SET descricao=$1, largura=$2, comprimento=$3, espessura=$4,
           quantidade=$5, estoque_minimo=$6, estoque_maximo=$7
       WHERE id=$8
       RETURNING *`,
      [
        descricao, largura, comprimento, espessura,
        quantidade, estoque_minimo, estoque_maximo ?? null,
        req.params.id,
      ]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Já existe uma matéria-prima com esses valores' });
    res.status(500).json({ error: err.message });
  }
});

// Eliminar
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM materia_prima WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });
    res.json({ message: 'Eliminado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
