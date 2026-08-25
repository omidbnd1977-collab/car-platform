const db = require("../config/database");


exports.getActiveCars = async (req, res) => {

  try {

    const {
      brand,
      country,
      min,
      max
    } = req.query;


    let query = `
      SELECT
        cars.id,
        cars.brand,
        cars.model,
        cars.year,
        cars.country,
        cars.price_aed,
        cars.shipping_cost,
        cars.customs_cost,
        cars.description,
        cars.status,
        dealerships.name AS dealership_name,
        dealerships.city
      FROM cars
      JOIN dealerships
      ON cars.dealership_id = dealerships.id
      WHERE cars.status = 'ACTIVE'
    `;


    const values = [];
    let index = 1;


    if (brand) {
      query += ` AND cars.brand ILIKE $${index}`;
      values.push(`%${brand}%`);
      index++;
    }


    if (country) {
      query += ` AND cars.country ILIKE $${index}`;
      values.push(`%${country}%`);
      index++;
    }


    if (min) {
      query += ` AND cars.price_aed >= $${index}`;
      values.push(min);
      index++;
    }


    if (max) {
      query += ` AND cars.price_aed <= $${index}`;
      values.push(max);
      index++;
    }


    query += `
      ORDER BY cars.created_at DESC
    `;


    const result = await db.query(query, values);


    res.json({
      count: result.rows.length,
      cars: result.rows
    });


  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};
exports.getCarDetails = async (req, res) => {

  try {

    const { id } = req.params;


    const carResult = await db.query(
      `
      SELECT
        cars.id,
        cars.brand,
        cars.model,
        cars.year,
        cars.country,
        cars.price_aed,
        cars.shipping_cost,
        cars.customs_cost,
        cars.description,
        cars.status,
        dealerships.name AS dealership_name,
        dealerships.city,
        dealerships.phone,
        dealerships.address
      FROM cars
      JOIN dealerships
      ON cars.dealership_id = dealerships.id
      WHERE cars.id = $1
      AND cars.status = 'ACTIVE'
      `,
      [id]
    );


    if (carResult.rows.length === 0) {
      return res.status(404).json({
        message: "Car not found"
      });
    }


    const imageResult = await db.query(
      `
      SELECT
        id,
        image_url,
        ai_processed,
        approval_status
      FROM car_images
      WHERE car_id = $1
      `,
      [id]
    );


    res.json({
      car: {
        ...carResult.rows[0],
        images: imageResult.rows
      }
    });


  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};