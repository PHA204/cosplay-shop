// Path: frontend/src/pages/admin/Reports.jsx

import React, { useState } from 'react';
import {
  Card, Row, Col, Button, Select, DatePicker, Space, Divider,
  Statistic, Table, Tag, message, Spin, Alert, Radio
} from 'antd';
import {
  DownloadOutlined, FileExcelOutlined, FilePdfOutlined,
  DollarOutlined, ShoppingOutlined, AppstoreOutlined,
  UserOutlined, CalendarOutlined
} from '@ant-design/icons';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = () => {
  const [reportType, setReportType] = useState('revenue');
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [groupBy, setGroupBy] = useState('day');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Fetch report data
  const fetchReport = async () => {
    if (!dateRange || dateRange.length !== 2) {
      message.warning('Vui lòng chọn khoảng thời gian');
      return;
    }

    setLoading(true);
    try {
      const params = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        group_by: groupBy,
      };

      const response = await api.get(`/admin/reports/${reportType}`, { params });
      setReportData(response.data);
      message.success('Tải báo cáo thành công!');
    } catch (error) {
      message.error(error.response?.data?.error || 'Không thể tải báo cáo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Export report
  const exportReport = async (format) => {
    if (!reportData) {
      message.warning('Vui lòng tạo báo cáo trước khi xuất');
      return;
    }

    try {
      const params = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        group_by: groupBy,
        format,
      };

      const response = await api.get(`/admin/reports/${reportType}/export`, {
        params,
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      const filename = `${reportType}_report_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.${extension}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      message.success(`Xuất báo cáo ${format.toUpperCase()} thành công!`);
    } catch (error) {
      message.error('Không thể xuất báo cáo');
      console.error(error);
    }
  };

  // Quick date selections
  const quickDates = [
    { label: 'Hôm nay', value: [dayjs(), dayjs()] },
    { label: '7 ngày qua', value: [dayjs().subtract(7, 'days'), dayjs()] },
    { label: '30 ngày qua', value: [dayjs().subtract(30, 'days'), dayjs()] },
    { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs()] },
    { label: 'Tháng trước', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
    { label: 'Quý này', value: [dayjs().startOf('quarter'), dayjs()] },
    { label: 'Năm này', value: [dayjs().startOf('year'), dayjs()] },
  ];

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>📊 Báo cáo & Thống kê</h2>

      {/* Filter Controls */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8 }}>
              <strong>Loại báo cáo:</strong>
            </div>
            <Select
              value={reportType}
              onChange={setReportType}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="revenue">💰 Doanh thu</Option>
              <Option value="orders">📦 Đơn hàng</Option>
              <Option value="products">🛍️ Sản phẩm</Option>
              <Option value="customers">👥 Khách hàng</Option>
              <Option value="inventory">📊 Tồn kho</Option>
            </Select>
          </Col>

          <Col xs={24} md={10}>
            <div style={{ marginBottom: 8 }}>
              <strong>Khoảng thời gian:</strong>
            </div>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              style={{ width: '100%' }}
              size="large"
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </Col>

          <Col xs={24} md={6}>
            <div style={{ marginBottom: 8 }}>
              <strong>Nhóm theo:</strong>
            </div>
            <Select
              value={groupBy}
              onChange={setGroupBy}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="day">Ngày</Option>
              <Option value="week">Tuần</Option>
              <Option value="month">Tháng</Option>
            </Select>
          </Col>
        </Row>

        <Divider />

        {/* Quick Date Buttons */}
        <div style={{ marginBottom: 16 }}>
          <strong>Chọn nhanh:</strong>
          <div style={{ marginTop: 8 }}>
            <Space wrap>
              {quickDates.map((item, index) => (
                <Button
                  key={index}
                  size="small"
                  onClick={() => setDateRange(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </Space>
          </div>
        </div>

        <Space>
          <Button
            type="primary"
            size="large"
            icon={<CalendarOutlined />}
            onClick={fetchReport}
            loading={loading}
          >
            Tạo báo cáo
          </Button>

          {reportData && (
            <>
              <Button
                icon={<FileExcelOutlined />}
                size="large"
                onClick={() => exportReport('excel')}
              >
                Xuất Excel
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                size="large"
                onClick={() => exportReport('pdf')}
              >
                Xuất PDF
              </Button>
            </>
          )}
        </Space>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="Đang tạo báo cáo..." />
          </div>
        </Card>
      )}

      {/* Report Results */}
      {!loading && reportData && (
        <>
          {/* Summary Statistics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {reportData.summary && Object.entries(reportData.summary).map(([key, value], index) => (
              <Col xs={24} sm={12} lg={6} key={key}>
                <Card>
                  <Statistic
                    title={getSummaryTitle(key)}
                    value={value}
                    precision={key.includes('revenue') || key.includes('amount') ? 0 : undefined}
                    suffix={key.includes('revenue') || key.includes('amount') ? 'đ' : undefined}
                    valueStyle={{ 
                      color: COLORS[index % COLORS.length],
                      fontSize: 24 
                    }}
                    prefix={getSummaryIcon(key)}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {/* Charts */}
          {reportData.chart_data && reportData.chart_data.length > 0 && (
            <Card title="📈 Biểu đồ" style={{ marginBottom: 24 }}>
              <ResponsiveContainer width="100%" height={400}>
                {reportType === 'revenue' || reportType === 'orders' ? (
                  <LineChart data={reportData.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        typeof value === 'number' ? value.toLocaleString() : value,
                        name
                      ]}
                    />
                    <Legend />
                    {Object.keys(reportData.chart_data[0])
                      .filter(key => key !== 'period')
                      .map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          name={getChartLabel(key)}
                        />
                      ))}
                  </LineChart>
                ) : (
                  <BarChart data={reportData.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        typeof value === 'number' ? value.toLocaleString() : value,
                        name
                      ]}
                    />
                    <Legend />
                    {Object.keys(reportData.chart_data[0])
                      .filter(key => key !== 'period')
                      .map((key, index) => (
                        <Bar
                          key={key}
                          dataKey={key}
                          fill={COLORS[index % COLORS.length]}
                          name={getChartLabel(key)}
                        />
                      ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </Card>
          )}

          {/* Distribution Pie Chart */}
          {reportData.distribution && (
            <Card title="📊 Phân bổ" style={{ marginBottom: 24 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Data Table */}
          {reportData.table_data && reportData.table_data.length > 0 && (
            <Card title="📋 Chi tiết dữ liệu">
              <Table
                dataSource={reportData.table_data}
                columns={getTableColumns(reportType)}
                rowKey={(record, index) => index}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Tổng ${total} bản ghi`,
                }}
                scroll={{ x: 1000 }}
                size="small"
              />
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !reportData && (
        <Card>
          <Alert
            message="Chưa có dữ liệu báo cáo"
            description="Vui lòng chọn loại báo cáo, khoảng thời gian và nhấn 'Tạo báo cáo' để xem kết quả."
            type="info"
            showIcon
          />
        </Card>
      )}
    </div>
  );
};

// Helper functions
const getSummaryTitle = (key) => {
  const titles = {
    total_revenue: 'Tổng doanh thu',
    total_orders: 'Tổng đơn hàng',
    total_products: 'Tổng sản phẩm',
    total_customers: 'Tổng khách hàng',
    avg_order_value: 'Giá trị TB/đơn',
    rental_rate: 'Tỷ lệ thuê',
    completed_orders: 'Đơn hoàn thành',
    cancelled_orders: 'Đơn bị hủy',
  };
  return titles[key] || key;
};

const getSummaryIcon = (key) => {
  const icons = {
    total_revenue: <DollarOutlined />,
    total_orders: <ShoppingOutlined />,
    total_products: <AppstoreOutlined />,
    total_customers: <UserOutlined />,
    avg_order_value: <DollarOutlined />,
  };
  return icons[key];
};

const getChartLabel = (key) => {
  const labels = {
    revenue: 'Doanh thu',
    orders: 'Đơn hàng',
    customers: 'Khách hàng',
    products_rented: 'SP được thuê',
    avg_value: 'Giá trị TB',
  };
  return labels[key] || key;
};

const getTableColumns = (reportType) => {
  const baseColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
  ];

  if (reportType === 'revenue') {
    return [
      ...baseColumns,
      {
        title: 'Khoảng thời gian',
        dataIndex: 'period',
        key: 'period',
      },
      {
        title: 'Doanh thu',
        dataIndex: 'revenue',
        key: 'revenue',
        align: 'right',
        render: (value) => <strong style={{ color: '#52c41a' }}>{value?.toLocaleString()}đ</strong>,
      },
      {
        title: 'Số đơn hàng',
        dataIndex: 'orders',
        key: 'orders',
        align: 'center',
      },
      {
        title: 'Giá trị TB',
        dataIndex: 'avg_value',
        key: 'avg_value',
        align: 'right',
        render: (value) => `${value?.toLocaleString()}đ`,
      },
    ];
  }

  if (reportType === 'products') {
    return [
      ...baseColumns,
      {
        title: 'Tên sản phẩm',
        dataIndex: 'product_name',
        key: 'product_name',
      },
      {
        title: 'Lượt thuê',
        dataIndex: 'rental_count',
        key: 'rental_count',
        align: 'center',
        sorter: (a, b) => a.rental_count - b.rental_count,
      },
      {
        title: 'Doanh thu',
        dataIndex: 'revenue',
        key: 'revenue',
        align: 'right',
        sorter: (a, b) => a.revenue - b.revenue,
        render: (value) => <strong style={{ color: '#52c41a' }}>{value?.toLocaleString()}đ</strong>,
      },
      {
        title: 'Tỷ lệ thuê',
        dataIndex: 'rental_rate',
        key: 'rental_rate',
        align: 'center',
        render: (value) => `${value}%`,
      },
    ];
  }

  if (reportType === 'customers') {
    return [
      ...baseColumns,
      {
        title: 'Khách hàng',
        dataIndex: 'customer_name',
        key: 'customer_name',
      },
      {
        title: 'SĐT',
        dataIndex: 'phone',
        key: 'phone',
      },
      {
        title: 'Số đơn',
        dataIndex: 'total_orders',
        key: 'total_orders',
        align: 'center',
        sorter: (a, b) => a.total_orders - b.total_orders,
      },
      {
        title: 'Tổng chi tiêu',
        dataIndex: 'total_spent',
        key: 'total_spent',
        align: 'right',
        sorter: (a, b) => a.total_spent - b.total_spent,
        render: (value) => <strong style={{ color: '#52c41a' }}>{value?.toLocaleString()}đ</strong>,
      },
    ];
  }

  // Default columns
  return [
    ...baseColumns,
    {
      title: 'Dữ liệu',
      dataIndex: 'data',
      key: 'data',
    },
  ];
};

export default Reports;