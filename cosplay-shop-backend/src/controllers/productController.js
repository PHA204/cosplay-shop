import pool from "../config/database.js";

// 🧠 Lấy danh sách sản phẩm (có lọc, tìm kiếm, phân trang)
export const getAllProducts = async (req, res) => {
  const { category_id, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = "SELECT * FROM product WHERE 1=1";
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
    data: result.rows,
    total: Number.parseInt(countResult.rows[0].count),
    page: Number.parseInt(page),
    limit: Number.parseInt(limit),
  });
};

// 🧠 Lấy chi tiết sản phẩm theo ID
export const getProductById = async (req, res) => {
  const { id } = req.params;

  const productResult = await pool.query("SELECT * FROM product WHERE id = $1", [id]);

  if (productResult.rows.length === 0) {
    return res.status(404).json({ error: "Product not found" });
  }

  const variantsResult = await pool.query("SELECT * FROM product_variants WHERE product_id = $1", [id]);

  res.json({
    ...productResult.rows[0],
    variants: variantsResult.rows,
  });
};

// 🧠 Lấy danh sách tất cả danh mục
export const getAllCategories = async (req, res) => {
  const result = await pool.query("SELECT * FROM category ORDER BY name");
  res.json(result.rows);
};
