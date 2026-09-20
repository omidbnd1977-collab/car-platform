/**
 * 001 - ایجاد جدول visit_requests با مدیریت نسخه
 * جایگزین CREATE TABLE IF NOT EXISTS در controller
 */
module.exports = {
  id: '001_create_visit_requests',
  description: 'Create visit_requests table with indexes',
  up: async (db) => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS visit_requests (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(80) NOT NULL,
        last_name VARCHAR(80) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        car_id INTEGER,
        car_brand VARCHAR(120),
        car_model VARCHAR(120),
        car_year INTEGER,
        car_title VARCHAR(250),
        car_price_aed NUMERIC,
        status VARCHAR(30) NOT NULL DEFAULT 'جدید',
        sms_consent BOOLEAN NOT NULL DEFAULT FALSE,
        sms_consent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ip_address VARCHAR(64)
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_visit_requests_mobile ON visit_requests(mobile);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_visit_requests_car_id ON visit_requests(car_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_visit_requests_created_at ON visit_requests(created_at DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_visit_requests_status ON visit_requests(status);`);
  },
  down: async (db) => {
    await db.query(`DROP TABLE IF EXISTS visit_requests;`);
  }
};
