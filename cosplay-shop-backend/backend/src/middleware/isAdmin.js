// Path: src/middlewares/isAdmin.js

import jwt from "jsonwebtoken";
import pool from "../config/database.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Middleware để check admin token
export const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Admin access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if this is admin token (has isAdmin flag)
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get admin user from database
    const result = await pool.query(
      "SELECT id, username, email, full_name, role, is_active FROM admin_users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: "Admin user not found" });
    }

    const admin = result.rows[0];

    if (!admin.is_active) {
      return res.status(403).json({ error: "Admin account is deactivated" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(403).json({ error: "Invalid token" });
  }
};

// Middleware để check role cụ thể
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(403).json({ error: "Admin authentication required" });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${allowedRoles.join(", ")}` 
      });
    }

    next();
  };
};

// Middleware để log activity
export const logActivity = (action) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log activity after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        pool.query(
          `INSERT INTO activity_logs (admin_id, action, entity_type, entity_id, details, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            req.admin?.id || null,
            action,
            req.params.id ? req.baseUrl.split('/').pop() : null,
            req.params.id || null,
            JSON.stringify({ body: req.body, params: req.params }),
            req.ip,
            req.get('user-agent')
          ]
        ).catch(err => console.error('Failed to log activity:', err));
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};