require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const sqlPath = path.join(__dirname, '../migrations/001_initial.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    await pool.query(sql);
    console.log('Migração concluída com sucesso!');
  } catch (err) {
    console.error('Erro na migração:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
