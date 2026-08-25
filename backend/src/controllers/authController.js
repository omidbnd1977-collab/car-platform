const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/database");


exports.register = async (req, res) => {
  try {
    const { full_name, mobile, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users 
      (full_name, mobile, password)
      VALUES ($1,$2,$3)
      RETURNING id, full_name, mobile, role`,
      [full_name, mobile, hashedPassword]
    );

    res.json({
      message: "User created",
      user: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const result = await db.query(
      "SELECT * FROM users WHERE mobile = $1",
      [mobile]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};