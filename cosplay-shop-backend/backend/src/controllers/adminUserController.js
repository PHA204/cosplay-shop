// Path: backend/src/controllers/adminUserController.js

import pool from "../config/database.js";
import bcrypt from "bcryptjs";

// 📋 Get All Users
export const getAdminUsers = async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search,
    sort_by = 'created_at',
    order = 'desc'
  } = req.query;
  
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.address,
        u.avatar_url,
        u.created_at,
        COUNT(DISTINCT ro.id) as total_orders,
        COALESCE(SUM(CASE WHEN ro.status NOT IN ('cancelled') THEN ro.total_amount ELSE 0 END), 0) as total_spent,
        MAX(ro.created_at) as last_order_date
      FROM users u
      LEFT JOIN rental_order ro ON u.id = ro.user_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY u.id`;

    // Sorting
    const validSortFields = ['name', 'email', 'created_at', 'total_orders', 'total_spent'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    if (sort_by === 'total_orders' || sort_by === 'total_spent') {
      query += ` ORDER BY ${sort_by} ${sortOrder}`;
    } else {
      query += ` ORDER BY u.${sortField} ${sortOrder}`;
    }

    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM users u WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 0;

    if (search) {
      countParamIndex++;
      countQuery += ` AND (u.name ILIKE $${countParamIndex} OR u.email ILIKE $${countParamIndex} OR u.phone ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      data: result.rows.map(u => ({
        ...u,
        total_spent: parseFloat(u.total_spent || 0),
        total_orders: parseInt(u.total_orders || 0),
      })),
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔍 Get User Detail
export const getUserDetail = async (req, res) => {
  const { id } = req.params;

  try {
    // Get user info
    const userResult = await pool.query(
      `SELECT 
        u.*,
        COUNT(DISTINCT ro.id) as total_orders,
        COALESCE(SUM(CASE WHEN ro.status NOT IN ('cancelled') THEN ro.total_amount ELSE 0 END), 0) as total_spent,
        COUNT(DISTINCT ro.id) FILTER (WHERE ro.status = 'completed') as completed_orders,
        COUNT(DISTINCT ro.id) FILTER (WHERE ro.status = 'cancelled') as cancelled_orders
      FROM users u
      LEFT JOIN rental_order ro ON u.id = ro.user_id
      WHERE u.id = $1
      GROUP BY u.id`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Get recent orders
    const ordersResult = await pool.query(
      `SELECT 
        id,
        order_number,
        rental_start_date,
        rental_end_date,
        total_amount,
        status,
        payment_status,
        created_at
      FROM rental_order
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10`,
      [id]
    );

    // Get wishlist count
    const wishlistResult = await pool.query(
      `SELECT COUNT(*) FROM wishlist WHERE user_id = $1`,
      [id]
    );

    // Get reviews count
    const reviewsResult = await pool.query(
      `SELECT COUNT(*) as count, AVG(rating) as avg_rating 
       FROM reviews WHERE user_id = $1`,
      [id]
    );

    res.json({
      ...user,
      total_spent: parseFloat(user.total_spent),
      total_orders: parseInt(user.total_orders),
      completed_orders: parseInt(user.completed_orders),
      cancelled_orders: parseInt(user.cancelled_orders),
      wishlist_count: parseInt(wishlistResult.rows[0].count),
      reviews_count: parseInt(reviewsResult.rows[0].count),
      avg_rating: parseFloat(reviewsResult.rows[0].avg_rating || 0),
      recent_orders: ordersResult.rows.map(o => ({
        ...o,
        total_amount: parseFloat(o.total_amount)
      })),
    });
  } catch (error) {
    console.error("Get user detail error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✏️ Update User
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, phone, address, avatar_url, email } = req.body;

  try {
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }

    if (email !== undefined) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email);
    }

    if (phone !== undefined) {
      paramCount++;
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
    }

    if (address !== undefined) {
      paramCount++;
      updates.push(`address = $${paramCount}`);
      params.push(address);
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
      UPDATE users 
      SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, name, email, phone, address, avatar_url
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (admin_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.admin.id,
        'update_user',
        'user',
        id,
        JSON.stringify({ updates: req.body })
      ]
    );

    res.json({
      message: "User updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("Update user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔒 Reset User Password
export const resetUserPassword = async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ 
      error: "Password must be at least 6 characters" 
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(new_password, 10);

    const result = await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING email",
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (admin_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.admin.id,
        'reset_user_password',
        'user',
        id,
        JSON.stringify({ email: result.rows[0].email })
      ]
    );

    res.json({ 
      message: "Password reset successfully",
      email: result.rows[0].email
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🗑️ Delete User (Soft delete by marking inactive)
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if user has active orders
    const activeOrdersResult = await pool.query(
      `SELECT COUNT(*) FROM rental_order 
       WHERE user_id = $1 
       AND status IN ('confirmed', 'preparing', 'delivering', 'rented', 'returning')`,
      [id]
    );

    if (parseInt(activeOrdersResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: "Cannot delete user with active rental orders",
      });
    }

    // Get user info before deletion
    const userResult = await pool.query(
      "SELECT email, name FROM users WHERE id = $1",
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete user (CASCADE will handle related records)
    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (admin_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.admin.id,
        'delete_user',
        'user',
        id,
        JSON.stringify({ 
          email: userResult.rows[0].email,
          name: userResult.rows[0].name
        })
      ]
    );

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📊 Get User Statistics
export const getUserStatistics = async (req, res) => {
  try {
    // Total users
    const totalResult = await pool.query(`SELECT COUNT(*) FROM users`);

    // New users this month
    const newThisMonthResult = await pool.query(`
      SELECT COUNT(*) FROM users
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    // Users with orders
    const withOrdersResult = await pool.query(`
      SELECT COUNT(DISTINCT user_id) FROM rental_order
    `);

    // Top spending users
    const topSpendersResult = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        COUNT(ro.id) as total_orders,
        COALESCE(SUM(ro.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN rental_order ro ON u.id = ro.user_id AND ro.status NOT IN ('cancelled')
      GROUP BY u.id
      HAVING COUNT(ro.id) > 0
      ORDER BY total_spent DESC
      LIMIT 10
    `);

    res.json({
      total_users: parseInt(totalResult.rows[0].count),
      new_this_month: parseInt(newThisMonthResult.rows[0].count),
      users_with_orders: parseInt(withOrdersResult.rows[0].count),
      top_spenders: topSpendersResult.rows.map(u => ({
        ...u,
        total_orders: parseInt(u.total_orders),
        total_spent: parseFloat(u.total_spent)
      }))
    });
  } catch (error) {
    console.error("Get user statistics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📤 Export Users to CSV
export const exportUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.address,
        u.created_at,
        COUNT(DISTINCT ro.id) as total_orders,
        COALESCE(SUM(CASE WHEN ro.status NOT IN ('cancelled') THEN ro.total_amount ELSE 0 END), 0) as total_spent
      FROM users u
      LEFT JOIN rental_order ro ON u.id = ro.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    // Convert to CSV
    const headers = [
      'ID', 'Name', 'Email', 'Phone', 'Address', 
      'Total Orders', 'Total Spent', 'Created At'
    ];

    let csv = headers.join(',') + '\n';

    result.rows.forEach(row => {
      csv += [
        row.id,
        `"${row.name}"`,
        row.email,
        row.phone || '',
        `"${row.address || ''}"`,
        row.total_orders,
        row.total_spent,
        row.created_at,
      ].join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } catch (error) {
    console.error("Export users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};