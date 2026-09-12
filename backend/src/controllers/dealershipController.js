const db = require("../config/database");

exports.createDealership = async (req, res) => {
  try {
    const {
      user_id,
      name,
      country,
      city,
      phone,
      address
    } = req.body;

    const result = await db.query(
      `INSERT INTO dealerships
      (user_id, name, country, city, phone, address)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        user_id,
        name,
        country,
        city,
        phone,
        address
      ]
    );

    res.json({
      message: "Dealership created",
      dealership: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

// ============================================================
// LIST DEALERSHIPS
// GET /api/dealerships
// ============================================================
// برای این‌که فرم «افزودن خودرو» نمایندگی را هم به‌صورت انتخابی
// (نه تایپی) داشته باشد. نام نمایندگی همان چیزی است که
// createCar با آن مچ می‌کند، پس list کردن همان name لازم است.
// ============================================================
exports.getDealerships = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT id, name, city, country
      FROM dealerships
      ORDER BY name
      `
    );

    res.json({
      dealerships: result.rows
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
