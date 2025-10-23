import pkg from "pg"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

dotenv.config()

const { Client } = pkg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log("Kết nối đến database...")
    await client.connect()
    console.log("✓ Kết nối thành công!")

    // Đọc file SQL
    const sqlFile = path.join(__dirname, "01-init-database.sql")
    const sql = fs.readFileSync(sqlFile, "utf8")

    console.log("\nChạy migration...")
    await client.query(sql)
    console.log("✓ Migration hoàn tất thành công!")

    console.log("\nCác bảng đã được tạo:")
    console.log("  - users")
    console.log("  - categories")
    console.log("  - products")
    console.log("  - product_variants")
    console.log("  - cart")
    console.log("  - orders")
    console.log("  - order_details")
    console.log("  - reviews")
    console.log("  - wishlist")
  } catch (error) {
    console.error("❌ Lỗi migration:", error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
