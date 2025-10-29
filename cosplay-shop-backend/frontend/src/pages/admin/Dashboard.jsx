// Path: frontend/src/pages/admin/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Progress, Space,
  Avatar, Timeline, Badge, Spin, Alert, Empty
} from 'antd';
import {
  DollarOutlined, ShoppingOutlined, UserOutlined,
  RiseOutlined, FallOutlined, WarningOutlined,
  ClockCircleOutlined, CheckCircleOutlined, AppstoreOutlined,
  AlertOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../services/api';
import dayjs from 'dayjs';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [orderDistribution, setOrderDistribution] = useState([]);
  const [error, setError] = useState(null);

  // Fetch all dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch tất cả dữ liệu song song
      const [statsRes, revenueRes, productsRes, alertsRes, distributionRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/dashboard/revenue-chart', { params: { days: 7 } }),
        api.get('/admin/dashboard/top-products', { params: { limit: 5 } }),
        api.get('/admin/dashboard/alerts'),
        api.get('/admin/dashboard/order-distribution'),
      ]);

      setStats(statsRes.data);
      setRevenueChart(revenueRes.data);
      setTopProducts(productsRes.data);
      setAlerts(alertsRes.data);
      setOrderDistribution(distributionRes.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError(error.response?.data?.error || 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        message="Lỗi tải dữ liệu"
        description={error}
        type="error"
        showIcon
        action={
          <a onClick={fetchDashboardData}>Thử lại</a>
        }
      />
    );
  }

  // No data state
  if (!stats) {
    return <Empty description="Không có dữ liệu" />;
  }

  // Colors for charts
  const COLORS = ['#52c41a', '#faad14', '#1890ff', '#8c8c8c', '#ff4d4f'];

  // Top products table columns
  const productColumns = [
    {
      title: 'Hình',
      dataIndex: 'images',
      width: 60,
      render: (images) => (
        <Avatar 
          src={images?.[0]} 
          shape="square" 
          size={50}
          icon={<AppstoreOutlined />}
        />
      ),
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          {record.character_name && (
            <div style={{ fontSize: 12, color: '#999' }}>
              {record.character_name}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Lượt thuê',
      dataIndex: 'rental_count',
      width: 100,
      align: 'center',
      render: (count) => <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'total_revenue',
      width: 120,
      align: 'right',
      render: (revenue) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          {revenue.toLocaleString()}đ
        </span>
      ),
    },
  ];

  // Alert severity icons
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case 'medium':
        return <AlertOutlined style={{ color: '#faad14' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>📊 Dashboard</h2>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu hôm nay"
              value={stats.revenue.today}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="đ"
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              Tháng này: {stats.revenue.month.toLocaleString()}đ
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn hàng"
              value={stats.orders.total}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ShoppingOutlined />}
            />
            <Space style={{ marginTop: 8, fontSize: 12 }}>
              <Tag color="gold">{stats.orders.pending} chờ</Tag>
              <Tag color="green">{stats.orders.active} đang thuê</Tag>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sản phẩm"
              value={stats.products.total}
              valueStyle={{ color: '#722ed1' }}
              prefix={<AppstoreOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={Math.round((stats.products.rented / stats.products.total_quantity) * 100)} 
                size="small"
                status="active"
                format={(percent) => `${stats.products.rented}/${stats.products.total_quantity} đang thuê`}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Khách hàng"
              value={stats.customers.total}
              valueStyle={{ color: '#cf1322' }}
              prefix={<UserOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              Tổng số khách hàng đã đăng ký
            </div>
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {stats.alerts.overdue_orders > 0 || stats.alerts.low_stock_products > 0 ? (
        <Alert
          message="⚠️ Cảnh báo quan trọng"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              {stats.alerts.overdue_orders > 0 && (
                <div>
                  🔴 Có <strong>{stats.alerts.overdue_orders}</strong> đơn hàng quá hạn cần xử lý
                </div>
              )}
              {stats.alerts.low_stock_products > 0 && (
                <div>
                  🟡 Có <strong>{stats.alerts.low_stock_products}</strong> sản phẩm sắp hết hàng
                </div>
              )}
            </Space>
          }
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      ) : null}

      {/* Revenue Chart & Order Distribution */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="📈 Doanh thu 7 ngày qua" bordered={false}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `${value.toLocaleString()}đ` : value,
                    name === 'revenue' ? 'Doanh thu' : 'Đơn hàng'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#52c41a" 
                  strokeWidth={2}
                  name="Doanh thu"
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  name="Đơn hàng"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="📊 Phân bố đơn hàng" bordered={false}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {orderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Top Products & Recent Alerts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="🔥 Top sản phẩm được thuê nhiều nhất" bordered={false}>
            <Table
              dataSource={topProducts}
              columns={productColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="🔔 Cảnh báo gần đây" bordered={false}>
            <Timeline
              items={alerts.slice(0, 8).map(alert => ({
                dot: getSeverityIcon(alert.severity),
                color: alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'orange' : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                      {alert.message}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {dayjs(alert.created_at).format('DD/MM/YYYY HH:mm')}
                    </div>
                  </div>
                ),
              }))}
            />
            {alerts.length === 0 && (
              <Empty 
                description="Không có cảnh báo" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;