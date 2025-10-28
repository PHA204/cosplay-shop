// Path: frontend/src/pages/admin/ProductManagement.jsx

import React, { useState, useEffect } from 'react';
import {
  Table, Tag, Space, Button, Input, Select, Card, Row, Col,
  Modal, Form, InputNumber, message, Image, Upload, Popconfirm,
  Divider, Checkbox, Tooltip
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  ReloadOutlined, UploadOutlined, ExportOutlined, EyeOutlined,
  CopyOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Option } = Select;
const { TextArea } = Input;

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    condition: '',
    sort_by: 'created_at',
    order: 'desc',
  });

  const [editModal, setEditModal] = useState({
    visible: false,
    mode: 'create', // 'create' | 'edit' | 'view'
    product: null,
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkModal, setBulkModal] = useState(false);

  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  // Fetch products
  const fetchProducts = async (page = pagination.current) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        ...filters,
      };

      const response = await api.get('/admin/products', { params });

      setProducts(response.data.data);
      setPagination({
        ...pagination,
        current: page,
        total: response.data.total,
      });
    } catch (error) {
      message.error('Không thể tải danh sách sản phẩm');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories/all');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Open create modal
  const openCreateModal = () => {
    form.resetFields();
    setEditModal({
      visible: true,
      mode: 'create',
      product: null,
    });
  };

  // Open edit modal
  const openEditModal = (product) => {
    form.setFieldsValue({
      ...product,
      images: product.images || [],
    });
    setEditModal({
      visible: true,
      mode: 'edit',
      product,
    });
  };

  // Open view modal
  const openViewModal = (product) => {
    setEditModal({
      visible: true,
      mode: 'view',
      product,
    });
  };

  // Create/Update product
  const handleSubmit = async (values) => {
    try {
      const productData = {
        ...values,
        images: values.images || [],
      };

      if (editModal.mode === 'create') {
        await api.post('/admin/products', productData);
        message.success('Tạo sản phẩm thành công!');
      } else {
        await api.put(`/admin/products/${editModal.product.id}`, productData);
        message.success('Cập nhật sản phẩm thành công!');
      }

      setEditModal({ visible: false, mode: 'create', product: null });
      form.resetFields();
      fetchProducts();
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/products/${id}`);
      message.success('Xóa sản phẩm thành công!');
      fetchProducts();
    } catch (error) {
      message.error(error.response?.data?.error || 'Không thể xóa sản phẩm');
    }
  };

  // Duplicate product
  const handleDuplicate = (product) => {
    form.setFieldsValue({
      ...product,
      name: `${product.name} (Copy)`,
      images: product.images || [],
    });
    setEditModal({
      visible: true,
      mode: 'create',
      product: null,
    });
  };

  // Bulk update
  const handleBulkUpdate = async (values) => {
    try {
      const updates = {};
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
          updates[key] = values[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        message.warning('Vui lòng chọn ít nhất một trường để cập nhật');
        return;
      }

      await api.post('/admin/products/bulk-update', {
        product_ids: selectedRowKeys,
        updates,
      });

      message.success(`Cập nhật ${selectedRowKeys.length} sản phẩm thành công!`);
      setBulkModal(false);
      bulkForm.resetFields();
      setSelectedRowKeys([]);
      fetchProducts();
    } catch (error) {
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  // Export products
  const handleExport = async () => {
    try {
      const response = await api.get('/admin/products/export', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Xuất file thành công!');
    } catch (error) {
      message.error('Không thể xuất file');
    }
  };

  // Condition colors
  const conditionColors = {
    new: 'success',
    good: 'processing',
    normal: 'default',
    damaged: 'warning',
    broken: 'error',
  };

  const conditionLabels = {
    new: 'Mới',
    good: 'Tốt',
    normal: 'Bình thường',
    damaged: 'Hư hỏng nhẹ',
    broken: 'Hư hỏng nặng',
  };

  // Table columns
  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'images',
      key: 'images',
      width: 100,
      render: (images) => (
        <Image
          src={images?.[0] || '/placeholder.png'}
          width={60}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 8 }}
          fallback="/placeholder.png"
        />
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          {record.character_name && (
            <div style={{ fontSize: 12, color: '#999' }}>
              {record.character_name}
            </div>
          )}
          <Tag size="small" style={{ marginTop: 4 }}>
            {record.category_name || 'N/A'}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Giá thuê',
      key: 'prices',
      width: 150,
      render: (_, record) => (
        <div>
          <div><strong>{record.daily_price.toLocaleString()}đ</strong>/ngày</div>
          {record.weekly_price && (
            <div style={{ fontSize: 12, color: '#999' }}>
              {record.weekly_price.toLocaleString()}đ/tuần
            </div>
          )}
          <div style={{ fontSize: 12, color: '#1890ff', marginTop: 4 }}>
            Cọc: {record.deposit_amount.toLocaleString()}đ
          </div>
        </div>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 80,
      render: (size) => size ? <Tag>{size}</Tag> : '-',
    },
    {
      title: 'Tình trạng',
      dataIndex: 'condition',
      key: 'condition',
      width: 120,
      render: (condition) => (
        <Tag color={conditionColors[condition]}>
          {conditionLabels[condition] || condition}
        </Tag>
      ),
    },
    {
      title: 'Tồn kho',
      key: 'quantity',
      width: 120,
      render: (_, record) => (
        <div>
          <div>
            <strong style={{ color: record.available_quantity === 0 ? '#ff4d4f' : '#52c41a' }}>
              {record.available_quantity}
            </strong>
            /{record.total_quantity}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.available_quantity === 0 ? 'Hết hàng' : 'Còn hàng'}
          </div>
        </div>
      ),
    },
    {
      title: 'Thống kê',
      key: 'stats',
      width: 120,
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div>Thuê: <strong>{record.total_rentals || 0}</strong> lần</div>
          <div style={{ color: '#52c41a' }}>
            DT: {(record.total_revenue || 0).toLocaleString()}đ
          </div>
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
          
          <Tooltip title="Sửa">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              size="small"
            />
          </Tooltip>

          <Tooltip title="Nhân bản">
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={() => handleDuplicate(record)}
              size="small"
            />
          </Tooltip>

          <Popconfirm
            title="Bạn có chắc muốn xóa sản phẩm này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>
            📦 Quản lý sản phẩm
          </h2>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Thêm sản phẩm
            </Button>
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
              placeholder="Tìm theo tên, nhân vật..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onPressEnter={() => fetchProducts(1)}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Danh mục"
              value={filters.category_id || undefined}
              onChange={(value) => setFilters({ ...filters, category_id: value })}
              style={{ width: '100%' }}
              allowClear
            >
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Tình trạng"
              value={filters.condition || undefined}
              onChange={(value) => setFilters({ ...filters, condition: value })}
              style={{ width: '100%' }}
              allowClear
            >
              {Object.keys(conditionLabels).map(key => (
                <Option key={key} value={key}>
                  <Tag color={conditionColors[key]}>{conditionLabels[key]}</Tag>
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Sắp xếp"
              value={`${filters.sort_by}-${filters.order}`}
              onChange={(value) => {
                const [sort_by, order] = value.split('-');
                setFilters({ ...filters, sort_by, order });
              }}
              style={{ width: '100%' }}
            >
              <Option value="created_at-desc">Mới nhất</Option>
              <Option value="created_at-asc">Cũ nhất</Option>
              <Option value="name-asc">Tên A-Z</Option>
              <Option value="name-desc">Tên Z-A</Option>
              <Option value="daily_price-asc">Giá thấp → cao</Option>
              <Option value="daily_price-desc">Giá cao → thấp</Option>
              <Option value="available_quantity-asc">Tồn kho thấp</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={3}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => fetchProducts(1)}
              >
                Tìm
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setFilters({
                    search: '',
                    category_id: '',
                    condition: '',
                    sort_by: 'created_at',
                    order: 'desc',
                  });
                  setTimeout(() => fetchProducts(1), 100);
                }}
              />
            </Space>
          </Col>
        </Row>

        {/* Bulk actions */}
        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
            <Space>
              <span>Đã chọn <strong>{selectedRowKeys.length}</strong> sản phẩm</span>
              <Button
                size="small"
                onClick={() => setBulkModal(true)}
              >
                Cập nhật hàng loạt
              </Button>
              <Button
                size="small"
                onClick={() => setSelectedRowKeys([])}
              >
                Bỏ chọn
              </Button>
            </Space>
          </div>
        )}

        {/* Table */}
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={(newPagination) => {
            setPagination({
              ...pagination,
              current: newPagination.current,
              pageSize: newPagination.pageSize,
            });
            fetchProducts(newPagination.current);
          }}
          scroll={{ x: 1400 }}
          size="middle"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={
          editModal.mode === 'create' ? '➕ Thêm sản phẩm mới' :
          editModal.mode === 'edit' ? '✏️ Chỉnh sửa sản phẩm' :
          '👁️ Chi tiết sản phẩm'
        }
        open={editModal.visible}
        onCancel={() => {
          setEditModal({ visible: false, mode: 'create', product: null });
          form.resetFields();
        }}
        width={800}
        footer={editModal.mode === 'view' ? [
          <Button key="close" onClick={() => setEditModal({ visible: false, mode: 'create', product: null })}>
            Đóng
          </Button>
        ] : null}
      >
        {editModal.mode === 'view' && editModal.product ? (
          <ProductDetailView product={editModal.product} />
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Tên sản phẩm"
                  name="name"
                  rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                >
                  <Input placeholder="VD: Naruto Uzumaki Costume" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Tên nhân vật"
                  name="character_name"
                >
                  <Input placeholder="VD: Naruto Uzumaki" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Danh mục"
                  name="category_id"
                  rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                >
                  <Select placeholder="Chọn danh mục">
                    {categories.map(cat => (
                      <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item
                  label="Size"
                  name="size"
                >
                  <Select placeholder="Chọn size">
                    <Option value="XS">XS</Option>
                    <Option value="S">S</Option>
                    <Option value="M">M</Option>
                    <Option value="L">L</Option>
                    <Option value="XL">XL</Option>
                    <Option value="XXL">XXL</Option>
                    <Option value="Free Size">Free Size</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item
                  label="Tình trạng"
                  name="condition"
                  initialValue="good"
                >
                  <Select>
                    {Object.keys(conditionLabels).map(key => (
                      <Option key={key} value={key}>
                        <Tag color={conditionColors[key]}>{conditionLabels[key]}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Giá thuê (đ/ngày)"
                  name="daily_price"
                  rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    placeholder="150000"
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="Giá thuê (đ/tuần)"
                  name="weekly_price"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    placeholder="900000"
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="Tiền cọc (đ)"
                  name="deposit_amount"
                  rules={[{ required: true, message: 'Vui lòng nhập tiền cọc' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    placeholder="300000"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Tổng số lượng"
                  name="total_quantity"
                  rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                  initialValue={1}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={1}
                    placeholder="1"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Số lượng khả dụng"
                  name="available_quantity"
                  initialValue={1}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="1"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Mô tả"
              name="description"
            >
              <TextArea
                rows={4}
                placeholder="Mô tả chi tiết về sản phẩm, chất liệu, đặc điểm..."
              />
            </Form.Item>

            <Form.Item
              label="Hình ảnh (URLs)"
              name="images"
              extra="Nhập URL hình ảnh, mỗi URL trên một dòng"
            >
              <TextArea
                rows={4}
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                onChange={(e) => {
                  const urls = e.target.value.split('\n').filter(url => url.trim());
                  form.setFieldsValue({ images: urls });
                }}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" size="large">
                  {editModal.mode === 'create' ? 'Tạo sản phẩm' : 'Cập nhật'}
                </Button>
                <Button
                  size="large"
                  onClick={() => {
                    setEditModal({ visible: false, mode: 'create', product: null });
                    form.resetFields();
                  }}
                >
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Bulk Update Modal */}
      <Modal
        title="📝 Cập nhật hàng loạt"
        open={bulkModal}
        onCancel={() => {
          setBulkModal(false);
          bulkForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <p style={{ marginBottom: 16, color: '#666' }}>
          Đang cập nhật <strong>{selectedRowKeys.length}</strong> sản phẩm. 
          Chỉ các trường được điền sẽ được cập nhật.
        </p>

        <Form
          form={bulkForm}
          layout="vertical"
          onFinish={handleBulkUpdate}
        >
          <Form.Item
            label="Danh mục"
            name="category_id"
          >
            <Select placeholder="Không thay đổi" allowClear>
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Tình trạng"
            name="condition"
          >
            <Select placeholder="Không thay đổi" allowClear>
              {Object.keys(conditionLabels).map(key => (
                <Option key={key} value={key}>
                  <Tag color={conditionColors[key]}>{conditionLabels[key]}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Giá thuê (đ/ngày)"
                name="daily_price"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Không thay đổi"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Tiền cọc (đ)"
                name="deposit_amount"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Không thay đổi"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" size="large">
                Cập nhật
              </Button>
              <Button
                size="large"
                onClick={() => {
                  setBulkModal(false);
                  bulkForm.resetFields();
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

// Product Detail View Component
const ProductDetailView = ({ product }) => {
  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <div style={{ marginBottom: 16 }}>
            {product.images && product.images.length > 0 ? (
              <Image.PreviewGroup>
                {product.images.map((img, idx) => (
                  <Image
                    key={idx}
                    src={img}
                    width={idx === 0 ? '100%' : 80}
                    height={idx === 0 ? 300 : 80}
                    style={{ 
                      objectFit: 'cover', 
                      borderRadius: 8,
                      marginRight: idx > 0 ? 8 : 0,
                      marginTop: idx > 0 ? 8 : 0
                    }}
                  />
                ))}
              </Image.PreviewGroup>
            ) : (
              <div style={{ 
                width: '100%', 
                height: 300, 
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8
              }}>
                Không có hình ảnh
              </div>
            )}
          </div>
        </Col>

        <Col span={12}>
          <h3>{product.name}</h3>
          {product.character_name && (
            <p style={{ color: '#999' }}>{product.character_name}</p>
          )}
          
          <Divider />

          <div style={{ marginBottom: 12 }}>
            <strong>Danh mục:</strong> <Tag>{product.category_name}</Tag>
          </div>

          <div style={{ marginBottom: 12 }}>
            <strong>Size:</strong> {product.size ? <Tag>{product.size}</Tag> : '-'}
          </div>

          <div style={{ marginBottom: 12 }}>
            <strong>Tình trạng:</strong>{' '}
            <Tag color={
              product.condition === 'new' ? 'success' :
              product.condition === 'good' ? 'processing' :
              product.condition === 'normal' ? 'default' :
              product.condition === 'damaged' ? 'warning' : 'error'
            }>
              {product.condition === 'new' ? 'Mới' :
               product.condition === 'good' ? 'Tốt' :
               product.condition === 'normal' ? 'Bình thường' :
               product.condition === 'damaged' ? 'Hư hỏng nhẹ' : 'Hư hỏng nặng'}
            </Tag>
          </div>

          <Divider />

          <div style={{ marginBottom: 12 }}>
            <strong>Giá thuê:</strong>
            <div style={{ fontSize: 20, color: '#1890ff', marginTop: 4 }}>
              {product.daily_price.toLocaleString()}đ/ngày
            </div>
            {product.weekly_price && (
              <div style={{ fontSize: 16, color: '#52c41a' }}>
                {product.weekly_price.toLocaleString()}đ/tuần
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <strong>Tiền cọc:</strong>
            <div style={{ fontSize: 18, color: '#fa8c16', marginTop: 4 }}>
              {product.deposit_amount.toLocaleString()}đ
            </div>
          </div>

          <Divider />

          <div style={{ marginBottom: 12 }}>
            <strong>Tồn kho:</strong>
            <div style={{ marginTop: 4 }}>
              <span style={{ 
                fontSize: 24, 
                fontWeight: 'bold',
                color: product.available_quantity === 0 ? '#ff4d4f' : '#52c41a'
              }}>
                {product.available_quantity}
              </span>
              <span style={{ fontSize: 16, color: '#999' }}>
                /{product.total_quantity}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <strong>Thống kê thuê:</strong>
            <div style={{ marginTop: 4 }}>
              <div>Số lần thuê: <strong>{product.total_rentals || 0}</strong></div>
              <div>Doanh thu: <strong style={{ color: '#52c41a' }}>
                {(product.total_revenue || 0).toLocaleString()}đ
              </strong></div>
            </div>
          </div>
        </Col>
      </Row>

      {product.description && (
        <>
          <Divider />
          <div>
            <strong>Mô tả:</strong>
            <p style={{ 
              marginTop: 8, 
              padding: 12, 
              background: '#f5f5f5', 
              borderRadius: 4,
              whiteSpace: 'pre-wrap'
            }}>
              {product.description}
            </p>
          </div>
        </>
      )}

      <Divider />
      
      <div style={{ fontSize: 12, color: '#999' }}>
        <div>Ngày tạo: {new Date(product.created_at).toLocaleString('vi-VN')}</div>
        {product.updated_at && (
          <div>Cập nhật: {new Date(product.updated_at).toLocaleString('vi-VN')}</div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;