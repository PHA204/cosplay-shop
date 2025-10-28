// Path: frontend/src/pages/admin/OrderManagement.jsx
// Mô tả: Trang quản lý đơn hàng với bảng, filter, và các modal

import React, { useState, useEffect } from 'react';
import {
  Table, Tag, Space, Button, Input, Select, DatePicker,
  Modal, Descriptions, Card, Row, Col, Statistic,
  Image, Divider, Form, InputNumber, message, Popconfirm
} from 'antd';
import {
  EyeOutlined, SearchOutlined, ReloadOutlined,
  CheckOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    search: '',
    start_date: null,
    end_date: null,
  });

  const [detailModal, setDetailModal] = useState({
    visible: false,
    order: null,
  });

  const [returnModal, setReturnModal] = useState({
    visible: false,
    order: null,
  });

  const [returnForm] = Form.useForm();

  // Fetch orders
  const fetchOrders = async (page = pagination.current) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        ...filters,
      };

      const response = await api.get('/admin/orders', { params });

      setOrders(response.data.data);
      setPagination({
        ...pagination,
        current: page,
        total: response.data.total,
      });
    } catch (error) {
      message.error('Không thể tải danh sách đơn hàng');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // View order detail
  const viewDetail = async (orderId) => {
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      setDetailModal({
        visible: true,
        order: response.data,
      });
    } catch (error) {
      message.error('Không thể xem chi tiết đơn hàng');
    }
  };

  // Update order status
    const updateStatus = async (orderId, newStatus, paymentStatus = null) => {
      try {
        const payload = { status: newStatus };
        
        // Nếu có payment_status thì thêm vào
        if (paymentStatus) {
          payload.payment_status = paymentStatus;
        }

        await api.put(`/admin/orders/${orderId}/status`, payload);
        message.success('Cập nhật trạng thái thành công!');
        fetchOrders();
        if (detailModal.order?.id === orderId) {
          viewDetail(orderId);
        }
      } catch (error) {
        message.error(error.response?.data?.error || 'Không thể cập nhật trạng thái');
      }
    };
    const updatePaymentStatus = async (orderId, paymentStatus) => {
      try {
        await api.put(`/admin/orders/${orderId}/payment`, { 
          payment_status: paymentStatus 
        });
        message.success('Cập nhật trạng thái thanh toán thành công!');
        fetchOrders();
        if (detailModal.order?.id === orderId) {
          viewDetail(orderId);
        }
      } catch (error) {
        message.error(error.response?.data?.error || 'Không thể cập nhật');
      }
    };
  // Open return modal
  const openReturnModal = async (orderId) => {
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      setReturnModal({
        visible: true,
        order: response.data,
      });
      returnForm.setFieldsValue({
        actual_return_date: dayjs(),
        items: response.data.items?.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          condition: 'good',
          damage_fee: 0,
        }))
      });
    } catch (error) {
      message.error('Không thể tải thông tin đơn hàng');
    }
  };

  // Process return
  const processReturn = async (values) => {
    try {
      const response = await api.post(
        `/admin/orders/${returnModal.order.id}/return`,
        {
          actual_return_date: values.actual_return_date.format('YYYY-MM-DD'),
          items_condition: values.items.map(item => ({
            product_id: item.product_id,
            condition: item.condition,
            notes: item.notes,
            damage_fee: item.damage_fee || 0,
          })),
          notes: values.notes,
        }
      );

      message.success('Xử lý trả hàng thành công!');
      Modal.info({
        title: 'Kết quả xử lý',
        content: (
          <div>
            <p><strong>Phí trễ hạn:</strong> {response.data.late_fee.toLocaleString()}đ</p>
            <p><strong>Phí hư hỏng:</strong> {response.data.damage_fee.toLocaleString()}đ</p>
            <p><strong>Số tiền hoàn trả:</strong> {response.data.refund_amount.toLocaleString()}đ</p>
          </div>
        ),
      });
      
      setReturnModal({ visible: false, order: null });
      returnForm.resetFields();
      fetchOrders();
    } catch (error) {
      message.error(error.response?.data?.error || 'Không thể xử lý trả hàng');
    }
  };

  // Cancel order
  const handleCancelOrder = (orderId) => {
    let cancelReason = '';
    
    Modal.confirm({
      title: 'Hủy đơn hàng',
      content: (
        <div>
          <p>Bạn có chắc chắn muốn hủy đơn hàng này?</p>
          <TextArea
            placeholder="Lý do hủy đơn (bắt buộc)"
            rows={3}
            onChange={(e) => cancelReason = e.target.value}
          />
        </div>
      ),
      onOk: async () => {
        if (!cancelReason.trim()) {
          message.error('Vui lòng nhập lý do hủy');
          return Promise.reject();
        }

        try {
          await api.post(`/admin/orders/${orderId}/cancel`, { reason: cancelReason });
          message.success('Hủy đơn hàng thành công!');
          fetchOrders();
        } catch (error) {
          message.error(error.response?.data?.error || 'Không thể hủy đơn hàng');
          return Promise.reject();
        }
      },
    });
  };

  // Status configuration
  const statusColors = {
    pending: 'gold',
    confirmed: 'blue',
    preparing: 'purple',
    delivering: 'cyan',
    rented: 'green',
    returning: 'orange',
    completed: 'default',
    cancelled: 'red',
  };

  const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    preparing: 'Đang chuẩn bị',
    delivering: 'Đang giao',
    rented: 'Đang thuê',
    returning: 'Đang trả',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  const getNextStatusOptions = (currentStatus) => {
    const statusFlow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['delivering'],
      delivering: ['rented'],
      rented: ['returning', 'completed'],
      returning: ['completed'],
    };
    return statusFlow[currentStatus] || [];
  };

  // Table columns
  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_number',
      key: 'order_number',
      fixed: 'left',
      width: 150,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 200,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.customer_phone}</div>
        </div>
      ),
    },
    {
      title: 'Ngày thuê',
      key: 'rental_dates',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{dayjs(record.rental_start_date).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            → {dayjs(record.rental_end_date).format('DD/MM/YYYY')}
          </div>
          <Tag color="blue" size="small">{record.rental_days} ngày</Tag>
        </div>
      ),
    },
    {
      title: 'SL',
      dataIndex: 'items_count',
      key: 'items_count',
      width: 60,
      align: 'center',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 130,
      align: 'right',
      render: (amount) => <strong>{amount.toLocaleString()}đ</strong>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'paid' ? 'success' : 'warning'}>
          {status === 'paid' ? 'Đã TT' : 'Chưa TT'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewDetail(record.id)}
            size="small"
          >
            Chi tiết
          </Button>
          
          {record.status === 'rented' && (
            <Button
              type="primary"
              size="small"
              onClick={() => openReturnModal(record.id)}
            >
              Xử lý trả
            </Button>
          )}

          {['pending', 'confirmed'].includes(record.status) && (
            <Button 
              type="link" 
              danger 
              size="small"
              onClick={() => handleCancelOrder(record.id)}
            >
              Hủy
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <h2 style={{ marginBottom: 24 }}>
          📦 Quản lý đơn hàng
        </h2>

        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Tìm mã đơn, khách hàng..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onPressEnter={() => fetchOrders(1)}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Trạng thái"
              value={filters.status || undefined}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: '100%' }}
              allowClear
            >
              {Object.keys(statusLabels).map(key => (
                <Option key={key} value={key}>
                  <Tag color={statusColors[key]}>{statusLabels[key]}</Tag>
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Thanh toán"
              value={filters.payment_status || undefined}
              onChange={(value) => setFilters({ ...filters, payment_status: value })}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="paid">Đã thanh toán</Option>
              <Option value="unpaid">Chưa thanh toán</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Từ ngày', 'Đến ngày']}
              format="DD/MM/YYYY"
              onChange={(dates) => {
                setFilters({
                  ...filters,
                  start_date: dates ? dates[0].format('YYYY-MM-DD') : null,
                  end_date: dates ? dates[1].format('YYYY-MM-DD') : null,
                });
              }}
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => fetchOrders(1)}
              >
                Tìm kiếm
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setFilters({
                    status: '',
                    payment_status: '',
                    search: '',
                    start_date: null,
                    end_date: null,
                  });
                  setTimeout(() => fetchOrders(1), 100);
                }}
              />
            </Space>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đơn hàng`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={(newPagination) => {
            setPagination({
              ...pagination,
              current: newPagination.current,
              pageSize: newPagination.pageSize,
            });
            fetchOrders(newPagination.current);
          }}
          scroll={{ x: 1500 }}
          size="middle"
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết đơn hàng - ${detailModal.order?.order_number}`}
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, order: null })}
        width={900}
        footer={null}
      >
        {detailModal.order && (
          <div>
            {/* Customer Info */}
            <Card title="👤 Thông tin khách hàng" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Tên">
                  {detailModal.order.customer_name}
                </Descriptions.Item>
                <Descriptions.Item label="SĐT">
                  {detailModal.order.customer_phone}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {detailModal.order.customer_email}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ giao hàng" span={2}>
                  {detailModal.order.shipping_address}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Order Info */}
            <Card title="📋 Thông tin đơn hàng" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Ngày thuê">
                  {dayjs(detailModal.order.rental_start_date).format('DD/MM/YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày trả">
                  {dayjs(detailModal.order.rental_end_date).format('DD/MM/YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Số ngày thuê">
                  <Tag color="blue">{detailModal.order.rental_days} ngày</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={statusColors[detailModal.order.status]}>
                    {statusLabels[detailModal.order.status]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Phương thức giao">
                  {detailModal.order.delivery_method}
                </Descriptions.Item>
                <Descriptions.Item label="Thanh toán">
                  {detailModal.order.payment_method}
                </Descriptions.Item>
              </Descriptions>
             
              <Card title="💰 Thanh toán" size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Trạng thái thanh toán"
                      value={
                        detailModal.order.payment_status === 'paid' ? 'Đã thanh toán' :
                        detailModal.order.payment_status === 'unpaid' ? 'Chưa thanh toán' :
                        'Đã hoàn tiền'
                      }
                      valueStyle={{ 
                        color: 
                          detailModal.order.payment_status === 'paid' ? '#52c41a' :
                          detailModal.order.payment_status === 'unpaid' ? '#fa8c16' :
                          '#1890ff'
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Tổng tiền"
                      value={detailModal.order.total_amount}
                      suffix="đ"
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Col>
                </Row>

                {/* Button cập nhật payment status */}
                {detailModal.order.payment_status === 'unpaid' && 
                detailModal.order.status !== 'cancelled' && (
                  <div style={{ marginTop: 16 }}>
                    <Popconfirm
                      title="Xác nhận khách hàng đã thanh toán?"
                      description={
                        <div>
                          <p>Tổng tiền: <strong>{detailModal.order.total_amount.toLocaleString()}đ</strong></p>
                          <p style={{ fontSize: 12, color: '#999' }}>
                            Phương thức: {detailModal.order.payment_method}
                          </p>
                        </div>
                      }
                      onConfirm={() => updatePaymentStatus(detailModal.order.id, 'paid')}
                      okText="Đã thanh toán"
                      cancelText="Hủy"
                    >
                      <Button type="primary" icon={<CheckOutlined />}>
                        Xác nhận đã thanh toán
                      </Button>
                    </Popconfirm>
                  </div>
                )}

                {detailModal.order.payment_status === 'paid' && (
                  <div style={{ marginTop: 16 }}>
                    <Tag color="success" icon={<CheckOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>
                      ✅ Đã thanh toán đầy đủ
                    </Tag>
                  </div>
                )}
              </Card>
              {/* Status Actions */}
              {getNextStatusOptions(detailModal.order.status).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <strong>Chuyển trạng thái: </strong>
                  <Space style={{ marginTop: 8 }} wrap>
                    {getNextStatusOptions(detailModal.order.status).map(status => {
                      // Nếu chuyển sang 'rented' và chưa thanh toán
                      if (status === 'rented' && detailModal.order.payment_status === 'unpaid') {
                        return (
                          <Button
                            key={status}
                            type="primary"
                            onClick={() => {
                              // Show modal hỏi đã thanh toán chưa
                              Modal.confirm({
                                title: '💵 Xác nhận thanh toán',
                                content: (
                                  <div>
                                    <p><strong>Khách hàng đã thanh toán chưa?</strong></p>
                                    <p style={{ color: '#666', fontSize: 14 }}>
                                      Tổng tiền: <strong style={{ color: '#1890ff' }}>
                                        {detailModal.order.total_amount.toLocaleString()}đ
                                      </strong>
                                    </p>
                                    <p style={{ color: '#999', fontSize: 12 }}>
                                      • Tiền thuê: {detailModal.order.subtotal.toLocaleString()}đ<br/>
                                      • Tiền cọc: {detailModal.order.deposit_total.toLocaleString()}đ
                                    </p>
                                  </div>
                                ),
                                okText: '✅ Đã thanh toán',
                                cancelText: '⏳ Chưa thanh toán',
                                onOk: () => {
                                  // Cập nhật cả status và payment_status
                                  updateStatus(detailModal.order.id, 'rented', 'paid');
                                  setDetailModal({ visible: false, order: null });
                                },
                                onCancel: () => {
                                  // Chỉ cập nhật status, payment_status vẫn là 'unpaid'
                                  updateStatus(detailModal.order.id, 'rented');
                                  setDetailModal({ visible: false, order: null });
                                  message.warning('Đơn hàng chuyển sang "Đang thuê" nhưng chưa thanh toán');
                                },
                              });
                            }}
                          >
                            {statusLabels[status]}
                          </Button>
                        );
                        
                      }
                      
                      // Các trạng thái khác giữ nguyên
                      return (
                        <Popconfirm
                          key={status}
                          title={`Xác nhận chuyển sang "${statusLabels[status]}"?`}
                          onConfirm={() => {
                            updateStatus(detailModal.order.id, status);
                            setDetailModal({ visible: false, order: null });
                          }}
                        >
                          <Button
                            type={status === 'cancelled' ? 'default' : 'primary'}
                            danger={status === 'cancelled'}
                            size="small"
                          >
                            {statusLabels[status]}
                          </Button>
                        </Popconfirm>
                      );
                    })}
                  </Space>
                </div>
              )}
            </Card>

            {/* Order Items */}
            <Card title="🛍️ Sản phẩm" size="small" style={{ marginBottom: 16 }}>
              <Table
                dataSource={detailModal.order.items}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Hình',
                    dataIndex: 'images',
                    width: 80,
                    render: (images) => (
                      <Image
                        src={images?.[0] || '/placeholder.png'}
                        width={50}
                        height={50}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        fallback="/placeholder.png"
                      />
                    ),
                  },
                  {
                    title: 'Tên sản phẩm',
                    dataIndex: 'product_name',
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
                    title: 'SL',
                    dataIndex: 'quantity',
                    width: 60,
                    align: 'center',
                  },
                  {
                    title: 'Giá/ngày',
                    dataIndex: 'daily_price',
                    width: 100,
                    align: 'right',
                    render: (price) => `${price.toLocaleString()}đ`,
                  },
                  {
                    title: 'Cọc',
                    dataIndex: 'deposit_amount',
                    width: 100,
                    align: 'right',
                    render: (amount) => `${amount.toLocaleString()}đ`,
                  },
                  {
                    title: 'Thành tiền',
                    dataIndex: 'subtotal',
                    width: 120,
                    align: 'right',
                    render: (amount) => <strong>{amount.toLocaleString()}đ</strong>,
                  },
                  {
                    title: 'Tình trạng trả',
                    dataIndex: 'return_condition',
                    width: 120,
                    render: (condition) => condition ? (
                      <Tag color={condition === 'good' ? 'success' : 'error'}>
                        {condition}
                      </Tag>
                    ) : '-',
                  },
                ]}
              />
            </Card>

            {/* Financial Summary */}
            <Card title="💰 Tổng kết tài chính" size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Tổng tiền thuê"
                    value={detailModal.order.subtotal}
                    suffix="đ"
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Tiền cọc"
                    value={detailModal.order.deposit_total}
                    suffix="đ"
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Phí trễ"
                    value={detailModal.order.late_fee}
                    suffix="đ"
                    valueStyle={{ fontSize: 18, color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Phí hư hỏng"
                    value={detailModal.order.damage_fee}
                    suffix="đ"
                    valueStyle={{ fontSize: 18, color: '#ff4d4f' }}
                  />
                </Col>
              </Row>
              <Divider />
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Tổng thanh toán"
                    value={detailModal.order.total_amount}
                    suffix="đ"
                    valueStyle={{ fontSize: 20, color: '#1890ff', fontWeight: 'bold' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Số tiền hoàn trả"
                    value={detailModal.order.refund_amount}
                    suffix="đ"
                    valueStyle={{ fontSize: 20, color: '#52c41a', fontWeight: 'bold' }}
                  />
                </Col>
              </Row>

              {detailModal.order.notes && (
                <>
                  <Divider />
                  <div>
                    <strong>Ghi chú:</strong>
                    <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                      {detailModal.order.notes}
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </Modal>

      {/* Return Processing Modal */}
      <Modal
        title="📦 Xử lý trả hàng"
        open={returnModal.visible}
        onCancel={() => {
          setReturnModal({ visible: false, order: null });
          returnForm.resetFields();
        }}
        width={800}
        footer={null}
      >
        {returnModal.order && (
          <Form
            form={returnForm}
            layout="vertical"
            onFinish={processReturn}
          >
            <Form.Item
              label="Ngày trả thực tế"
              name="actual_return_date"
              rules={[{ required: true, message: 'Vui lòng chọn ngày trả' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
              />
            </Form.Item>

            <Divider>Kiểm tra sản phẩm</Divider>

            <Form.List name="items">
              {(fields) => (
                <>
                  {fields.map((field) => (
                    <Card key={field.key} size="small" style={{ marginBottom: 16 }}>
                      <Form.Item noStyle shouldUpdate>
                        {() => {
                          const item = returnForm.getFieldValue(['items', field.name]);
                          return (
                            <div style={{ marginBottom: 12 }}>
                              <strong>{item?.product_name}</strong>
                            </div>
                          );
                        }}
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...field}
                            label="Tình trạng"
                            name={[field.name, 'condition']}
                            rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                          >
                            <Select>
                              <Option value="good">
                                <Tag color="success">Tốt</Tag>
                              </Option>
                              <Option value="normal">
                                <Tag color="processing">Bình thường</Tag>
                              </Option>
                              <Option value="damaged">
                                <Tag color="warning">Hư hỏng nhẹ</Tag>
                              </Option>
                              <Option value="broken">
                                <Tag color="error">Hư hỏng nặng</Tag>
                              </Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            {...field}
                            label="Phí hư hỏng (đ)"
                            name={[field.name, 'damage_fee']}
                          >
                            <InputNumber
                              style={{ width: '100%' }}
                              min={0}
                              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              parser={value => value.replace(/\$\s?|(,*)/g, '')}
                              placeholder="0"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        {...field}
                        label="Ghi chú"
                        name={[field.name, 'notes']}
                      >
                        <TextArea rows={2} placeholder="Mô tả tình trạng chi tiết..." />
                      </Form.Item>
                    </Card>
                  ))}
                </>
              )}
            </Form.List>

            <Form.Item
              label="Ghi chú đơn hàng"
              name="notes"
            >
              <TextArea rows={3} placeholder="Ghi chú chung về quá trình trả hàng..." />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large"
                  icon={<CheckOutlined />}
                >
                  Xác nhận trả hàng
                </Button>
                <Button 
                  size="large"
                  onClick={() => {
                    setReturnModal({ visible: false, order: null });
                    returnForm.resetFields();
                  }}
                >
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default OrderManagement;