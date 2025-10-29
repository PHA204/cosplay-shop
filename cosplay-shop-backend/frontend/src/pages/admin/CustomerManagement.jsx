// Path: frontend/src/pages/admin/CustomerManagement.jsx

import React, { useState, useEffect } from 'react';
import {
  Table, Tag, Space, Button, Input, Card, Row, Col,
  Modal, Form, message, Avatar, Popconfirm, Statistic,
  Descriptions, List, Badge, Tooltip, Select
} from 'antd';
import {
  UserOutlined, SearchOutlined, ReloadOutlined,
  ExportOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  ShoppingOutlined, DollarOutlined, CalendarOutlined,
  PhoneOutlined, MailOutlined, HomeOutlined, LockOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { TextArea } = Input;

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [filters, setFilters] = useState({
    search: '',
    sort_by: 'created_at',
    order: 'desc',
  });

  const [viewModal, setViewModal] = useState({
    visible: false,
    customer: null,
  });

  const [editModal, setEditModal] = useState({
    visible: false,
    customer: null,
  });

  const [resetPasswordModal, setResetPasswordModal] = useState({
    visible: false,
    customer: null,
  });

  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Fetch customers
  const fetchCustomers = async (page = pagination.current) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        ...filters,
      };

      const response = await api.get('/admin/users', { params });

      setCustomers(response.data.data);
      setPagination({
        ...pagination,
        current: page,
        total: response.data.total,
      });
    } catch (error) {
      message.error('Không thể tải danh sách khách hàng');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/users/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchStatistics();
  }, []);

  // Open view modal
  const openViewModal = async (customer) => {
    try {
      const response = await api.get(`/admin/users/${customer.id}`);
      setViewModal({
        visible: true,
        customer: response.data,
      });
    } catch (error) {
      message.error('Không thể tải thông tin khách hàng');
    }
  };

  // Open edit modal
  const openEditModal = (customer) => {
    form.setFieldsValue({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });
    setEditModal({
      visible: true,
      customer,
    });
  };

  // Update customer
  const handleUpdate = async (values) => {
    try {
      await api.put(`/admin/users/${editModal.customer.id}`, values);
      message.success('Cập nhật khách hàng thành công!');
      setEditModal({ visible: false, customer: null });
      form.resetFields();
      fetchCustomers();
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  // Open reset password modal
  const openResetPasswordModal = (customer) => {
    passwordForm.resetFields();
    setResetPasswordModal({
      visible: true,
      customer,
    });
  };

  // Reset password
  const handleResetPassword = async (values) => {
    try {
      await api.post(`/admin/users/${resetPasswordModal.customer.id}/reset-password`, {
        new_password: values.new_password,
      });
      message.success('Đặt lại mật khẩu thành công!');
      setResetPasswordModal({ visible: false, customer: null });
      passwordForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  // Delete customer
  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      message.success('Xóa khách hàng thành công!');
      fetchCustomers();
      fetchStatistics();
    } catch (error) {
      message.error(error.response?.data?.error || 'Không thể xóa khách hàng');
    }
  };

  // Export customers
  const handleExport = async () => {
    try {
      const response = await api.get('/admin/users/export', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Xuất file thành công!');
    } catch (error) {
      message.error('Không thể xuất file');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 250,
      fixed: 'left',
      render: (_, record) => (
        <Space>
          <Avatar 
            size={48} 
            src={record.avatar_url || undefined}
            icon={!record.avatar_url && <UserOutlined />}
            style={!record.avatar_url ? { backgroundColor: '#1890ff' } : {}}
          />
          <div>
            <div><strong>{record.name}</strong></div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <div>
          {record.phone && (
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.phone}
            </div>
          )}
          {record.address && (
            <div style={{ fontSize: 12, color: '#999' }}>
              <HomeOutlined style={{ marginRight: 4 }} />
              {record.address.length > 30 
                ? record.address.substring(0, 30) + '...' 
                : record.address}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Thống kê',
      key: 'stats',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <ShoppingOutlined style={{ marginRight: 4, color: '#1890ff' }} />
            <strong>{record.total_orders || 0}</strong> đơn hàng
          </div>
          <div style={{ fontSize: 12, color: '#52c41a' }}>
            <DollarOutlined style={{ marginRight: 4 }} />
            {(record.total_spent || 0).toLocaleString()}đ
          </div>
        </div>
      ),
    },
    {
      title: 'Đơn hàng cuối',
      dataIndex: 'last_order_date',
      key: 'last_order_date',
      width: 150,
      render: (date) => date ? (
        <div style={{ fontSize: 12 }}>
          <CalendarOutlined style={{ marginRight: 4 }} />
          {new Date(date).toLocaleDateString('vi-VN')}
        </div>
      ) : (
        <Tag>Chưa có đơn</Tag>
      ),
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => (
        <div style={{ fontSize: 12 }}>
          {new Date(date).toLocaleDateString('vi-VN')}
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => openViewModal(record)}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="Sửa thông tin">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              size="small"
            />
          </Tooltip>

          <Tooltip title="Đặt lại mật khẩu">
            <Button
              type="link"
              icon={<LockOutlined />}
              onClick={() => openResetPasswordModal(record)}
              size="small"
              style={{ color: '#fa8c16' }}
            />
          </Tooltip>

          <Popconfirm
            title="Bạn có chắc muốn xóa khách hàng này?"
            description="Khách hàng có đơn hàng đang hoạt động sẽ không thể xóa."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Statistics Cards */}
      {statistics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng khách hàng"
                value={statistics.total_users}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Khách hàng mới (tháng này)"
                value={statistics.new_this_month}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Có đơn hàng"
                value={statistics.users_with_orders}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tỷ lệ chuyển đổi"
                value={statistics.total_users > 0 
                  ? ((statistics.users_with_orders / statistics.total_users) * 100).toFixed(1)
                  : 0
                }
                suffix="%"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>
            👥 Quản lý khách hàng
          </h2>
          <Space>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
            >
              Xuất Excel
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm theo tên, email, số điện thoại..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onPressEnter={() => fetchCustomers(1)}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Sắp xếp"
              value={`${filters.sort_by}-${filters.order}`}
              onChange={(value) => {
                const [sort_by, order] = value.split('-');
                setFilters({ ...filters, sort_by, order });
              }}
              style={{ width: '100%' }}
            >
              <Select.Option value="created_at-desc">Mới nhất</Select.Option>
              <Select.Option value="created_at-asc">Cũ nhất</Select.Option>
              <Select.Option value="name-asc">Tên A-Z</Select.Option>
              <Select.Option value="name-desc">Tên Z-A</Select.Option>
              <Select.Option value="total_orders-desc">Nhiều đơn nhất</Select.Option>
              <Select.Option value="total_spent-desc">Chi tiêu cao nhất</Select.Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => fetchCustomers(1)}
              >
                Tìm
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setFilters({
                    search: '',
                    sort_by: 'created_at',
                    order: 'desc',
                  });
                  setTimeout(() => fetchCustomers(1), 100);
                }}
              />
            </Space>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} khách hàng`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={(newPagination) => {
            setPagination({
              ...pagination,
              current: newPagination.current,
              pageSize: newPagination.pageSize,
            });
            fetchCustomers(newPagination.current);
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* View Modal */}
      <Modal
        title={<><EyeOutlined /> Chi tiết khách hàng</>}
        open={viewModal.visible}
        onCancel={() => setViewModal({ visible: false, customer: null })}
        width={900}
        footer={[
          <Button key="close" onClick={() => setViewModal({ visible: false, customer: null })}>
            Đóng
          </Button>
        ]}
      >
        {viewModal.customer && <CustomerDetailView customer={viewModal.customer} />}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={<><EditOutlined /> Chỉnh sửa thông tin khách hàng</>}
        open={editModal.visible}
        onCancel={() => {
          setEditModal({ visible: false, customer: null });
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            label="Họ tên"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="example@email.com" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
          >
            <Input prefix={<PhoneOutlined />} placeholder="0912345678" />
          </Form.Item>

          <Form.Item
            label="Địa chỉ"
            name="address"
          >
            <TextArea rows={3} placeholder="Nhập địa chỉ..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" size="large">
                Cập nhật
              </Button>
              <Button
                size="large"
                onClick={() => {
                  setEditModal({ visible: false, customer: null });
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        title={<><LockOutlined /> Đặt lại mật khẩu</>}
        open={resetPasswordModal.visible}
        onCancel={() => {
          setResetPasswordModal({ visible: false, customer: null });
          passwordForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <p style={{ marginBottom: 16, color: '#666' }}>
          Đặt lại mật khẩu cho khách hàng:{' '}
          <strong>{resetPasswordModal.customer?.name}</strong>
        </p>
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleResetPassword}
        >
          <Form.Item
            label="Mật khẩu mới"
            name="new_password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirm_password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu không khớp'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" size="large" danger>
                Đặt lại mật khẩu
              </Button>
              <Button
                size="large"
                onClick={() => {
                  setResetPasswordModal({ visible: false, customer: null });
                  passwordForm.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Customer Detail View Component
const CustomerDetailView = ({ customer }) => {
  return (
    <div>
      <Row gutter={24}>
        <Col span={8}>
          <div style={{ textAlign: 'center' }}>
            <Avatar 
              size={120} 
              src={customer.avatar_url || undefined}
              icon={!customer.avatar_url && <UserOutlined />}
              style={!customer.avatar_url ? { 
                backgroundColor: '#1890ff',
                fontSize: 48
              } : {}}
            />
            <h3 style={{ marginTop: 16, marginBottom: 8 }}>{customer.name}</h3>
            <Tag color="blue" icon={<MailOutlined />}>{customer.email}</Tag>
          </div>

          <div style={{ marginTop: 24 }}>
            <Statistic
              title="Tổng chi tiêu"
              value={customer.total_spent || 0}
              suffix="đ"
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
              prefix={<DollarOutlined />}
            />
          </div>
        </Col>

        <Col span={16}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Email">
              <MailOutlined style={{ marginRight: 8 }} />
              {customer.email}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              <PhoneOutlined style={{ marginRight: 8 }} />
              {customer.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              <HomeOutlined style={{ marginRight: 8 }} />
              {customer.address || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tham gia">
              <CalendarOutlined style={{ marginRight: 8 }} />
              {new Date(customer.created_at).toLocaleString('vi-VN')}
            </Descriptions.Item>
          </Descriptions>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Tổng đơn hàng"
                  value={customer.total_orders || 0}
                  prefix={<ShoppingOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Hoàn thành"
                  value={customer.completed_orders || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Đã hủy"
                  value={customer.cancelled_orders || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Recent Orders */}
      {customer.recent_orders && customer.recent_orders.length > 0 && (
        <>
          <h4 style={{ marginTop: 24, marginBottom: 16 }}>
            📦 Đơn hàng gần đây
          </h4>
          <List
            size="small"
            bordered
            dataSource={customer.recent_orders}
            renderItem={(order) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <strong>{order.order_number}</strong>
                      <OrderStatusTag status={order.status} />
                      <PaymentStatusTag status={order.payment_status} />
                    </Space>
                  }
                  description={
                    <Space split="|">
                      <span>
                        {new Date(order.rental_start_date).toLocaleDateString('vi-VN')} 
                        {' → '}
                        {new Date(order.rental_end_date).toLocaleDateString('vi-VN')}
                      </span>
                      <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                        {order.total_amount.toLocaleString()}đ
                      </span>
                      <span style={{ fontSize: 12, color: '#999' }}>
                        {new Date(order.created_at).toLocaleString('vi-VN')}
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </>
      )}
    </div>
  );
};

// Order Status Tag
const OrderStatusTag = ({ status }) => {
  const statusConfig = {
    pending: { color: 'default', text: 'Chờ xác nhận' },
    confirmed: { color: 'blue', text: 'Đã xác nhận' },
    preparing: { color: 'cyan', text: 'Đang chuẩn bị' },
    delivering: { color: 'geekblue', text: 'Đang giao' },
    rented: { color: 'green', text: 'Đang thuê' },
    returning: { color: 'orange', text: 'Đang trả' },
    completed: { color: 'success', text: 'Hoàn thành' },
    cancelled: { color: 'error', text: 'Đã hủy' },
  };

  const config = statusConfig[status] || { color: 'default', text: status };
  return <Tag color={config.color}>{config.text}</Tag>;
};

// Payment Status Tag
const PaymentStatusTag = ({ status }) => {
  const statusConfig = {
    pending: { color: 'warning', text: 'Chờ thanh toán' },
    deposit_paid: { color: 'processing', text: 'Đã đặt cọc' },
    paid: { color: 'success', text: 'Đã thanh toán' },
    refunded: { color: 'default', text: 'Đã hoàn tiền' },
  };

  const config = statusConfig[status] || { color: 'default', text: status };
  return <Tag color={config.color}>{config.text}</Tag>;
};

export default CustomerManagement;