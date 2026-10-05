/**
 * 000 - ایجاد جداول پایه‌ی دیتابیس
 *
 * این جداول (users, dealerships, car_brands, car_models, cars, car_images,
 * purchase_requests) قبلاً به‌صورت دستی روی دیتابیس production ساخته شده بودند
 * و مایگریشن نداشتند. این مایگریشن برای محیط‌های جدید (dev/staging) آن‌ها را
 * با IF NOT EXISTS می‌سازد تا روی دیتابیس‌های موجود هم بی‌خطر باشد.
 */
module.exports = {
  id: '000_create_base_tables',
  description: 'Create base tables (users, dealerships, car_brands, car_models, cars, car_images, purchase_requests)',
  up: async (db) => {
    // --- users ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(150),
        mobile VARCHAR(20) UNIQUE,
        password TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'USER',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // --- dealerships ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS dealerships (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(150) NOT NULL,
        country VARCHAR(80),
        city VARCHAR(80),
        phone VARCHAR(30),
        address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // --- car_brands ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS car_brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // --- car_models ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS car_models (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        brand_id INTEGER REFERENCES car_brands(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_car_models_brand_id ON car_models(brand_id);`);

    // --- cars ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        dealership_id INTEGER REFERENCES dealerships(id) ON DELETE SET NULL,
        brand VARCHAR(120),
        model VARCHAR(120),
        brand_id INTEGER REFERENCES car_brands(id) ON DELETE SET NULL,
        model_id INTEGER REFERENCES car_models(id) ON DELETE SET NULL,
        year INTEGER,
        country VARCHAR(80),
        price_aed NUMERIC,
        shipping_cost NUMERIC,
        customs_cost NUMERIC,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        primary_image_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_cars_dealership_id ON cars(dealership_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_cars_brand_id ON cars(brand_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_cars_model_id ON cars(model_id);`);

    // --- car_images ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS car_images (
        id SERIAL PRIMARY KEY,
        car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        source_name VARCHAR(150),
        view_type VARCHAR(30) DEFAULT 'MAIN',
        approval_status VARCHAR(20) DEFAULT 'APPROVED',
        ai_processed BOOLEAN DEFAULT FALSE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_car_images_car_id ON car_images(car_id);`);

    // --- purchase_requests ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS purchase_requests (
        id SERIAL PRIMARY KEY,
        car_id INTEGER REFERENCES cars(id) ON DELETE SET NULL,
        customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  },
  down: async (db) => {
    await db.query(`DROP TABLE IF EXISTS purchase_requests;`);
    await db.query(`DROP TABLE IF EXISTS car_images;`);
    await db.query(`DROP TABLE IF EXISTS cars;`);
    await db.query(`DROP TABLE IF EXISTS car_models;`);
    await db.query(`DROP TABLE IF EXISTS car_brands;`);
    await db.query(`DROP TABLE IF EXISTS dealerships;`);
    await db.query(`DROP TABLE IF EXISTS users;`);
  }
};
