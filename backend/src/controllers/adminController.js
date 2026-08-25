const db = require("../config/database");


// نمایش خودروهای در انتظار تایید
exports.getPendingCars = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        cars.*,
        dealerships.name AS dealership_name,
        dealerships.city
      FROM cars
      JOIN dealerships
      ON cars.dealership_id = dealerships.id
      WHERE cars.status = 'PENDING'
      ORDER BY cars.created_at DESC`
    );

    res.json({
      cars: result.rows
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};



// تایید خودرو
exports.approveCar = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE cars
       SET status = 'ACTIVE'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({
      message: "Car approved",
      car: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};



// رد خودرو
exports.rejectCar = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE cars
       SET status = 'REJECTED'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({
      message: "Car rejected",
      car: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};