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
    console.log("🔌 Kết nối đến database...")
    await client.connect()
    console.log("✓ Kết nối thành công!\n")

    console.log("⚠️  CẢNH BÁO: Migration này sẽ tạo/cập nhật schema cho rental system")
    console.log("   Đảm bảo bạn đã backup database trước khi tiếp tục!\n")

    const sqlFile = path.join(__dirname, "01-init-rental-database.sql")
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`Không tìm thấy file SQL: ${sqlFile}`)
    }
    
    const sql = fs.readFileSync(sqlFile, "utf8")

    console.log("🚀 Bắt đầu chạy migration...")
    console.log("=" .repeat(50))

    // Chạy toàn bộ SQL file cùng lúc thay vì split
    // PostgreSQL có thể handle multiple statements trong 1 query
    try {
      await client.query(sql)
      console.log("  ✓ Đã thực thi toàn bộ SQL script")
    } catch (error) {
      console.error(`  ✗ Lỗi: ${error.message}`)
      throw error
    }

    console.log("=" .repeat(50))
    console.log(`\n✓ Migration hoàn tất!`)

    // Verify tables đã được tạo
    console.log("\n📊 Kiểm tra các bảng đã tạo...")
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    console.log("\n✅ Các bảng trong database:")
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })

    // Kiểm tra functions
    console.log("\n📋 Các functions đã tạo:")
    const funcResult = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `)
    
    funcResult.rows.forEach(row => {
      console.log(`  - ${row.routine_name}()`)
    })

    // Kiểm tra triggers
    console.log("\n⚙️  Các triggers đã tạo:")
    const triggerResult = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY trigger_name
    `)
    
    triggerResult.rows.forEach(row => {
      console.log(`  - ${row.trigger_name} (on ${row.event_object_table})`)
    })

    console.log("\n" + "=".repeat(50))
    console.log("🎉 MIGRATION HOÀN TẤT THÀNH CÔNG!")
    console.log("=".repeat(50))
    console.log("\n📝 Tóm tắt thay đổi:")
    console.log("  ✓ Hệ thống đã chuyển từ BÁN HÀNG sang CHO THUÊ")
    console.log("  ✓ Bảng rental_order thay thế bảng order")
    console.log("  ✓ Bảng rental_order_detail thay thế order_detail")
    console.log("  ✓ Product có thêm daily_price và deposit_amount")
    console.log("  ✓ Tự động quản lý tồn kho theo thời gian thuê")
    console.log("\n🚀 Tiếp theo:")
    console.log("  1. Update backend controllers (rentalOrderController.js)")
    console.log("  2. Update routes (rentals.js)")
    console.log("  3. Update Flutter models & services")
    console.log("  4. Test API endpoints")

  } catch (error) {
    console.error("\n❌ LỖI MIGRATION:")
    console.error("  Message:", error.message)
    console.error("  Stack:", error.stack)
    console.log("\n💡 Gợi ý:")
    console.log("  - Kiểm tra DATABASE_URL trong .env")
    console.log("  - Đảm bảo PostgreSQL đang chạy")
    console.log("  - Kiểm tra syntax SQL trong file")
    console.log("  - Xem chi tiết lỗi ở trên")
    process.exit(1)
  } finally {
    await client.end()
    console.log("\n🔌 Đã ngắt kết nối database\n")
  }
}

// Chạy migration
runMigration()