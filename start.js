require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const ssl = process.env.DATABASE_URL ? { rejectUnauthorized: false } : false;

async function runMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations/001_initial.sql'), 'utf8');
    await pool.query(sql);
    console.log('[start] Migração OK');
  } catch (err) {
    console.warn('[start] Migração ignorada (tabelas já existem ou erro não fatal):', err.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  await runMigration();

  const app = require('./src/app');
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`[start] Servidor a correr na porta ${PORT}`);
  });
}

main().catch(err => {
  console.error('[start] Erro fatal:', err);
  process.exit(1);
});
