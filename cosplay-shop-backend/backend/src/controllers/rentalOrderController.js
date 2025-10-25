import { v4 as uuidv4 } from "uuid"
import pool from "../config/database.js"

// 🎭 Tạo đơn thuê
export const createRentalOrder = async (req, res) => {
  const { 
    payment_method, 
    shipping_address, 
    rental_start_date, 
    rental_end_date,
    delivery_method = 'delivery',
    notes 
  } = req.body

  // Validation
  if (!payment_method || !shipping_address || !rental_start_date || !rental_end_date) {
    return res.status(400).json({ 
      error: "Payment method, shipping address, and rental dates are required" 
    })
  }

  const startDate = new Date(rental_start_date)
  const endDate = new Date(rental_end_date)
  const rentalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

  if (rentalDays < 1) {
    return res.status(400).json({ error: "Invalid rental dates" })
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Lấy giỏ hàng
    const cartResult = await client.query(
      `SELECT c.id, c.product_id, c.quantity, p.name, p.daily_price, 
              p.deposit_amount, p.images, p.available_quantity
       FROM cart c
       JOIN product p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user.id]
    )

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(400).json({ error: "Cart is empty" })
    }

    // Kiểm tra tính khả dụng
    for (const item of cartResult.rows) {
      const availCheck = await client.query(
        `SELECT check_product_availability($1, $2, $3, $4) as available`,
        [item.product_id, item.quantity, rental_start_date, rental_end_date]
      )
      
      if (!availCheck.rows[0].available) {
        await client.query("ROLLBACK")
        return res.status(400).json({ 
          error: `Product "${item.name}" is not available for the selected dates` 
        })
      }
    }

    // Tính toán chi phí
    let subtotal = 0
    let depositTotal = 0

    for (const item of cartResult.rows) {
      const itemSubtotal = item.daily_price * rentalDays * item.quantity
      const itemDeposit = item.deposit_amount * item.quantity
      subtotal += itemSubtotal
      depositTotal += itemDeposit
    }

    const totalAmount = subtotal + depositTotal

    // Tạo đơn thuê
    const orderId = uuidv4()
    const orderNumber = `RNT-${Date.now()}`

    const orderResult = await client.query(
      `INSERT INTO rental_order (
        id, user_id, order_number, 
        rental_start_date, rental_end_date, rental_days,
        subtotal, deposit_total, total_amount,
        shipping_address, delivery_method, payment_method,
        status, payment_status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        orderId, req.user.id, orderNumber,
        rental_start_date, rental_end_date, rentalDays,
        subtotal, depositTotal, totalAmount,
        shipping_address, delivery_method, payment_method,
        'pending', 'unpaid', notes || null
      ]
    )

    // Tạo order details
    for (const item of cartResult.rows) {
      const itemSubtotal = item.daily_price * rentalDays * item.quantity
      const itemDeposit = item.deposit_amount * item.quantity

      await client.query(
        `INSERT INTO rental_order_detail (
          id, rental_order_id, product_id, quantity,
          daily_price, rental_days, subtotal, deposit_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uuidv4(), orderId, item.product_id, item.quantity,
          item.daily_price, rentalDays, itemSubtotal, itemDeposit
        ]
      )
    }

    // Xóa giỏ hàng
    await client.query("DELETE FROM cart WHERE user_id = $1", [req.user.id])
    
    await client.query("COMMIT")

    res.status(201).json({
      message: "Rental order created successfully",
      order: orderResult.rows[0]
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("❌ Rental order creation error:", error)
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    })
  } finally {
    client.release()
  }
}

// 📋 Lấy danh sách đơn thuê
export const getUserRentalOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        ro.id, 
        ro.order_number, 
        ro.rental_start_date,
        ro.rental_end_date,
        ro.rental_days,
        ro.subtotal,
        ro.deposit_total,
        ro.total_amount, 
        ro.status,
        ro.payment_status,
        ro.shipping_address,
        ro.payment_method,
        ro.created_at,
        json_agg(
          json_build_object(
            'product_id', p.id,
            'name', p.name,
            'daily_price', rod.daily_price,
            'quantity', rod.quantity,
            'rental_days', rod.rental_days,
            'subtotal', rod.subtotal,
            'deposit', rod.deposit_amount,
            'images', p.images
          )
        ) as items
       FROM rental_order ro
       LEFT JOIN rental_order_detail rod ON ro.id = rod.rental_order_id
       LEFT JOIN product p ON rod.product_id = p.id
       WHERE ro.user_id = $1
       GROUP BY ro.id
       ORDER BY ro.created_at DESC`,
      [req.user.id]
    )

    res.json(result.rows)
  } catch (error) {
    console.error("❌ Get rental orders error:", error)
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    })
  }
}

// 🔍 Lấy chi tiết đơn thuê
export const getRentalOrderById = async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      `SELECT 
        ro.*,
        json_agg(
          json_build_object(
            'product_id', p.id,
            'name', p.name,
            'daily_price', rod.daily_price,
            'quantity', rod.quantity,
            'rental_days', rod.rental_days,
            'subtotal', rod.subtotal,
            'deposit', rod.deposit_amount,
            'images', p.images
          )
        ) as items
       FROM rental_order ro
       LEFT JOIN rental_order_detail rod ON ro.id = rod.rental_order_id
       LEFT JOIN product p ON rod.product_id = p.id
       WHERE ro.id = $1 AND ro.user_id = $2
       GROUP BY ro.id`,
      [id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rental order not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("❌ Get rental order error:", error)
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    })
  }
}

// ❌ Hủy đơn thuê
export const cancelRentalOrder = async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query(
      `UPDATE rental_order 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING *`,
      [id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: "Rental order not found or cannot be cancelled" 
      })
    }

    res.json({ 
      message: "Rental order cancelled successfully", 
      order: result.rows[0] 
    })
  } catch (error) {
    console.error("❌ Cancel rental order error:", error)
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    })
  }
}

// 📅 Kiểm tra tính khả dụng của sản phẩm
export const checkProductAvailability = async (req, res) => {
  const { product_id, quantity, start_date, end_date } = req.query

  if (!product_id || !quantity || !start_date || !end_date) {
    return res.status(400).json({ 
      error: "Missing required parameters" 
    })
  }

  try {
    const result = await pool.query(
      `SELECT check_product_availability($1, $2, $3, $4) as available`,
      [product_id, parseInt(quantity), start_date, end_date]
    )

    res.json({ 
      available: result.rows[0].available,
      product_id,
      quantity: parseInt(quantity),
      start_date,
      end_date
    })
  } catch (error) {
    console.error("❌ Check availability error:", error)
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    })
  }
}

// 🔄 Xác nhận trả hàng (Admin function - nên tách ra admin routes)
export const confirmReturn = async (req, res) => {
  const { id } = req.params
  const { actual_return_date, condition, late_fee = 0, damage_fee = 0 } = req.body

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Tính tiền hoàn lại
    const orderResult = await client.query(
      `SELECT deposit_total FROM rental_order WHERE id = $1`,
      [id]
    )

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ error: "Order not found" })
    }

    const refundAmount = orderResult.rows[0].deposit_total - late_fee - damage_fee

    // Cập nhật đơn hàng
    await client.query(
      `UPDATE rental_order 
       SET status = 'completed',
           actual_return_date = $1,
           late_fee = $2,
           damage_fee = $3,
           refund_amount = $4,
           payment_status = 'refunded',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [actual_return_date, late_fee, damage_fee, refundAmount, id]
    )

    await client.query("COMMIT")

    res.json({ 
      message: "Return confirmed successfully",
      refund_amount: refundAmount
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("❌ Confirm return error:", error)
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    })
  } finally {
    client.release()
  }
}