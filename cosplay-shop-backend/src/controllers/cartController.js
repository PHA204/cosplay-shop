// src/controllers/cartController.js
import pool from "../config/database.js";

/**
 * 🛒 Lấy danh sách sản phẩm trong giỏ hàng
 */
export const getCartItems = async (req, res) => {
  const result = await pool.query(
    `SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.images, pv.size, pv.color
     FROM cart c
     JOIN product p ON c.product_id = p.id
     LEFT JOIN product_variants pv ON c.product_id = pv.product_id
     WHERE c.user_id = $1
     ORDER BY c.created_at DESC`,
    [req.user.id]
  );

  res.json(result.rows);
};

/**
 * ➕ Thêm sản phẩm vào giỏ hàng
 */
export const addToCart = async (req, res) => {
  const { product_id, quantity = 1 } = req.body;

  if (!product_id || quantity < 1) {
    return res.status(400).json({ error: "Invalid product_id or quantity" });
  }

  const result = await pool.query(
    `INSERT INTO cart (user_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id) DO UPDATE 
     SET quantity = cart.quantity + $3
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
