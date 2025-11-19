import express from "express";
import db from "../config/database.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const router = express.Router();

/* ---------------------------------------------------
   REVENUE REPORT (PostgreSQL)
----------------------------------------------------*/
router.get("/revenue", async (req, res) => {
  try {
    const { start_date, end_date, group_by = "day" } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: "Thiếu start_date hoặc end_date" });
    }

    /* SUMMARY */
    const summaryQuery = `
      SELECT 
        SUM(total_amount) AS total_revenue,
        COUNT(*) AS total_orders,
        AVG(total_amount) AS avg_order_value,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
      FROM rental
      WHERE created_at::date BETWEEN $1 AND $2
    `;

    const { rows: sm } = await db.query(summaryQuery, [start_date, end_date]);

    const summary = {
      total_revenue: sm[0].total_revenue || 0,
      total_orders: sm[0].total_orders || 0,
      avg_order_value: Math.round(sm[0].avg_order_value || 0),
      completed_orders: sm[0].completed_orders || 0,
      cancelled_orders: sm[0].cancelled_orders || 0,
    };

    /* GROUP FORMAT */
    let groupFormat = "created_at::date";
    switch (group_by) {
      case "week":
        groupFormat = `TO_CHAR(created_at, 'IYYY-IW')`;
        break;
      case "month":
        groupFormat = `TO_CHAR(created_at, 'YYYY-MM')`;
        break;
    }

    /* CHART DATA */
    const chartQuery = `
      SELECT 
        ${groupFormat} AS period,
        SUM(total_amount) AS revenue,
        COUNT(*) AS orders,
        AVG(total_amount) AS avg_value
      FROM rental
      WHERE created_at::date BETWEEN $1 AND $2
      GROUP BY period
      ORDER BY period
    `;

    const { rows: crows } = await db.query(chartQuery, [start_date, end_date]);

    const chart_data = crows.map((r) => ({
      period: r.period,
      revenue: r.revenue || 0,
      orders: r.orders || 0,
      avg_value: Math.round(r.avg_value || 0),
    }));

    /* TABLE DATA */
    const tableQuery = `
      SELECT 
        created_at::date AS period,
        SUM(total_amount) AS revenue,
        COUNT(*) AS orders,
        AVG(total_amount) AS avg_value
      FROM rental
      WHERE created_at::date BETWEEN $1 AND $2
      GROUP BY period
      ORDER BY period DESC
    `;

    const { rows: trows } = await db.query(tableQuery, [start_date, end_date]);

    const table_data = trows.map((r) => ({
      period: r.period,
      revenue: r.revenue || 0,
      orders: r.orders || 0,
      avg_value: Math.round(r.avg_value || 0),
    }));

    res.json({ summary, chart_data, table_data });
  } catch (e) {
    console.error("Revenue report error:", e);
    res.status(500).json({ error: "Không thể tạo báo cáo doanh thu" });
  }
});

/* ---------------------------------------------------
   ORDERS REPORT
----------------------------------------------------*/
router.get("/orders", async (req, res) => {
  try {
    const { start_date, end_date, group_by = "day" } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: "Thiếu start_date hoặc end_date" });
    }

    const summaryQuery = `
      SELECT 
        COUNT(*) AS total_orders,
        SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN status='rented' THEN 1 ELSE 0 END) AS rented,
        SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled
      FROM rental
      WHERE created_at::date BETWEEN $1 AND $2
    `;

    const { rows: sm } = await db.query(summaryQuery, [start_date, end_date]);
    const summary = sm[0];

    const distQuery = `
      SELECT status AS name, COUNT(*) AS value
      FROM rental
      WHERE created_at::date BETWEEN $1 AND $2
      GROUP BY status
    `;

    const { rows: dist } = await db.query(distQuery, [start_date, end_date]);

    let groupFormat = "created_at::date";
    if (group_by === "week") groupFormat = `TO_CHAR(created_at,'IYYY-IW')`;
    if (group_by === "month") groupFormat = `TO_CHAR(created_at,'YYYY-MM')`;

    const chartQuery = `
      SELECT 
        ${groupFormat} AS period,
        COUNT(*) AS orders,
        SUM(total_amount) AS revenue
      FROM rental
      WHERE created_at::date BETWEEN $1 AND $2
      GROUP BY period
      ORDER BY period
    `;

    const { rows: crows } = await db.query(chartQuery, [start_date, end_date]);

    res.json({
      summary,
      distribution: dist,
      chart_data: crows,
    });
  } catch (e) {
    console.error("Orders report error:", e);
    res.status(500).json({ error: "Không thể tạo báo cáo đơn hàng" });
  }
});

/* ---------------------------------------------------
   PRODUCT REPORT
----------------------------------------------------*/
router.get("/products", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: "Thiếu start_date hoặc end_date" });
    }

    const tableQuery = `
      SELECT 
        p.id,
        p.name AS product_name,
        p.character_name,
        COUNT(ri.id) AS rental_count,
        SUM(ri.subtotal) AS revenue,
        ROUND((COUNT(ri.id)::numeric / p.total_quantity) * 100, 1) AS rental_rate
      FROM product p
      LEFT JOIN rental_item ri ON p.id = ri.product_id
      LEFT JOIN rental r ON ri.rental_id = r.id
      WHERE r.created_at BETWEEN $1 AND $2
      GROUP BY p.id
      ORDER BY rental_count DESC
      LIMIT 20
    `;

    const { rows: trows } = await db.query(tableQuery, [start_date, end_date]);

    const table_data = trows.map((r) => ({
      product_name: r.character_name
        ? `${r.product_name} (${r.character_name})`
        : r.product_name,
      rental_count: r.rental_count || 0,
      revenue: r.revenue || 0,
      rental_rate: r.rental_rate || 0,
    }));

    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT p.id) AS total_products,
        SUM(p.total_quantity) AS total_inventory,
        SUM(p.available_quantity) AS available_inventory,
        COUNT(DISTINCT ri.product_id) AS products_rented
      FROM product p
      LEFT JOIN rental_item ri ON p.id = ri.product_id
      LEFT JOIN rental r ON ri.rental_id = r.id 
           AND r.created_at BETWEEN $1 AND $2
    `;

    const { rows: sm } = await db.query(summaryQuery, [start_date, end_date]);

    res.json({ summary: sm[0], table_data });
  } catch (e) {
    console.error("Products report error:", e);
    res.status(500).json({ error: "Không thể tạo báo cáo sản phẩm" });
  }
});

/* ---------------------------------------------------
   CUSTOMER REPORT
----------------------------------------------------*/
router.get("/customers", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: "Thiếu start_date hoặc end_date" });
    }

    const tableQuery = `
      SELECT 
        u.id,
        u.name AS customer_name,
        u.phone,
        u.email,
        COUNT(r.id) AS total_orders,
        SUM(r.total_amount) AS total_spent,
        MAX(r.created_at) AS last_order_date
      FROM users u
      INNER JOIN rental r ON u.id = r.user_id
      WHERE r.created_at BETWEEN $1 AND $2
      GROUP BY u.id
      ORDER BY total_spent DESC
      LIMIT 50
    `;

    const { rows: trows } = await db.query(tableQuery, [start_date, end_date]);

    const table_data = trows.map((r) => ({
      customer_name: r.customer_name,
      phone: r.phone,
      email: r.email,
      total_orders: r.total_orders || 0,
      total_spent: r.total_spent || 0,
      last_order_date: r.last_order_date,
    }));

    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT u.id) AS total_customers,
        COUNT(r.id) AS total_orders,
        SUM(r.total_amount) AS total_revenue,
        AVG(r.total_amount) AS avg_order_value
      FROM users u
      INNER JOIN rental r ON u.id = r.user_id
      WHERE r.created_at BETWEEN $1 AND $2
    `;

    const { rows: sm } = await db.query(summaryQuery, [start_date, end_date]);

    res.json({
      summary: {
        total_customers: sm[0].total_customers || 0,
        total_orders: sm[0].total_orders || 0,
        total_revenue: sm[0].total_revenue || 0,
        avg_order_value: Math.round(sm[0].avg_order_value || 0),
      },
      table_data,
    });
  } catch (e) {
    console.error("Customers report error:", e);
    res.status(500).json({ error: "Không thể tạo báo cáo khách hàng" });
  }
});

/* ---------------------------------------------------
   INVENTORY REPORT
----------------------------------------------------*/
router.get("/inventory", async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.name AS product_name,
        p.character_name,
        c.name AS category_name,
        p.total_quantity,
        p.available_quantity,
        (p.total_quantity - p.available_quantity) AS rented_quantity,
        ROUND((p.available_quantity::numeric / p.total_quantity) * 100, 1) AS availability_rate
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      ORDER BY availability_rate ASC
    `;

    const { rows } = await db.query(query);

    const table_data = rows.map((r) => ({
      product_name: r.character_name
        ? `${r.product_name} (${r.character_name})`
        : r.product_name,
      category_name: r.category_name,
      total_quantity: r.total_quantity,
      available_quantity: r.available_quantity,
      rented_quantity: r.rented_quantity,
      availability_rate: r.availability_rate,
    }));

    const summaryQuery = `
      SELECT 
        COUNT(*) AS total_products,
        SUM(total_quantity) AS total_inventory,
        SUM(available_quantity) AS available_inventory,
        SUM(total_quantity - available_quantity) AS rented_inventory
      FROM product
    `;

    const { rows: sm } = await db.query(summaryQuery);

    res.json({ summary: sm[0], table_data });
  } catch (e) {
    console.error("Inventory report error:", e);
    res.status(500).json({ error: "Không thể tạo báo cáo tồn kho" });
  }
});

export default router;
