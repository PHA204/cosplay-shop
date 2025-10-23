import pg from "pg";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "cosplay_shop",
});

const categories = [
  { id: "550e8400-e29b-41d4-a716-446655440011", name: "Anime" },
  { id: "550e8400-e29b-41d4-a716-446655440012", name: "Game" },
  { id: "550e8400-e29b-41d4-a716-446655440013", name: "Movie" },
  { id: "550e8400-e29b-41d4-a716-446655440014", name: "Phụ kiện" },
];

const products = [
  {
    id: uuidv4(),
    name: "Naruto Uzumaki Costume",
    price: 450000,
    description: "Bộ trang phục Naruto Uzumaki hoàn chỉnh với áo, quần, đai và băng trán",
    category_id: "550e8400-e29b-41d4-a716-446655440011",
    images: [
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2023_11_22_638362929279006187_game-naruto_.jpg",
      "https://i.pinimg.com/736x/07/0c/5f/070c5f4ba62e36d97c4055c5e8f2d20a.jpg"
    ],
    character_name: "Naruto Uzumaki",
  },
  {
    id: uuidv4(),
    name: "Gojo Satoru Costume",
    price: 580000,
    description: "Bộ trang phục Gojo Satoru từ Jujutsu Kaisen với áo, quần và băng che mắt",
    category_id: "550e8400-e29b-41d4-a716-446655440011",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lsc87gqglujt71",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lsc87gqglp4dbd"
    ],
    character_name: "Gojo Satoru",
  },
  {
    id: uuidv4(),
    name: "Tanjiro Kamado Costume",
    price: 520000,
    description: "Bộ trang phục Tanjiro từ Demon Slayer với áo haori, quần và kiếm",
    category_id: "550e8400-e29b-41d4-a716-446655440011",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lqvyl87fqv0f4d",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lqvyl87fse4va3"
    ],
    character_name: "Tanjiro Kamado",
  },
  {
    id: uuidv4(),
    name: "Nezuko Kamado Costume",
    price: 550000,
    description: "Bộ trang phục Nezuko từ Demon Slayer với kimono hồng và tre tre",
    category_id: "550e8400-e29b-41d4-a716-446655440011",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lpfxol8w5kh571",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lpfxol8w6yxx93"
    ],
    character_name: "Nezuko Kamado",
  },
  {
    id: uuidv4(),
    name: "Mikasa Ackerman Costume",
    price: 600000,
    description: "Bộ trang phục Mikasa từ Attack on Titan với đồng phục và dây đai",
    category_id: "550e8400-e29b-41d4-a716-446655440011",
    images: [
      "https://down-vn.img.susercontent.com/file/sg-11134201-22120-x37nclpd86kv0b",
      "https://down-vn.img.susercontent.com/file/sg-11134201-22120-5v2k57pd86kve0"
    ],
    character_name: "Mikasa Ackerman",
  },
  {
    id: uuidv4(),
    name: "Lara Croft Costume",
    price: 680000,
    description: "Bộ trang phục Lara Croft từ Tomb Raider với áo, quần và phụ kiện",
    category_id: "550e8400-e29b-41d4-a716-446655440012",
    images: [
      "https://i.etsystatic.com/23241093/r/il/0c3ef5/3809548934/il_1588xN.3809548934_m6rx.jpg",
      "https://i.etsystatic.com/23241093/r/il/0d4d0f/3809548950/il_1588xN.3809548950_2pzl.jpg"
    ],
    character_name: "Lara Croft",
  },
  {
    id: uuidv4(),
    name: "2B Costume - NieR Automata",
    price: 750000,
    description: "Bộ trang phục 2B từ NieR: Automata với đầm đen, mắt bịt và phụ kiện",
    category_id: "550e8400-e29b-41d4-a716-446655440012",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lqe8rw6z8qkx5a",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lqe8rw6za54de1"
    ],
    character_name: "2B",
  },
  {
    id: uuidv4(),
    name: "Wonder Woman Costume",
    price: 650000,
    description: "Bộ trang phục Wonder Woman từ DC Comics với áo giáp, váy và vương miện",
    category_id: "550e8400-e29b-41d4-a716-446655440013",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lkz4r2xn3r0h39",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lkz4r2xn55kx6e"
    ],
    character_name: "Wonder Woman",
  },
  {
    id: uuidv4(),
    name: "Spider-Man Suit",
    price: 720000,
    description: "Bộ trang phục Spider-Man với chất liệu co giãn và chi tiết 3D",
    category_id: "550e8400-e29b-41d4-a716-446655440013",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lxc3lnz8qcp572",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lxc3lnz8r0vl2e"
    ],
    character_name: "Spider-Man",
  },
  {
    id: uuidv4(),
    name: "Cosplay Wig - Black Long",
    price: 150000,
    description: "Tóc giả cosplay dài màu đen chất lượng cao, có thể tạo kiểu",
    category_id: "550e8400-e29b-41d4-a716-446655440014",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lrxqd8kxcgq1dc",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lrxqd8kxdvad72"
    ],
    character_name: "Generic",
  },
  {
    id: uuidv4(),
    name: "LED Light Sword",
    price: 180000,
    description: "Kiếm LED phát sáng đa màu cho cosplay, pin sạc được",
    category_id: "550e8400-e29b-41d4-a716-446655440014",
    images: [
      "https://down-vn.img.susercontent.com/file/sg-11134201-7rdxk-lzqnfxdkw0nm8b",
      "https://down-vn.img.susercontent.com/file/sg-11134201-7rdxk-lzqnfxdkxfdd1c"
    ],
    character_name: "Generic",
  },
  {
    id: uuidv4(),
    name: "Contact Lenses - Red Sharingan",
    price: 120000,
    description: "Kính áp tròng màu đỏ họa tiết Sharingan từ Naruto",
    category_id: "550e8400-e29b-41d4-a716-446655440014",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lxqkk3nnzjix9d",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lxqkk3no0xz982"
    ],
    character_name: "Naruto Series",
  },
];

async function seedData() {
  const client = await pool.connect();
  try {
    console.log("🌱 Bắt đầu seed dữ liệu...\n");

    // Insert categories
    console.log("📁 Thêm categories...");
    for (const cat of categories) {
      await client.query(
        "INSERT INTO category (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
        [cat.id, cat.name]
      );
    }
    console.log("✅ Đã thêm categories\n");

    // Clear cart items first (to avoid foreign key constraint)
    console.log("🗑️  Xóa giỏ hàng...");
    await client.query("DELETE FROM cart");
    console.log("✅ Đã xóa giỏ hàng\n");

    // Clear wishlist items
    console.log("🗑️  Xóa wishlist...");
    await client.query("DELETE FROM wishlist");
    console.log("✅ Đã xóa wishlist\n");

    // Clear reviews
    console.log("🗑️  Xóa reviews...");
    await client.query("DELETE FROM reviews");
    console.log("✅ Đã xóa reviews\n");

    // Clear order details first
    console.log("🗑️  Xóa order details...");
    await client.query("DELETE FROM order_detail");
    console.log("✅ Đã xóa order details\n");

    // Clear product variants
    console.log("🗑️  Xóa product variants...");
    await client.query("DELETE FROM product_variants");
    console.log("✅ Đã xóa product variants\n");

    // Clear existing products
    console.log("🗑️  Xóa sản phẩm cũ...");
    await client.query("DELETE FROM product");
    console.log("✅ Đã xóa sản phẩm cũ\n");

    // Insert products
    console.log("📦 Thêm sản phẩm mới...");
    for (const product of products) {
      await client.query(
        `INSERT INTO product (id, name, price, description, category_id, images, character_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          product.id,
          product.name,
          product.price,
          product.description,
          product.category_id,
          product.images,
          product.character_name,
        ]
      );
      console.log(`  ✓ ${product.name}`);
    }

    console.log("\n🎉 Seed dữ liệu thành công!");
    console.log(`📊 Tổng: ${products.length} sản phẩm`);
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedData();