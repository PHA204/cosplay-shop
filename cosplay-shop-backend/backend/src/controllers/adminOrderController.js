// Path: backend/controllers/adminOrderController.js
// Updated: Thêm logic auto-set actual dates khi chuyển status

import pool from "../config/database.js";

// 📋 Get All Orders
export const getAdminOrders = async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status,
    payment_status,
    search,
    start_date,
    end_date,
    sort_by = 'created_at',
    order = 'desc'
  } = req.query;
  
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        ro.*,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        COUNT(rod.id) as items_count
      FROM rental_order ro
      JOIN users u ON ro.user_id = u.id
      LEFT JOIN rental_order_detail rod ON ro.id = rod.rental_order_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND ro.status = $${paramCount}`;
      params.push(status);
    }

    if (payment_status) {
      paramCount++;
      query += ` AND ro.payment_status = $${paramCount}`;
      params.push(payment_status);
    }

    if (search) {
      paramCount++;
      query += ` AND (ro.order_number ILIKE $${paramCount} OR u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (start_date) {
      paramCount++;
      query += ` AND ro.expected_start_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND ro.expected_end_date <= $${paramCount}`;
      params.push(end_date);
    }

    query += ` GROUP BY ro.id, u.name, u.email, u.phone`;

    const validSortFields = ['order_number', 'created_at', 'expected_start_date', 'total_amount', 'status'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ro.${sortField} ${sortOrder}`;

    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT ro.id) 
      FROM rental_order ro
      JOIN users u ON ro.user_id = u.id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 0;

    if (status) {
      countParamIndex++;
      countQuery += ` AND ro.status = $${countParamIndex}`;
      countParams.push(status);
    }

    if (payment_status) {
      countParamIndex++;
      countQuery += ` AND ro.payment_status = $${countParamIndex}`;
      countParams.push(payment_status);
    }

    if (search) {
      countParamIndex++;
      countQuery += ` AND (ro.order_number ILIKE $${countParamIndex} OR u.name ILIKE $${countParamIndex} OR u.email ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    if (start_date) {
      countParamIndex++;
      countQuery += ` AND ro.expected_start_date >= $${countParamIndex}`;
      countParams.push(start_date);
    }

    if (end_date) {
      countParamIndex++;
      countQuery += ` AND ro.expected_end_date <= $${countParamIndex}`;
      countParams.push(end_date);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      data: result.rows.map(row => ({
        ...row,
        subtotal: parseFloat(row.subtotal),
        deposit_total: parseFloat(row.deposit_total),
        total_amount: parseFloat(row.total_amount),
        late_fee: parseFloat(row.late_fee || 0),
        damage_fee: parseFloat(row.damage_fee || 0),
        refund_amount: parseFloat(row.refund_amount || 0),
        items_count: parseInt(row.items_count),
      })),
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get admin orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔍 Get Order Detail
export const getOrderDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const orderResult = await pool.query(
      `SELECT 
        ro.*,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        u.address as customer_address,
        u.avatar_url as customer_avatar
      FROM rental_order ro
      JOIN users u ON ro.user_id = u.id
      WHERE ro.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT 
        rod.*,
        p.name as product_name,
        p.character_name,
        p.images,
        p.size,
        p.category_id,
        c.name as category_name
      FROM rental_order_detail rod
      JOIN product p ON rod.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      WHERE rod.rental_order_id = $1`,
      [id]
    );

    const historyResult = await pool.query(
      `SELECT * FROM rental_history
       WHERE rental_order_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      ...order,
      subtotal: parseFloat(order.subtotal),
      deposit_total: parseFloat(order.deposit_total),
      total_amount: parseFloat(order.total_amount),
      late_fee: parseFloat(order.late_fee || 0),
      damage_fee: parseFloat(order.damage_fee || 0),
      refund_amount: parseFloat(order.refund_amount || 0),
      items: itemsResult.rows.map(item => ({
        ...item,
        daily_price: parseFloat(item.daily_price),
        subtotal: parseFloat(item.subtotal),
        deposit_amount: parseFloat(item.deposit_amount),
      })),
      history: historyResult.rows,
    });
  } catch (error) {
    console.error("Get order detail error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✏️ Update Order Status - LOGIC QUAN TRỌNG
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const validStatuses = [
    'pending', 'confirmed', 'preparing', 'delivering', 
    'rented', 'returning', 'completed', 'cancelled'
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const currentOrder = await pool.query(
      "SELECT * FROM rental_order WHERE id = $1",
      [id]
    );

    if (currentOrder.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = currentOrder.rows[0];
    const oldStatus = order.status;

    if (oldStatus === 'completed' || oldStatus === 'cancelled') {
      return res.status(400).json({ 
        error: "Cannot update status of completed or cancelled order" 
      });
    }

    // 🔥 LOGIC QUAN TRỌNG: Auto-set actual dates khi chuyển sang 'rented'
    if (status === 'rented' && oldStatus !== 'rented') {
      const actualStartDate = new Date();
      const actualEndDate = new Date(actualStartDate);
      actualEndDate.setDate(actualEndDate.getDate() + order.rental_days);

      const updateQuery = `
        UPDATE rental_order 
        SET 
          status = $1,
          actual_start_date = $2,
          actual_end_date = $3,
          notes = COALESCE($4, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [
        status,
        actualStartDate,
        actualEndDate,
        notes,
        id
      ]);

      console.log(`✅ Order ${order.order_number} started renting:`, {
        actual_start_date: actualStartDate,
        actual_end_date: actualEndDate,
        rental_days: order.rental_days
      });

      await pool.query(
        `INSERT INTO activity_logs (admin_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.admin.id,
          'update_order_status',
          'order',
          id,
          JSON.stringify({ 
            old_status: oldStatus, 
            new_status: status, 
            notes,
            actual_start_date: actualStartDate,
            actual_end_date: actualEndDate
          })
        ]
      );

      return res.json({
        message: "Order status updated successfully - Rental started!",
        order: result.rows[0],
      });
    }

    // Update status thông thường
    const updateQuery = notes 
      ? "UPDATE rental_order SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *"
      : "UPDATE rental_order SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *";
    
    const updateParams = notes ? [status, notes, id] : [status, id];
    const result = await pool.query(updateQuery, updateParams);

    await pool.query(
      `INSERT INTO activity_logs (admin_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.admin.id,
        'update_order_status',
        'order',
        id,
        JSON.stringify({ old_status: oldStatus, new_status: status, notes })
      ]
    );

    res.json({
      message: "Order status updated successfully",
      order: result.rows[0],
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📦 Process Return
export const processReturn = async (req, res) => {
  const { id } = req.params;
  const { 
    actual_return_date,
    items_condition,
    notes 
  } = req.body;

  if (!actual_return_date) {
    return res.status(400).json({ error: "Actual return date is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      "SELECT * FROM rental_order WHERE id = $1 FOR UPDATE",
      [id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    if (order.status !== 'rented') {
      await client.query("ROLLBACK");
      return res.status(400).json({ 
        error: "Can only process return for rented orders" 
      });
    }

    // Calculate late fee - Dùng actual_end_date thay vì rental_end_date
    const expected = new Date(order.actual_end_date || order.expected_end_date);
    const actual = new Date(actual_return_date);
    let lateFee = 0;

    if (actual > expected) {
      const lateDays = Math.ceil((actual - expected) / (1000 * 60 * 60 * 24));
      const avgPriceResult = await client.query(
        `SELECT AVG(daily_price) as avg_price 
         FROM rental_order_detail 
         WHERE rental_order_id = $1`,
        [id]
      );
      const avgDailyPrice = parseFloat(avgPriceResult.rows[0].avg_price || 0);
      lateFee = lateDays * avgDailyPrice * 1.5;
    }

    // Calculate damage fee
    let totalDamageFee = 0;
    if (items_condition && Array.isArray(items_condition)) {
      for (const item of items_condition) {
        if (item.damage_fee) {
          totalDamageFee += parseFloat(item.damage_fee);
        }

        await client.query(
          `UPDATE rental_order_detail 
           SET return_condition = $1, condition_notes = $2
           WHERE rental_order_id = $3 AND product_id = $4`,
          [item.condition, item.notes || null, id, item.product_id]
        );

        await client.query(
          `INSERT INTO rental_history 
           (product_id, rental_order_id, user_id, rental_start_date, 
            rental_end_date, actual_return_date, condition_after)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            item.product_id,
            id,
            order.user_id,
            order.actual_start_date || order.expected_start_date,
            order.actual_end_date || order.expected_end_date,
            actual_return_date,
            item.condition
          ]
        );

        if (item.condition === 'damaged' || item.condition === 'broken') {
          await client.query(
            "UPDATE product SET condition = $1 WHERE id = $2",
            [item.condition, item.product_id]
          );
        }
      }
    }

    const refundAmount = Math.max(
      0,
      parseFloat(order.deposit_total) - lateFee - totalDamageFee
    );

    await client.query(
      `UPDATE rental_order 
       SET status = 'completed',
           actual_return_date = $1,
           late_fee = $2,
           damage_fee = $3,
           refund_amount = $4,
           notes = COALESCE($5, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [actual_return_date, lateFee, totalDamageFee, refundAmount, notes, id]
    );

    await client.query(
      `INSERT INTO activity_logs (admin_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.admin.id,
        'process_return',
        'order',
        id,
        JSON.stringify({ 
          actual_return_date, 
          late_fee: lateFee, 
          damage_fee: totalDamageFee,
          refund_amount: refundAmount 
        })
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: "Return processed successfully",
      late_fee: lateFee,
      damage_fee: totalDamageFee,
      refund_amount: refundAmount,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Process return error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

// ❌ Cancel Order
export const cancelOrder = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const orderResult = await pool.query(
      "SELECT * FROM rental_order WHERE id = $1",
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        error: "Can only cancel pending or confirmed orders" 
      });
    }

    await pool.query(
      `UPDATE rental_order 
       SET status = 'cancelled', 
           notes = COALESCE($1, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reason, id]
    );

    await pool.query(
      `INSERT INTO activity_logs (admin_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.admin.id,
        'cancel_order',
        'order',
        id,
        JSON.stringify({ reason })
      ]
    );

    res.json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updatePaymentStatus = async (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body;

  const validPaymentStatuses = ['unpaid', 'paid', 'refunded'];
  
  if (!validPaymentStatuses.includes(payment_status)) {
    return res.status(400).json({ error: "Invalid payment status" });
  }

  try {
    // Get current order
    const orderResult = await pool.query(
      "SELECT * FROM rental_order WHERE id = $1",
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];
    
    // Không cho phép đổi nếu đã hoàn tiền
    if (order.payment_status === 'refunded') {
      return res.status(400).json({ 
        error: "Cannot change payment status of refunded order" 
      });
    }

    // Update payment status
    const result = await pool.query(
      `UPDATE rental_order 
       SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [payment_status, id]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (admin_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.admin.id,
        'update_payment_status',
        'order',
        id,
        JSON.stringify({ 
          old_status: order.payment_status, 
          new_status: payment_status,
          amount: order.total_amount
        })
      ]
    );

    res.json({
      message: "Payment status updated successfully",
      order: result.rows[0],
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};