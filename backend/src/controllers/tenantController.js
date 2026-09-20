const db = require("../config/database");

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

exports.getTenants = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM tenants WHERE is_active = true ORDER BY created_at DESC;`);
    res.json({ tenants: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getAllTenantsAdmin = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM tenants ORDER BY created_at DESC;`);
    res.json({ tenants: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createTenant = async (req, res) => {
  try {
    const body = req.body || {};
    let slug = slugify(body.slug || body.tenant || body.name);
    const name = String(body.name || "").trim();
    if (!name) return res.status(400).json({ error: "نام شاخه الزامی است" });
    if (!slug) return res.status(400).json({ error: "اسلاگ نامعتبر است (انگلیسی، بدون فاصله)" });

    const exists = await db.query(`SELECT id FROM tenants WHERE slug = $1 LIMIT 1;`, [slug]);
    if (exists.rows.length) {
      return res.status(400).json({ error: `شاخه با اسلاگ ${slug} قبلاً وجود دارد` });
    }

    const short_name = String(body.short_name || body.shortName || name).trim().slice(0, 80);
    const city = String(body.city || "").trim().slice(0, 80);
    const country = String(body.country || "Iran").trim().slice(0, 80);
    const city_fa = String(body.city_fa || body.cityFa || city).trim().slice(0, 80);
    const country_fa = String(body.country_fa || body.countryFa || country).trim().slice(0, 80);
    const city_en = String(body.city_en || body.cityEn || city).trim().slice(0, 80);
    const country_en = String(body.country_en || body.countryEn || country).trim().slice(0, 80);
    const phone = String(body.phone || "").trim().slice(0, 30);
    const whatsapp = String(body.whatsapp || "").trim().slice(0, 30);
    const email = String(body.email || "").trim().slice(0, 150);
    const instagram = String(body.instagram || "").trim().slice(0, 150);
    const address = String(body.address || "").trim().slice(0, 500);
    const logo = String(body.logo || "").trim().slice(0, 500);
    const primary_color = String(body.primary_color || body.primaryColor || "#d4af37").trim().slice(0, 20);
    const secondary_color = String(body.secondary_color || body.secondaryColor || "#050505").trim().slice(0, 20);
    const currency = String(body.currency || "AED").trim().slice(0, 10);
    const admin_mobile = String(body.admin_mobile || body.adminMobile || "").trim().slice(0, 20);
    const sms_sender = String(body.sms_sender || body.smsSender || "").trim().slice(0, 20);
    const default_language = String(body.default_language || body.defaultLanguage || "fa").trim().slice(0, 10);

    const result = await db.query(
      `INSERT INTO tenants (slug, name, short_name, city, country, city_fa, country_fa, city_en, country_en, phone, whatsapp, email, instagram, address, logo, primary_color, secondary_color, currency, admin_mobile, sms_sender, default_language)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *;`,
      [slug, name, short_name, city, country, city_fa, country_fa, city_en, country_en, phone, whatsapp, email, instagram, address, logo, primary_color, secondary_color, currency, admin_mobile, sms_sender, default_language]
    );

    res.status(201).json({ message: "شاخه جدید ساخته شد", tenant: result.rows[0] });
  } catch (e) {
    console.error("CREATE TENANT ERROR:", e.message);
    res.status(500).json({ error: e.message });
  }
};

exports.updateTenant = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const result = await db.query(
      `UPDATE tenants SET name = COALESCE($1, name), short_name = COALESCE($2, short_name), city = COALESCE($3, city), country = COALESCE($4, country), phone = COALESCE($5, phone), whatsapp = COALESCE($6, whatsapp), email = COALESCE($7, email), instagram = COALESCE($8, instagram), address = COALESCE($9, address), logo = COALESCE($10, logo), primary_color = COALESCE($11, primary_color), secondary_color = COALESCE($12, secondary_color), currency = COALESCE($13, currency), admin_mobile = COALESCE($14, admin_mobile), sms_sender = COALESCE($15, sms_sender), updated_at = NOW() WHERE id = $16 RETURNING *;`,
      [
        body.name || null,
        body.short_name || body.shortName || null,
        body.city || null,
        body.country || null,
        body.phone || null,
        body.whatsapp || null,
        body.email || null,
        body.instagram || null,
        body.address || null,
        body.logo || null,
        body.primary_color || body.primaryColor || null,
        body.secondary_color || body.secondaryColor || null,
        body.currency || null,
        body.admin_mobile || body.adminMobile || null,
        body.sms_sender || body.smsSender || null,
        id
      ]
    );
    if (!result.rows.length) return res.status(404).json({ error: "یافت نشد" });
    res.json({ tenant: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deleteTenant = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await db.query(`UPDATE tenants SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id;`, [id]);
    if (!result.rows.length) return res.status(404).json({ error: "یافت نشد" });
    res.json({ ok: true, message: "شاخه غیرفعال شد" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
