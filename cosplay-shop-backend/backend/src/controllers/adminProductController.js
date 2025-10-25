import { v4 as uuidv4 } from "uuid";
import pool from "../config/database.js";

// 📋 Get All Products (Admin view with more details)
export const getAdminProducts = async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    category_id, 
    condition,
    sort_by = 'created_at',
    order = 'desc'
  } = req.query;
  
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        COUNT(DISTINCT rod.rental_order_id) as total_rentals,
        COALESCE(SUM(rod.subtotal), 0) as total_revenue
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN rental_order_detail rod ON p.id = rod.product_id
      LEFT JOIN rental_order ro ON rod.rental_order_id = ro.id 
        AND ro.status NOT IN ('cancelled')
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.character_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (category_id) {
      paramCount++;
      query += ` AND p.category_id = $${paramCount}`;
      params.push(category_id);
    }

    if (condition) {
      paramCount++;
      query += ` AND p.condition = $${paramCount}`;
      params.push(condition);
    }

    query += ` GROUP BY p.id, c.name`;

    // Sorting
    const validSortFields = ['name', 'daily_price', 'created_at', 'available_quantity'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY p.${sortField} ${sortOrder}`;

    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM product p WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 0;

    if (search) {
      countParamIndex++;
      countQuery += ` AND (p.name ILIKE $${countParamIndex} OR p.character_name ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    if (category_id) {
      countParamIndex++;
      countQuery += ` AND p.category_id = $${countParamIndex}`;
      countParams.push(category_id);
    }

    if (condition) {
      countParamIndex++;
      countQuery += ` AND p.condition = $${countParamIndex}`;
      countParams.push(condition);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      data: result.rows.map(p => ({
        ...p,
        daily_price: parseFloat(p.daily_price),
        weekly_price: p.weekly_price ? parseFloat(p.weekly_price) : null,
        deposit_amount: parseFloat(p.deposit_amount || 0),
        total_rentals: parseInt(p.total_rentals),
        total_revenue: parseFloat(p.total_revenue),
      })),
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get admin products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📝 Create Product
export const createProduct = async (req, res) => {
  const {
    name,
    character_name,
    daily_price,
    weekly_price,
    deposit_amount,
    description,
    category_id,
    images = [],
    size,
    condition = 'good',
    total_quantity = 1,
    available_quantity,
  } = req.body;

  // Validation
  if (!name || !daily_price || !deposit_amount || !category_id) {
    return res.status(400).json({
      error: "Name, daily_price, deposit_amount, and category_id are required",
    });
  }

  if (daily_price <= 0) {
    return res.status(400).json({ error: "Daily price must be greater than 0" });
  }

  try {
    const productId = uuidv4();
    const availQty = available_quantity !== undefined ? available_quantity : total_quantity;

    const result = await pool.query(
      `INSERT INTO product (
        id, name, character_name, daily_price, weekly_price, deposit_amount,
        description, category_id, images, size, condition,
        total_quantity, available_quantity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        productId,
        name,
        character_name || '',
        daily_price,
        weekly_price || null,
        deposit_amount,
        description || null,
        category_id,
        images,
        size || null,
        condition,
        total_quantity,
        availQty,
      ]
    );

    res.status(201).json({
      message: "Product created successfully",
      product: {
        ...result.rows[0],
        daily_price: parseFloat(result.rows[0].daily_price),
        weekly_price: result.rows[0].weekly_price 
          ? parseFloat(result.rows[0].weekly_price) 
          : null,
        deposit_amount: parseFloat(result.rows[0].deposit_amount),
      },
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✏️ Update Product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    character_name,
    daily_price,
    weekly_price,
    deposit_amount,
    description,
    category_id,
    images,
    size,
    condition,
    total_quantity,
    available_quantity,
  } = req.body;

  try {
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }

    if (character_name !== undefined) {
      paramCount++;
      updates.push(`character_name = $${paramCount}`);
      params.push(character_name);
    }

    if (daily_price !== undefined) {
      if (daily_price <= 0) {
        return res.status(400).json({ error: "Daily price must be greater than 0" });
      }
      paramCount++;
      updates.push(`daily_price = $${paramCount}`);
      params.push(daily_price);
    }

    if (weekly_price !== undefined) {
      paramCount++;
      updates.push(`weekly_price = $${paramCount}`);
      params.push(weekly_price);
    }

    if (deposit_amount !== undefined) {
      paramCount++;
      updates.push(`deposit_amount = $${paramCount}`);
      params.push(deposit_amount);
    }

    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description);
    }

    if (category_id !== undefined) {
      paramCount++;
      updates.push(`category_id = $${paramCount}`);
      params.push(category_id);
    }

    if (images !== undefined) {
      paramCount++;
      updates.push(`images = $${paramCount}`);
      params.push(images);
    }

    if (size !== undefined) {
      paramCount++;
      updates.push(`size = $${paramCount}`);
      params.push(size);
    }

    if (condition !== undefined) {
      paramCount++;
      updates.push(`condition = $${paramCount}`);
      params.push(condition);
    }

    if (total_quantity !== undefined) {
      paramCount++;
      updates.push(`total_quantity = $${paramCount}`);
      params.push(total_quantity);
    }

    if (available_quantity !== undefined) {
      paramCount++;
      updates.push(`available_quantity = $${paramCount}`);
      params.push(available_quantity);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    paramCount++;
    params.push(id);

    const query = `
      UPDATE product 
      SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      message: "Product updated successfully",
      product: {
        ...result.rows[0],
        daily_price: parseFloat(result.rows[0].daily_price),
        weekly_price: result.rows[0].weekly_price 
          ? parseFloat(result.rows[0].weekly_price) 
          : null,
        deposit_amount: parseFloat(result.rows[0].deposit_amount),
      },
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🗑️ Delete Product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if product is in any active rental
    const rentalCheck = await pool.query(
      `SELECT COUNT(*) FROM rental_order_detail rod
       JOIN rental_order ro ON rod.rental_order_id = ro.id
       WHERE rod.product_id = $1 
         AND ro.status IN ('confirmed', 'preparing', 'delivering', 'rented')`,
      [id]
    );

    if (parseInt(rentalCheck.rows[0].count) > 0) {
      return res.status(400).json({
        error: "Cannot delete product with active rentals",
      });
    }

    const result = await pool.query(
      "DELETE FROM product WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📊 Get Product Stats
export const getProductStats = async (req, res) => {
  const { id } = req.params;

  try {
    // Get product rental history
    const historyResult = await pool.query(
      `SELECT 
        COUNT(*) as total_rentals,
        COALESCE(SUM(rod.subtotal), 0) as total_revenue,
        AVG(rod.rental_days) as avg_rental_days,
        MIN(ro.rental_start_date) as first_rental_date,
        MAX(ro.rental_end_date) as last_rental_date
       FROM rental_order_detail rod
       JOIN rental_order ro ON rod.rental_order_id = ro.id
       WHERE rod.product_id = $1
         AND ro.status NOT IN ('cancelled')`,
      [id]
    );

    // Get current rentals
    const currentRentalsResult = await pool.query(
      `SELECT 
        ro.id,
        ro.order_number,
        ro.rental_start_date,
        ro.rental_end_date,
        ro.status,
        u.name as customer_name,
        rod.quantity
       FROM rental_order_detail rod
       JOIN rental_order ro ON rod.rental_order_id = ro.id
       JOIN users u ON ro.user_id = u.id
       WHERE rod.product_id = $1
         AND ro.status IN ('confirmed', 'preparing', 'delivering', 'rented')
       ORDER BY ro.rental_start_date DESC`,
      [id]
    );

    // Get reviews
    const reviewsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating
       FROM reviews
       WHERE product_id = $1`,
      [id]
    );

    res.json({
      rentals: {
        total: parseInt(historyResult.rows[0].total_rentals),
        total_revenue: parseFloat(historyResult.rows[0].total_revenue),
        avg_rental_days: parseFloat(historyResult.rows[0].avg_rental_days || 0),
        first_rental_date: historyResult.rows[0].first_rental_date,
        last_rental_date: historyResult.rows[0].last_rental_date,
      },
      current_rentals: currentRentalsResult.rows,
      reviews: {
        total: parseInt(reviewsResult.rows[0].total_reviews),
        avg_rating: parseFloat(reviewsResult.rows[0].avg_rating || 0),
      },
    });
  } catch (error) {
    console.error("Get product stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📦 Bulk Update Products
export const bulkUpdateProducts = async (req, res) => {
  const { product_ids, updates } = req.body;

  if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
    return res.status(400).json({ error: "Product IDs array is required" });
  }

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "Updates object is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updateFields = [];
    const params = [];
    let paramCount = 0;

    // Build update query
    Object.entries(updates).forEach(([key, value]) => {
      paramCount++;
      updateFields.push(`${key} = $${paramCount}`);
      params.push(value);
    });

    if (updateFields.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Add product IDs to params
    paramCount++;
    params.push(product_ids);

    const query = `
      UPDATE product
      SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($${paramCount})
      RETURNING id
    `;

    const result = await client.query(query, params);

    await client.query("COMMIT");

    res.json({
      message: "Products updated successfully",
      updated_count: result.rows.length,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Bulk update products error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

// 📤 Export Products to CSV
export const exportProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.character_name,
        p.daily_price,
        p.weekly_price,
        p.deposit_amount,
        p.size,
        p.condition,
        p.total_quantity,
        p.available_quantity,
        c.name as category_name,
        p.created_at
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);

    // Convert to CSV
    const headers = [
      'ID', 'Name', 'Character', 'Daily Price', 'Weekly Price', 
      'Deposit', 'Size', 'Condition', 'Total Qty', 'Available Qty',
      'Category', 'Created At'
    ];

    let csv = headers.join(',') + '\n';

    result.rows.forEach(row => {
      csv += [
        row.id,
        `"${row.name}"`,
        `"${row.character_name || ''}"`,
        row.daily_price,
        row.weekly_price || '',
        row.deposit_amount,
        row.size || '',
        row.condition,
        row.total_quantity,
        row.available_quantity,
        `"${row.category_name || ''}"`,
        row.created_at,
      ].join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    res.send(csv);
  } catch (error) {
    console.error("Export products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};