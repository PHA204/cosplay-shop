// src/controllers/productController.js - UPDATED FOR RENTAL SYSTEM
import pool from "../config/database.js";

// 🧠 Lấy danh sách sản phẩm (có lọc, tìm kiếm, phân trang, sắp xếp)
export const getAllProducts = async (req, res) => {
  const { category_id, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `SELECT 
    id, name, character_name, 
    daily_price, weekly_price, deposit_amount,
    images, size, condition, 
    total_quantity, available_quantity,
    description, category_id, created_at
  FROM product WHERE 1=1`;
  const params = [];
 
  if (category_id) {
    query += " AND category_id = $" + (params.length + 1);
    params.push(category_id);
  }

  if (search) {
    query +=
      " AND (name ILIKE $" +
      (params.length + 1) +
      " OR character_name ILIKE $" +
      (params.length + 1) +
      ")";
    params.push(`%${search}%`);
  }

  query +=
    " ORDER BY created_at DESC LIMIT $" +
    (params.length + 1) +
    " OFFSET $" +
    (params.length + 2);
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Format giá trị
  const formattedProducts = result.rows.map(p => ({
    ...p,
    daily_price: parseFloat(p.daily_price),
    weekly_price: p.weekly_price ? parseFloat(p.weekly_price) : null,
    deposit_amount: parseFloat(p.deposit_amount || 0)
  }));

  // Tổng số dòng
  const countResult = await pool.query(
    "SELECT COUNT(*) FROM product WHERE 1=1" +
      (category_id ? " AND category_id = $1" : "") +
      (search
        ? " AND (name ILIKE $" +
          (category_id ? 2 : 1) +
          " OR character_name ILIKE $" +
          (category_id ? 2 : 1) +
          ")"
        : ""),
    category_id && search
      ? [category_id, `%${search}%`]
      : category_id
      ? [category_id]
      : search
      ? [`%${search}%`]
      : []
  );

  res.json({
    data: formattedProducts,
    total: Number.parseInt(countResult.rows[0].count),
    page: Number.parseInt(page),
    limit: Number.parseInt(limit),
  });
};

// 🧠 Lấy chi tiết sản phẩm theo ID
export const getProductById = async (req, res) => {
  const { id } = req.params;

  const productResult = await pool.query(
    `SELECT 
      id, name, character_name, 
      daily_price, weekly_price, deposit_amount,
      images, size, condition, 
      total_quantity, available_quantity,
      description, category_id, created_at, updated_at
    FROM product WHERE id = $1`, 
    [id]
  );

  if (productResult.rows.length === 0) {
    return res.status(404).json({ error: "Product not found" });
  }

  const product = productResult.rows[0];
  
  // Format giá trị
  const formattedProduct = {
    ...product,
    daily_price: parseFloat(product.daily_price),
    weekly_price: product.weekly_price ? parseFloat(product.weekly_price) : null,
    deposit_amount: parseFloat(product.deposit_amount || 0)
  };

  // Không cần variants vì đã có size trong product
  res.json(formattedProduct);
};

// 🧠 Lấy danh sách tất cả danh mục
export const getAllCategories = async (req, res) => {
  const result = await pool.query("SELECT * FROM category ORDER BY name");
  res.json(result.rows);
};

// src/controllers/productController.js
export const checkProductAvailability = async (req, res) => {
  const { id } = req.params;
  const { start_date, end_date, quantity = 1 } = req.query;
  
  const result = await pool.query(
    `SELECT check_product_availability($1, $2, $3, $4) as available`,
    [id, parseInt(quantity), start_date, end_date]
  );
  
  res.json({ 
    available: result.rows[0].available,
    product_id: id,
    requested_quantity: parseInt(quantity)
  });
};