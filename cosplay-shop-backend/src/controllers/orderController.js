import { v4 as uuidv4 } from "uuid"
import pool from "../config/database.js"

export const createOrder = async (req, res) => {
  const { pay_method, shipping_address } = req.body
  if (!pay_method || !shipping_address) {
    return res.status(400).json({ error: "Payment method and shipping address are required" })
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Lấy giỏ hàng
    const cartResult = await client.query(
      `SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.images
       FROM cart c
       JOIN product p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user.id],
    )

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(400).json({ error: "Cart is empty" })
    }

    // Tính tổng tiền
    const total = cartResult.rows.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // Tạo đơn hàng
    const orderId = uuidv4()
    const orderNumber = `ORD-${Date.now()}`

    const orderResult = await client.query(
      `INSERT INTO "order" (id, user_id, pay_method, order_number, total_amount, shipping_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [orderId, req.user.id, pay_method, orderNumber, total, shipping_address, "pending"],
    )

    // Tạo order items (sử dụng bảng tạm nếu không có product_variants)
    for (const item of cartResult.rows) {
      await client.query(
        `INSERT INTO order_detail (id, order_id, product_variant_id, quantity, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), orderId, item.product_id, item.quantity, item.price],
      )
    }

    // Xóa giỏ hàng
    await client.query("DELETE FROM cart WHERE user_id = $1", [req.user.id])
    await client.query("COMMIT")

    res.status(201).json({
      message: "Order created successfully",
      order: orderResult.rows[0],
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error(error)
    res.status(500).json({ error: "Internal server error" })
  } finally {
    client.release()
  }
}

export const getUserOrders = async (req, res) => {
  const result = await pool.query(
    `SELECT 
      o.id, 
      o.order_number, 
      o.total_amount, 
      o.status, 
      o.shipping_address,
      o.pay_method,
      o.created_at,
      json_agg(
        json_build_object(
          'product_id', p.id,
          'name', p.name,
          'price', od.price,
          'quantity', od.quantity,
          'images', p.images
        )
      ) as items
     FROM "order" o
     LEFT JOIN order_detail od ON o.id = od.order_id
     LEFT JOIN product p ON od.product_variant_id = p.id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [req.user.id],
  )

  res.json(result.rows)
}

export const getOrderById = async (req, res) => {
  const { id } = req.params
  const result = await pool.query(
    `SELECT 
      o.*,
      json_agg(
        json_build_object(
          'product_id', p.id,
          'name', p.name,
          'price', od.price,
          'quantity', od.quantity,
          'images', p.images
        )
      ) as items
     FROM "order" o
     LEFT JOIN order_detail od ON o.id = od.order_id
     LEFT JOIN product p ON od.product_variant_id = p.id
     WHERE o.id = $1 AND o.user_id = $2
     GROUP BY o.id`,
    [id, req.user.id],
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Order not found" })
  }

  res.json(result.rows[0])
}

export const cancelOrder = async (req, res) => {
  const { id } = req.params

  const result = await pool.query(
    `UPDATE "order" 
     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2 AND status = 'pending'
     RETURNING *`,
    [id, req.user.id],
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Order not found or cannot be cancelled" })
  }

  res.json({ message: "Order cancelled successfully", order: result.rows[0] })
}
