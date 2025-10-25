// src/controllers/wishlistController.js - UPDATED FOR RENTAL SYSTEM
import { v4 as uuidv4 } from "uuid"
import pool from "../config/database.js"

// ✅ Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    console.log('📋 Getting wishlist for user:', req.user.id);
    
    const result = await pool.query(
      `SELECT 
        w.id, 
        p.id AS product_id, 
        p.name, 
        p.character_name,
        p.daily_price, 
        p.weekly_price,
        p.deposit_amount,
        p.images,
        p.size,
        p.condition,
        p.total_quantity,
        p.available_quantity,
        p.description,
        p.category_id
       FROM wishlist w
       JOIN product p ON w.product_id = p.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    console.log('✅ Found', result.rows.length, 'wishlist items');

    // Format response để Flutter dễ parse
    const formattedItems = result.rows.map(item => ({
      id: item.id,
      product: {
        id: item.product_id,
        name: item.name,
        character_name: item.character_name,
        daily_price: parseFloat(item.daily_price),
        weekly_price: item.weekly_price ? parseFloat(item.weekly_price) : null,
        deposit_amount: parseFloat(item.deposit_amount || 0),
        images: item.images,
        size: item.size,
        condition: item.condition,
        total_quantity: item.total_quantity,
        available_quantity: item.available_quantity,
        description: item.description,
        category_id: item.category_id
      }
    }));

    console.log('📤 Sending formatted items:', JSON.stringify(formattedItems, null, 2));
    res.json(formattedItems);
  } catch (error) {
    console.error('❌ Error getting wishlist:', error);
    res.status(500).json({ error: error.message });
  }
}

// ✅ Add product to wishlist
export const addToWishlist = async (req, res) => {
  const { product_id } = req.body

  if (!product_id) {
    return res.status(400).json({ error: "Product ID is required" })
  }

  // Kiểm tra sản phẩm tồn tại
  const productCheck = await pool.query(
    "SELECT id FROM product WHERE id = $1",
    [product_id]
  );

  if (productCheck.rows.length === 0) {
    return res.status(404).json({ error: "Product not found" });
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