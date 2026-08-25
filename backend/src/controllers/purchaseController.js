const db = require("../config/database");

// ایجاد درخواست خرید توسط مشتری
exports.createRequest = async (req, res) => {
  try {
    const { car_id, message } = req.body;

    const customer_id = req.user.id;

    const result = await db.query(
      `
      INSERT INTO purchase_requests
      (car_id, customer_id, message)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [car_id, customer_id, message]
    );

    res.json({
      message: "Purchase request created",
      request: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


// مشاهده همه درخواست‌های خرید
exports.getRequests = async (req, res) => {
  try {

    const result = await db.query(`
      SELECT
        purchase_requests.id,
        purchase_requests.message,
        purchase_requests.status,
        purchase_requests.created_at,

        users.full_name AS customer_name,
        users.mobile,

        cars.brand,
        cars.model,
        cars.year

      FROM purchase_requests

      JOIN users
        ON purchase_requests.customer_id = users.id

      JOIN cars
        ON purchase_requests.car_id = cars.id

      ORDER BY purchase_requests.created_at DESC
    `);

    res.json({
      requests: result.rows
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


// تایید درخواست خرید
exports.approveRequest = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE purchase_requests
      SET status = 'APPROVED'
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Request not found"
      });
    }

    res.json({
      message: "Purchase request approved",
      request: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


// رد درخواست خرید
exports.rejectRequest = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE purchase_requests
      SET status = 'REJECTED'
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Request not found"
      });
    }

    res.json({
      message: "Purchase request rejected",
      request: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};