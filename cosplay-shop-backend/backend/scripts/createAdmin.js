// Path: backend/scripts/createAdmin.js

import bcrypt from "bcryptjs";
import pg from "pg";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "123456",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "cosplay_shop",
});

async function createAdmin() {
  try {
    const email = "admin@cosplayshop.com";
    const password = "admin123";
    
    console.log("🔐 Creating admin user...");
    console.log("Email:", email);
    console.log("Password:", password);
    
    // Hash password với bcrypt
    console.log("\n⏳ Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed successfully");
    console.log("Hash preview:", hashedPassword.substring(0, 30) + "...");
    
    // Xóa admin cũ nếu có
    console.log("\n🗑️ Deleting old admin if exists...");
    const deleteResult = await pool.query(
      "DELETE FROM admin_users WHERE email = $1",
      [email]
    );
    console.log(`Deleted ${deleteResult.rowCount} old admin(s)`);
    
    // Tạo admin mới
    console.log("\n➕ Creating new admin user...");
    const result = await pool.query(
      `INSERT INTO admin_users 
       (id, username, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, full_name, role, is_active, created_at`,
      [
        uuidv4(),
        "admin",
        email,
        hashedPassword,
        "Super Admin",
        "super_admin",
        true
      ]
    );

    console.log("\n✅ SUCCESS! Admin user created:");
    console.log("=" .repeat(60));
    console.log("ID:", result.rows[0].id);
    console.log("Username:", result.rows[0].username);
    console.log("Email:", result.rows[0].email);
    console.log("Full Name:", result.rows[0].full_name);
    console.log("Role:", result.rows[0].role);
    console.log("Active:", result.rows[0].is_active);
    console.log("Created:", result.rows[0].created_at);
    console.log("=" .repeat(60));
    console.log("\n🔑 Login Credentials:");
    console.log("   Email:", email);
    console.log("   Password:", password);
    console.log("=" .repeat(60));
    
    // Test password
    console.log("\n🧪 Testing password...");
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log(isValid ? "✅ Password test PASSED" : "❌ Password test FAILED");
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    if (error.code) {
      console.error("Error Code:", error.code);
    }
    if (error.detail) {
      console.error("Detail:", error.detail);
    }
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

console.log("🚀 Starting admin creation script...\n");
createAdmin();