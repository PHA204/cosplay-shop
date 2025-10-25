import { v4 as uuidv4 } from "uuid"
import pool from "../config/database.js"

// ✅ Get reviews for a product
export const getProductReviews = async (req, res) => {
  const { product_id } = req.params
  const { page = 1, limit = 10 } = req.query
  const offset = (page - 1) * limit

  const result = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.images, r.time, u.name, u.avatar_url
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.product_id = $1
     ORDER BY r.time DESC
     LIMIT $2 OFFSET $3`,
    [product_id, limit, offset]
  )

  const countResult = await pool.query("SELECT COUNT(*) FROM reviews WHERE product_id = $1", [product_id])

  res.json({
    data: result.rows,
    total: Number.parseInt(countResult.rows[0].count),
    page: Number.parseInt(page),
    limit: Number.parseInt(limit),
  })
}

// ✅ Create new review
export const createReview = async (req, res) => {
  const { product_id, rating, comment, images = [] } = req.body

  if (!product_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Product ID and rating (1-5) are required" })
  }

  const reviewId = uuidv4()

  const result = await pool.query(
    `INSERT INTO reviews (id, user_id, product_id, rating, comment, images)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [reviewId, req.user.id, product_id, rating, comment || null, images]
  )

  res.status(201).json(result.rows[0])
}

// ✅ Update review
export const updateReview = async (req, res) => {
  const { id } = req.params
  const { rating, comment, images } = req.body

  const result = await pool.query(
    `UPDATE reviews
     SET rating = COALESCE($1, rating),
         comment = COALESCE($2, comment),
         images = COALESCE($3, images)
     WHERE id = $4 AND user_id = $5
     RETURNING *`,
    [rating, comment, images, id, req.user.id]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Review not found" })
  }

  res.json(result.rows[0])
}

// ✅ Delete review
export const deleteReview = async (req, res) => {
  const { id } = req.params

  const result = await pool.query(
    "DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *",
    [id, req.user.id]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Review not found" })
  }

  res.json({ message: "Review deleted" })
}
