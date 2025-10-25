// src/controllers/cartController.js - UPDATED FOR RENTAL SYSTEM
import pool from "../config/database.js";

/**
 * 🛒 Lấy danh sách sản phẩm trong giỏ hàng
 */
export const getCartItems = async (req, res) => {
  const result = await pool.query(
    `SELECT 
      c.id, 
      c.product_id, 
      c.quantity, 
      p.name, 
      p.daily_price, 
      p.deposit_amount,
      p.images, 
      p.character_name,
      p.size
     FROM cart c
     JOIN product p ON c.product_id = p.id
     WHERE c.user_id = $1
     ORDER BY c.created_at DESC`,
    [req.user.id]
  );

  // Format response để Flutter dễ parse
  const formattedItems = result.rows.map(item => ({
    id: item.id,
    product_id: item.product_id,
    quantity: item.quantity,
    name: item.name,
    daily_price: parseFloat(item.daily_price), // Giá thuê theo ngày
    deposit_amount: parseFloat(item.deposit_amount || 0), // Tiền cọc
    images: item.images,
    character_name: item.character_name,
    size: item.size
  }));

  res.json(formattedItems);
};

/**
 * ➕ Thêm sản phẩm vào giỏ hàng
 */
export const addToCart = async (req, res) => {
  const { product_id, quantity = 1 } = req.body;

  if (!product_id || quantity < 1) {
    return res.status(400).json({ error: "Invalid product_id or quantity" });
  }

  // Kiểm tra sản phẩm tồn tại
  const productCheck = await pool.query(
    "SELECT id, available_quantity FROM product WHERE id = $1",
    [product_id]
  );

  if (productCheck.rows.length === 0) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (productCheck.rows[0].available_quantity < quantity) {
    return res.status(400).json({ error: "Not enough quantity available" });
  }

  const result = await pool.query(
    `INSERT INTO cart (user_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id) DO UPDATE 
     SET quantity = cart.quantity + $3, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [req.user.id, product_id, quantity]
  );

  res.status(201).json(result.rows[0]);
};

/**
 * ✏️ Cập nhật số lượng sản phẩm trong giỏ hàng
 */
export const updateCartItem = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (quantity < 1) {
    return res.status(400).json({ error: "Quantity must be at least 1" });
  }

  const result = await pool.query(
    "UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *",
    [quantity, id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Cart item not found" });
  }

  res.json(result.rows[0]);
};

/**
 * ❌ Xóa 1 sản phẩm khỏi giỏ hàng
 */
export const removeCartItem = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    "DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING *",
    [id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Cart item not found" });
  }

  res.json({ message: "Item removed from cart" });
};

/**
 * 🧹 Xóa toàn bộ giỏ hàng của user
 */
export const clearCart = async (req, res) => {
  await pool.query("DELETE FROM cart WHERE user_id = $1", [req.user.id]);
  res.json({ message: "Cart cleared" });
};