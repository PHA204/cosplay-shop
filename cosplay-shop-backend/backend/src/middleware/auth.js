// Path: backend/src/middleware/auth.js

import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config/jwt.js"

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" })
    }
    req.user = user
    next()
  })
}

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user
      }
    })
  }
  next()
}

// Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" })
  }

  // Check if user has admin role (support both role and isAdmin flag)
  const hasAdminRole = req.user.role === 'admin' || req.user.isAdmin === true;
  
  if (!hasAdminRole) {
    console.log('❌ Admin access denied. User:', req.user);
    return res.status(403).json({ error: "Admin access required" })
  }

  console.log('✅ Admin access granted');
  next()
}