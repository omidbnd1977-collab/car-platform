module.exports = {
  id: '002_add_sold_at_to_cars',
  description: 'Add sold_at column to cars table',
  up: async (db) => {
    await db.query(`ALTER TABLE cars ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_cars_sold_at ON cars(sold_at DESC);`);
  },
  down: async (db) => {
    await db.query(`ALTER TABLE cars DROP COLUMN IF EXISTS sold_at;`);
  }
};
