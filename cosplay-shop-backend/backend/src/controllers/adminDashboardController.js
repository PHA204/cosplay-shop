import pool from "../config/database.js";

// 📊 Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    // Total revenue today
    const todayRevenueResult = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as today_revenue
      FROM rental_order
      WHERE DATE(created_at) = CURRENT_DATE
        AND status NOT IN ('cancelled') 
    `);

    // Total revenue this month
    const monthRevenueResult = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as month_revenue
      FROM rental_order
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
        AND status NOT IN ('cancelled')
    `);

    // Total orders
    const ordersResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE status IN ('confirmed', 'preparing', 'delivering', 'rented')) as active_orders,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
        COUNT(*) as total_orders
      FROM rental_order
    `);

    // Total products
    const productsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(total_quantity) as total_quantity,
        SUM(available_quantity) as available_quantity,
        SUM(total_quantity - available_quantity) as rented_quantity
      FROM product
    `);

    // Total customers
    const customersResult = await pool.query(`
      SELECT COUNT(*) as total_customers FROM users
    `);

    // Overdue orders
    const overdueResult = await pool.query(`
      SELECT COUNT(*) as overdue_orders
      FROM rental_order
      WHERE status = 'rented'
        AND rental_end_date < CURRENT_DATE
    `);

    // Low stock products (less than 2 available)
    const lowStockResult = await pool.query(`
      SELECT COUNT(*) as low_stock_products
      FROM product
      WHERE available_quantity < 2
    `);

    res.json({
      revenue: {
        today: parseFloat(todayRevenueResult.rows[0].today_revenue),
        month: parseFloat(monthRevenueResult.rows[0].month_revenue),
      },
      orders: {
        pending: parseInt(ordersResult.rows[0].pending_orders),
        active: parseInt(ordersResult.rows[0].active_orders),
        completed: parseInt(ordersResult.rows[0].completed_orders),
        cancelled: parseInt(ordersResult.rows[0].cancelled_orders),
        total: parseInt(ordersResult.rows[0].total_orders),
      },
      products: {
        total: parseInt(productsResult.rows[0].total_products),
        total_quantity: parseInt(productsResult.rows[0].total_quantity || 0),
        available: parseInt(productsResult.rows[0].available_quantity || 0),
        rented: parseInt(productsResult.rows[0].rented_quantity || 0),
      },
      customers: {
        total: parseInt(customersResult.rows[0].total_customers),
      },
      alerts: {
        overdue_orders: parseInt(overdueResult.rows[0].overdue_orders),
        low_stock_products: parseInt(lowStockResult.rows[0].low_stock_products),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📈 Revenue Chart (Last 7/30 days)
export const getRevenueChart = async (req, res) => {
  const { days = 7 } = req.query;

  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as orders
      FROM rental_order
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
        AND status NOT IN ('cancelled')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json(
      result.rows.map(row => ({
        date: row.date,
        revenue: parseFloat(row.revenue),
        orders: parseInt(row.orders),
      }))
    );
  } catch (error) {
    console.error("Revenue chart error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔥 Top Products
export const getTopProducts = async (req, res) => {
  const { limit = 10 } = req.query;

  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.character_name,
        p.images,
        p.daily_price,
        COUNT(rod.id) as rental_count,
        COALESCE(SUM(rod.subtotal), 0) as total_revenue
      FROM product p
      LEFT JOIN rental_order_detail rod ON p.id = rod.product_id
      LEFT JOIN rental_order ro ON rod.rental_order_id = ro.id
      WHERE ro.status NOT IN ('cancelled') OR ro.status IS NULL
      GROUP BY p.id
      ORDER BY rental_count DESC, total_revenue DESC
      LIMIT $1
    `, [limit]);

    res.json(
      result.rows.map(row => ({
        id: row.id,
        name: row.name,
        character_name: row.character_name,
        images: row.images,
        daily_price: parseFloat(row.daily_price),
        rental_count: parseInt(row.rental_count),
        total_revenue: parseFloat(row.total_revenue),
      }))
    );
  } catch (error) {
    console.error("Top products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ⚠️ Recent Alerts
export const getRecentAlerts = async (req, res) => {
  try {
    const alerts = [];

    // Overdue orders
    const overdueResult = await pool.query(`
      SELECT 
        ro.id,
        ro.order_number,
        ro.rental_end_date,
        u.name as customer_name,
        CURRENT_DATE - ro.rental_end_date as days_overdue
      FROM rental_order ro
      JOIN users u ON ro.user_id = u.id
      WHERE ro.status = 'rented'
        AND ro.rental_end_date < CURRENT_DATE
      ORDER BY days_overdue DESC
      LIMIT 5
    `);

    overdueResult.rows.forEach(row => {
      alerts.push({
        type: 'overdue',
        severity: 'high',
        title: 'Đơn hàng quá hạn',
        message: `Đơn ${row.order_number} của ${row.customer_name} đã quá hạn ${row.days_overdue} ngày`,
        order_id: row.id,
        created_at: row.rental_end_date,
      });
    });

    // Low stock products
    const lowStockResult = await pool.query(`
      SELECT id, name, available_quantity, total_quantity
      FROM product
      WHERE available_quantity < 2
      ORDER BY available_quantity ASC
      LIMIT 5
    `);

    lowStockResult.rows.forEach(row => {
      alerts.push({
        type: 'low_stock',
        severity: row.available_quantity === 0 ? 'high' : 'medium',
        title: 'Sản phẩm sắp hết',
        message: `${row.name} chỉ còn ${row.available_quantity}/${row.total_quantity}`,
        product_id: row.id,
        created_at: new Date(),
      });
    });

    // Pending orders
    const pendingResult = await pool.query(`
      SELECT 
        ro.id,
        ro.order_number,
        ro.created_at,
        u.name as customer_name
      FROM rental_order ro
      JOIN users u ON ro.user_id = u.id
      WHERE ro.status = 'pending'
      ORDER BY ro.created_at ASC
      LIMIT 5
    `);

    pendingResult.rows.forEach(row => {
      const hoursWaiting = Math.floor(
        (Date.now() - new Date(row.created_at)) / (1000 * 60 * 60)
      );
      alerts.push({
        type: 'pending_order',
        severity: hoursWaiting > 24 ? 'high' : 'low',
        title: 'Đơn hàng chờ xác nhận',
        message: `Đơn ${row.order_number} của ${row.customer_name} đã chờ ${hoursWaiting}h`,
        order_id: row.id,
        created_at: row.created_at,
      });
    });

    // Sort by severity and date
    alerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json(alerts.slice(0, 10));
  } catch (error) {
    console.error("Recent alerts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📊 Order Status Distribution
export const getOrderStatusDistribution = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM rental_order
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY status
      ORDER BY count DESC
    `);

    res.json(
      result.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count),
      }))
    );
  } catch (error) {
    console.error("Order status distribution error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};