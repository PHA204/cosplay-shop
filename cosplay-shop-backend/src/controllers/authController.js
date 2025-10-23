import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/database.js";
import { JWT_SECRET, JWT_EXPIRE } from "../config/jwt.js";

// 🧠 Đăng ký người dùng mới
export const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  try {
    await pool.query(
      "INSERT INTO users (id, name, email, password_hash, phone) VALUES ($1, $2, $3, $4, $5)",
      [userId, name, email, hashedPassword, phone || null]
    );

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: userId, name, email, phone },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }
    throw error;
  }
};

// 🧠 Đăng nhập
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

  if (result.rows.length === 0) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const user = result.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      avatar_url: user.avatar_url,
    },
  });
};

// 🧠 Lấy thông tin người dùng hiện tại
export const getCurrentUser = async (req, res) => {
  const result = await pool.query(
    "SELECT id, name, email, phone, address, avatar_url FROM users WHERE id = $1",
    [req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(result.rows[0]);
};

// 🧠 Cập nhật thông tin người dùng
export const updateUserProfile = async (req, res) => {
  const { name, phone, address, avatar_url } = req.body;

  const result = await pool.query(
    "UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), address = COALESCE($3, address), avatar_url = COALESCE($4, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, name, email, phone, address, avatar_url",
    [name, phone, address, avatar_url, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(result.rows[0]);
};
