module.exports = {
  id: '004_create_tenants',
  description: 'Create tenants table for dynamic branch creation',
  up: async (db) => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(150) NOT NULL,
        short_name VARCHAR(80),
        city VARCHAR(80),
        country VARCHAR(80),
        city_fa VARCHAR(80),
        country_fa VARCHAR(80),
        city_en VARCHAR(80),
        country_en VARCHAR(80),
        phone VARCHAR(30),
        whatsapp VARCHAR(30),
        email VARCHAR(150),
        instagram VARCHAR(150),
        address TEXT,
        logo TEXT,
        primary_color VARCHAR(20) DEFAULT '#d4af37',
        secondary_color VARCHAR(20) DEFAULT '#050505',
        currency VARCHAR(10) DEFAULT 'AED',
        admin_mobile VARCHAR(20),
        sms_sender VARCHAR(20),
        default_language VARCHAR(10) DEFAULT 'fa',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);`);
  },
  down: async (db) => {
    await db.query(`DROP TABLE IF EXISTS tenants;`);
  }
};
