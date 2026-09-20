const fs = require('fs');
const path = require('path');
const db = require('./database');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
async function ensureMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(100) PRIMARY KEY,
      description TEXT,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
async function getExecutedMigrations() {
  await ensureMigrationsTable();
  const result = await db.query(`SELECT id FROM migrations ORDER BY id ASC;`);
  return new Set(result.rows.map(r => r.id));
}
function loadMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.js')).sort();
  return files.map(file => {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    delete require.cache[require.resolve(fullPath)];
    return require(fullPath);
  });
}
async function runMigrations() {
  console.log('MIGRATIONS: Checking...');
  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();
  const migrations = loadMigrationFiles();
  let ran = 0;
  for (const migration of migrations) {
    if (executed.has(migration.id)) continue;
    console.log(`MIGRATIONS: Running ${migration.id} - ${migration.description}`);
    try {
      await migration.up(db);
      await db.query(`INSERT INTO migrations (id, description) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING;`, [migration.id, migration.description]);
      console.log(`MIGRATIONS: ✅ ${migration.id} done`);
      ran++;
    } catch (e) {
      console.error(`MIGRATIONS: ❌ ${migration.id} failed:`, e.message);
      throw e;
    }
  }
  if (ran === 0) console.log('MIGRATIONS: All up to date');
  else console.log(`MIGRATIONS: ${ran} migration(s) executed`);
  return ran;
}
async function rollbackLast() {
  const result = await db.query(`SELECT id FROM migrations ORDER BY executed_at DESC LIMIT 1;`);
  if (!result.rows.length) { console.log('MIGRATIONS: Nothing to rollback'); return; }
  const lastId = result.rows[0].id;
  const migrations = loadMigrationFiles();
  const migration = migrations.find(m => m.id === lastId);
  if (migration && migration.down) {
    console.log(`MIGRATIONS: Rolling back ${lastId}`);
    await migration.down(db);
    await db.query(`DELETE FROM migrations WHERE id = $1;`, [lastId]);
    console.log(`MIGRATIONS: Rolled back ${lastId}`);
  }
}
module.exports = { runMigrations, rollbackLast, ensureMigrationsTable, getExecutedMigrations };
if (require.main === module) {
  runMigrations().then(() => { console.log('MIGRATIONS: Done'); process.exit(0); }).catch((e) => { console.error('MIGRATIONS: Failed', e); process.exit(1); });
}
