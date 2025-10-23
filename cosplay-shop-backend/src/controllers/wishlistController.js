import { v4 as uuidv4 } from "uuid"
import pool from "../config/database.js"

// ✅ Get user's wishlist
export const getWishlist = async (req, res) => {
  const result = await pool.query(
    `SELECT w.id, p.id AS product_id, p.name, p.price, p.images, p.character_name
     FROM wishlist w
     JOIN product p ON w.product_id = p.id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [req.user.id]
  )

  res.json(result.rows)
}

// ✅ Add product to wishlist
export const addToWishlist = async (req, res) => {
  const { product_id } = req.body

  if (!product_id) {
    return res.status(400).json({ error: "Product ID is required" })
  }

  try {
    const result = await pool.query(
      `INSERT INTO wishlist (id, user_id, product_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [uuidv4(), req.user.id, product_id]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Product already in wishlist" })
    }
    throw error
  }
}

// ✅ Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
  const { product_id } = req.params

  const result = await pool.query(
    "DELETE FROM wishlist WHERE product_id = $1 AND user_id = $2 RETURNING *",
    [product_id, req.user.id]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Item not in wishlist" })
  }

  res.json({ message: "Item removed from wishlist" })
}
