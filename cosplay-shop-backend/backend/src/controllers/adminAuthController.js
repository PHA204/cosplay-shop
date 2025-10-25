import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/database.js";
import { JWT_SECRET, JWT_EXPIRE } from "../config/jwt.js";

// 🔐 Admin Login
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Get admin user
    const result = await pool.query(
      "SELECT * FROM admin_users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const admin = result.rows[0];

    if (!admin.is_active) {
      return res.status(403).json({ error: "Admin account is deactivated" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await pool.query(
      "UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [admin.id]
    );

    // Generate token with isAdmin flag
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email,
        role: admin.role,
        isAdmin: true // Important: flag để phân biệt với user token
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (admin_id, action, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [admin.id, 'admin_login', req.ip, req.get('user-agent')]
    );

    res.json({
      message: "Admin login successful",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        avatar_url: admin.avatar_url,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 👤 Get Current Admin
export const getCurrentAdmin = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, full_name, role, avatar_url, last_login, created_at
       FROM admin_users WHERE id = $1`,
      [req.admin.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get admin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔓 Admin Logout
export const adminLogout = async (req, res) => {
  // Log activity
  await pool.query(
    `INSERT INTO activity_logs (admin_id, action, ip_address, user_agent)
     VALUES ($1, $2, $3, $4)`,
    [req.admin.id, 'admin_logout', req.ip, req.get('user-agent')]
  );

  res.json({ message: "Admin logout successful" });
};

// 👥 Create Admin User (Super Admin only)
export const createAdminUser = async (req, res) => {
  const { username, email, password, full_name, role = 'staff' } = req.body;

  if (!username || !email || !password || !full_name) {
    return res.status(400).json({ 
      error: "Username, email, password, and full name are required" 
    });
  }

  // Validate role
  const validRoles = ['super_admin', 'admin', 'staff'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminId = uuidv4();

    const result = await pool.query(
      `INSERT INTO admin_users (id, username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, full_name, role, created_at`,
      [adminId, username, email, hashedPassword, full_name, role]
    );

    res.status(201).json({
      message: "Admin user created successfully",
      admin: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ 
        error: "Username or email already exists" 
      });
    }
    console.error("Create admin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📋 List Admin Users (Super Admin/Admin only)
export const listAdminUsers = async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT id, username, email, full_name, role, avatar_url, is_active, 
             last_login, created_at
      FROM admin_users
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    if (search) {
      paramCount++;
      query += ` AND (username ILIKE $${paramCount} OR email ILIKE $${paramCount} OR full_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) FROM admin_users WHERE 1=1";
    const countParams = [];
    let countParamIndex = 0;

    if (role) {
      countParamIndex++;
      countQuery += ` AND role = $${countParamIndex}`;
      countParams.push(role);
    }

    if (search) {
      countParamIndex++;
      countQuery += ` AND (username ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex} OR full_name ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("List admin users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔄 Update Admin User
export const updateAdminUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, role, is_active, avatar_url } = req.body;

  try {
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (full_name !== undefined) {
      paramCount++;
      updates.push(`full_name = $${paramCount}`);
      params.push(full_name);
    }

    if (role !== undefined) {
      const validRoles = ['super_admin', 'admin', 'staff'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      paramCount++;
      updates.push(`role = $${paramCount}`);
      params.push(role);
    }

    if (is_active !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
    }

    if (avatar_url !== undefined) {
      paramCount++;
      updates.push(`avatar_url = $${paramCount}`);
      params.push(avatar_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    paramCount++;
    params.push(id);

    const query = `
      UPDATE admin_users 
      SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, username, email, full_name, role, is_active, avatar_url
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    res.json({
      message: "Admin user updated successfully",
      admin: result.rows[0],
    });
  } catch (error) {
    console.error("Update admin user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔒 Change Admin Password
export const changeAdminPassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ 
      error: "Current password and new password are required" 
    });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ 
      error: "New password must be at least 6 characters" 
    });
  }

  try {
    // Get current admin with password
    const result = await pool.query(
      "SELECT password_hash FROM admin_users WHERE id = $1",
      [req.admin.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      current_password,
      result.rows[0].password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await pool.query(
      "UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [hashedPassword, req.admin.id]
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};