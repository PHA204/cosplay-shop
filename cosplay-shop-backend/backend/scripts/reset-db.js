import pg from "pg"
import dotenv from "dotenv"

dotenv.config()

const { Client } = pg

// Lấy thông tin kết nối từ DATABASE_URL
const connectionString = process.env.DATABASE_URL
const dbName = "cosplay_shop"

// Parse connection string để lấy thông tin server
const url = new URL(connectionString)
const serverConnectionString = `postgresql://${url.username}:${url.password}@${url.hostname}:${url.port}/postgres`

console.log("🔄 Đang reset database...\n")

const client = new Client(serverConnectionString)

async function resetDatabase() {
  try {
    await client.connect()
    console.log("✓ Kết nối đến PostgreSQL server thành công\n")

    console.log(`Đang xóa database '${dbName}'...`)
    await client.query(`DROP DATABASE IF EXISTS ${dbName}`)
    console.log("✓ Database cũ đã xóa\n")

    console.log(`Đang tạo database '${dbName}'...`)
    await client.query(`CREATE DATABASE ${dbName}`)
    console.log("✓ Database mới đã tạo\n")

    console.log("✅ Reset database thành công!")
    console.log("Bây giờ chạy: npm run migrate\n")

    await client.end()
  } catch (error) {
    console.error("❌ Lỗi khi reset database:")
    console.error(error.message)
    process.exit(1)
  }
}

resetDatabase()
