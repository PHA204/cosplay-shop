import pg from "pg";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const categories = [
  { id: "550e8400-e29b-41d4-a716-446655440011", name: "Anime", description: "Trang phục anime và manga" },
  { id: "550e8400-e29b-41d4-a716-446655440012", name: "Game", description: "Trang phục từ game" },
  { id: "550e8400-e29b-41d4-a716-446655440013", name: "Movie", description: "Trang phục từ phim" },
  { id: "550e8400-e29b-41d4-a716-446655440014", name: "Phụ kiện", description: "Phụ kiện cosplay" },
];

const products = [
  // ANIME COSTUMES
  {
    id: uuidv4(),
    name: "Naruto Uzumaki Costume",
    daily_price: 150000,
    weekly_price: 900000,
    deposit_amount: 300000,
    description: "Bộ trang phục Naruto Uzumaki hoàn chỉnh với áo, quần, đai và băng trán. Chất liệu cotton cao cấp, thoáng mát.",
    category_id: "550e8400-e29b-41d4-a716-446655440011",
    images: [
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2023_11_22_638362929279006187_game-naruto_.jpg",
      "https://i.pinimg.com/736x/07/0c/5f/070c5f4ba62e36d97c4055c5e8f2d20a.jpg"
    ],
    character_name: "Naruto Uzumaki",
    size: "M",
    condition: "good",
    total_quantity: 3,
    available_quantity: 3,
  },
  {
    id: uuidv4(),
    name: "Gojo Satoru Costume",
    daily_price: 200000,
    weekly_price: 1200000,
    deposit_amount: 400000,
    description: "Bộ trang phục Gojo Satoru từ Jujutsu Kaisen với áo, quần và băng che mắt. Thiết kế chi tiết, sang trọng.",
    category_id: "550e8400-e29b-41d4-a716-446655440011",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lsc87gqglujt71",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lsc87gqglp4dbd"
    ],
    character_name: "Gojo Satoru",
    size: "L",
    condition: "new",
    total_quantity: 2,
    available_quantity: 2,
  },
  {
    id: uuidv4(),
    name: "Tanjiro Kamado Costume",
    daily_price: 180000,
    weekly_price: 1080000,
    deposit_amount: 350000,
    description: "Bộ trang phục Tanjiro từ Demon Slayer với áo haori, quần và kiếm gỗ. Họa tiết kimono truyền thống.",
    category_id: "550e8400-e29b-41d4-a716-446655440011",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lqvyl87fqv0f4d",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lqvyl87fse4va3"
    ],
    character_name: "Tanjiro Kamado",
    size: "M",
    condition: "good",
    total_quantity: 4,
    available_quantity: 4,
  },
  {
    id: uuidv4(),
    name: "Nezuko Kamado Costume",
    daily_price: 190000,
    weekly_price: 1140000,
    deposit_amount: 380000,
    description: "Bộ trang phục Nezuko từ Demon Slayer với kimono hồng và tre tre. Bao gồm cả tóc giả.",
    category_id: "550e8400-e29b-41d4-a716-446655440011",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lpfxol8w5kh571",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lpfxol8w6yxx93"
    ],
    character_name: "Nezuko Kamado",
    size: "S",
    condition: "good",
    total_quantity: 3,
    available_quantity: 3,
  },
  {
    id: uuidv4(),
    name: "Mikasa Ackerman Costume",
    daily_price: 210000,
    weekly_price: 1260000,
    deposit_amount: 420000,
    description: "Bộ trang phục Mikasa từ Attack on Titan với đồng phục và dây đai ODM gear. Chất liệu bền chắc.",
    category_id: "550e8400-e29b-41d4-a716-446655440011",
    images: [
      "https://down-vn.img.susercontent.com/file/sg-11134201-22120-x37nclpd86kv0b",
      "https://down-vn.img.susercontent.com/file/sg-11134201-22120-5v2k57pd86kve0"
    ],
    character_name: "Mikasa Ackerman",
    size: "M",
    condition: "good",
    total_quantity: 2,
    available_quantity: 2,
  },
  {
    id: uuidv4(),
    name: "Sailor Moon Costume",
    daily_price: 170000,
    weekly_price: 1020000,
    deposit_amount: 340000,
    description: "Bộ trang phục Sailor Moon cổ điển với váy xanh trắng, nơ đỏ và phụ kiện. Phù hợp cho sự kiện.",
    category_id: "550e8400-e29b-41d4-a716-446655440011",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lpm9e3xqz8ol5e",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lpm9e3xr0n8191"
    ],
    character_name: "Sailor Moon",
    size: "M",
    condition: "good",
    total_quantity: 3,
    available_quantity: 3,
  },

  // GAME COSTUMES
  {
    id: uuidv4(),
    name: "Lara Croft Costume",
    daily_price: 220000,
    weekly_price: 1320000,
    deposit_amount: 440000,
    description: "Bộ trang phục Lara Croft từ Tomb Raider với áo tank top, quần short và phụ kiện. Phong cách mạo hiểm.",
    category_id: "550e8400-e29b-41d4-a716-446655440012",
    images: [
      "https://i.etsystatic.com/23241093/r/il/0c3ef5/3809548934/il_1588xN.3809548934_m6rx.jpg",
      "https://i.etsystatic.com/23241093/r/il/0d4d0f/3809548950/il_1588xN.3809548950_2pzl.jpg"
    ],
    character_name: "Lara Croft",
    size: "M",
    condition: "good",
    total_quantity: 2,
    available_quantity: 2,
  },
  {
    id: uuidv4(),
    name: "2B Costume - NieR Automata",
    daily_price: 250000,
    weekly_price: 1500000,
    deposit_amount: 500000,
    description: "Bộ trang phục 2B từ NieR: Automata với đầm đen, mắt bịt và phụ kiện. Thiết kế cao cấp, chi tiết tỉ mỉ.",
    category_id: "550e8400-e29b-41d4-a716-446655440012",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lqe8rw6z8qkx5a",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lqe8rw6za54de1"
    ],
    character_name: "2B",
    size: "S",
    condition: "new",
    total_quantity: 2,
    available_quantity: 2,
  },
  {
    id: uuidv4(),
    name: "Geralt of Rivia Costume",
    daily_price: 280000,
    weekly_price: 1680000,
    deposit_amount: 560000,
    description: "Bộ trang phục Geralt từ The Witcher với áo giáp da, quần và kiếm thép. Phong cách medieval.",
    category_id: "550e8400-e29b-41d4-a716-446655440012",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lre3xqw9z3xx42",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lre3xqwa0ihd6f"
    ],
    character_name: "Geralt",
    size: "L",
    condition: "good",
    total_quantity: 1,
    available_quantity: 1,
  },

  // MOVIE COSTUMES
  {
    id: uuidv4(),
    name: "Wonder Woman Costume",
    daily_price: 230000,
    weekly_price: 1380000,
    deposit_amount: 460000,
    description: "Bộ trang phục Wonder Woman từ DC Comics với áo giáp, váy và vương miện. Thiết kế iconic.",
    category_id: "550e8400-e29b-41d4-a716-446655440013",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lkz4r2xn3r0h39",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lkz4r2xn55kx6e"
    ],
    character_name: "Wonder Woman",
    size: "M",
    condition: "good",
    total_quantity: 2,
    available_quantity: 2,
  },
  {
    id: uuidv4(),
    name: "Spider-Man Suit",
    daily_price: 240000,
    weekly_price: 1440000,
    deposit_amount: 480000,
    description: "Bộ trang phục Spider-Man với chất liệu co giãn và chi tiết 3D. Thoải mái khi di chuyển.",
    category_id: "550e8400-e29b-41d4-a716-446655440013",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lxc3lnz8qcp572",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lxc3lnz8r0vl2e"
    ],
    character_name: "Spider-Man",
    size: "L",
    condition: "good",
    total_quantity: 3,
    available_quantity: 3,
  },
  {
    id: uuidv4(),
    name: "Black Panther Costume",
    daily_price: 260000,
    weekly_price: 1560000,
    deposit_amount: 520000,
    description: "Bộ trang phục Black Panther từ Marvel với bộ suit đen và mặt nạ. Thiết kế futuristic.",
    category_id: "550e8400-e29b-41d4-a716-446655440013",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lmx9w3z5y7xx4d",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lmx9w3z5zmddb2"
    ],
    character_name: "Black Panther",
    size: "L",
    condition: "new",
    total_quantity: 2,
    available_quantity: 2,
  },
  {
    id: uuidv4(),
    name: "Harley Quinn Costume",
    daily_price: 190000,
    weekly_price: 1140000,
    deposit_amount: 380000,
    description: "Bộ trang phục Harley Quinn phiên bản Birds of Prey với áo, quần và phụ kiện đầy màu sắc.",
    category_id: "550e8400-e29b-41d4-a716-446655440013",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lnx4w2z8y6xx39",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lnx4w2z8zlmda1"
    ],
    character_name: "Harley Quinn",
    size: "S",
    condition: "good",
    total_quantity: 3,
    available_quantity: 3,
  },

  // PHỤ KIỆN
  {
    id: uuidv4(),
    name: "Cosplay Wig - Black Long",
    daily_price: 50000,
    weekly_price: 300000,
    deposit_amount: 100000,
    description: "Tóc giả cosplay dài màu đen chất lượng cao, có thể tạo kiểu. Phù hợp nhiều nhân vật.",
    category_id: "550e8400-e29b-41d4-a716-446655440014",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lrxqd8kxcgq1dc",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lrxqd8kxdvad72"
    ],
    character_name: "Generic",
    size: "Free Size",
    condition: "good",
    total_quantity: 10,
    available_quantity: 10,
  },
  {
    id: uuidv4(),
    name: "Cosplay Wig - Blonde Short",
    daily_price: 50000,
    weekly_price: 300000,
    deposit_amount: 100000,
    description: "Tóc giả cosplay ngắn màu vàng. Phù hợp cho nhân vật anime như Naruto, Cloud.",
    category_id: "550e8400-e29b-41d4-a716-446655440014",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lsx4d8wx9zxx42",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lsx4d8wxbedd8a"
    ],
    character_name: "Generic",
    size: "Free Size",
    condition: "good",
    total_quantity: 8,
    available_quantity: 8,
  },
  {
    id: uuidv4(),
    name: "LED Light Sword - Blue",
    daily_price: 60000,
    weekly_price: 360000,
    deposit_amount: 120000,
    description: "Kiếm LED phát sáng màu xanh cho cosplay, pin sạc được. Hiệu ứng ánh sáng chuyên nghiệp.",
    category_id: "550e8400-e29b-41d4-a716-446655440014",
    images: [
      "https://down-vn.img.susercontent.com/file/sg-11134201-7rdxk-lzqnfxdkw0nm8b",
      "https://down-vn.img.susercontent.com/file/sg-11134201-7rdxk-lzqnfxdkxfdd1c"
    ],
    character_name: "Generic",
    size: "Free Size",
    condition: "good",
    total_quantity: 5,
    available_quantity: 5,
  },
  {
    id: uuidv4(),
    name: "Contact Lenses - Red Sharingan",
    daily_price: 40000,
    weekly_price: 240000,
    deposit_amount: 80000,
    description: "Kính áp tròng màu đỏ họa tiết Sharingan từ Naruto. Sử dụng an toàn, có hộp đựng.",
    category_id: "550e8400-e29b-41d4-a716-446655440014",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lxqkk3nnzjix9d",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lxqkk3no0xz982"
    ],
    character_name: "Naruto Series",
    size: "Free Size",
    condition: "new",
    total_quantity: 15,
    available_quantity: 15,
  },
  {
    id: uuidv4(),
    name: "Ninja Weapon Set",
    daily_price: 80000,
    weekly_price: 480000,
    deposit_amount: 160000,
    description: "Bộ vũ khí ninja giả bao gồm kunai, shuriken. Chất liệu nhựa an toàn.",
    category_id: "550e8400-e29b-41d4-a716-446655440014",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lmx8w2z7x6xx38",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lmx8w2z7ylmdc9"
    ],
    character_name: "Generic",
    size: "Free Size",
    condition: "good",
    total_quantity: 6,
    available_quantity: 6,
  },
  {
    id: uuidv4(),
    name: "Cat Ears Headband",
    daily_price: 30000,
    weekly_price: 180000,
    deposit_amount: 60000,
    description: "Băng đô tai mèo cosplay nhiều màu. Dễ thương và phù hợp nhiều trang phục.",
    category_id: "550e8400-e29b-41d4-a716-446655440014",
    images: [
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lpx4w3z8y5xx37",
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lpx4w3z8zjmd80"
    ],
    character_name: "Generic",
    size: "Free Size",
    condition: "good",
    total_quantity: 20,
    available_quantity: 20,
  },
];

async function seedData() {
  const client = await pool.connect();
  try {
    console.log("🌱 Bắt đầu seed dữ liệu cho hệ thống cho thuê...\n");

    // Insert categories
    console.log("📂 Thêm categories...");
    for (const cat of categories) {
      await client.query(
        "INSERT INTO category (id, name, description) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $2, description = $3",
        [cat.id, cat.name, cat.description]
      );
    }
    console.log("✅ Đã thêm categories\n");

    // Clear dependent tables first
    console.log("🗑️  Xóa dữ liệu cũ...");
    await client.query("DELETE FROM rental_history");
    await client.query("DELETE FROM rental_order_detail");
    await client.query("DELETE FROM rental_order");
    await client.query("DELETE FROM reviews");
    await client.query("DELETE FROM wishlist");
    await client.query("DELETE FROM cart");
    await client.query("DELETE FROM product");
    console.log("✅ Đã xóa dữ liệu cũ\n");

    // Insert products
    console.log("📦 Thêm sản phẩm mới...");
    for (const product of products) {
      await client.query(
        `INSERT INTO product (
          id, name, daily_price, weekly_price, deposit_amount, 
          description, category_id, images, character_name, 
          size, condition, total_quantity, available_quantity
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          product.id,
          product.name,
          product.daily_price,
          product.weekly_price,
          product.deposit_amount,
          product.description,
          product.category_id,
          product.images,
          product.character_name,
          product.size,
          product.condition,
          product.total_quantity,
          product.available_quantity,
        ]
      );
      console.log(`  ✓ ${product.name} - ${product.daily_price.toLocaleString('vi-VN')}đ/ngày`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 SEED DỮ LIỆU THÀNH CÔNG!");
    console.log("=".repeat(60));
    console.log(`\n📊 Thống kê:`);
    console.log(`  - Categories: ${categories.length}`);
    console.log(`  - Sản phẩm: ${products.length}`);
    console.log(`  - Tổng số lượng tồn kho: ${products.reduce((sum, p) => sum + p.total_quantity, 0)}`);
    console.log(`\n💰 Giá thuê:`);
    console.log(`  - Thấp nhất: ${Math.min(...products.map(p => p.daily_price)).toLocaleString('vi-VN')}đ/ngày`);
    console.log(`  - Cao nhất: ${Math.max(...products.map(p => p.daily_price)).toLocaleString('vi-VN')}đ/ngày`);
    console.log(`  - Trung bình: ${Math.round(products.reduce((sum, p) => sum + p.daily_price, 0) / products.length).toLocaleString('vi-VN')}đ/ngày`);
    
  } catch (error) {
    console.error("\n❌ Lỗi:", error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

seedData();