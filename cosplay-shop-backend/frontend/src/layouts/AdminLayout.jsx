// Path: frontend/src/layouts/AdminLayout.jsx

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, message } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  UserOutlined,
  AppstoreOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check token on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.log('❌ No token in AdminLayout, redirecting to login');
      navigate('/admin/login', { replace: true });
    } else {
      console.log('✅ Token found in AdminLayout');
    }
  }, [navigate]);

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('adminToken');
    message.success('Đã đăng xuất');
    navigate('/admin/login', { replace: true });
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Hồ sơ',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: 'Cài đặt',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/admin/dashboard'),
    },
    {
      key: '/admin/orders',
      icon: <ShoppingOutlined />,
      label: 'Đơn hàng',
      onClick: () => navigate('/admin/orders'),
    },
    {
      key: '/admin/products',
      icon: <AppstoreOutlined />,
      label: 'Sản phẩm',
      onClick: () => navigate('/admin/products'),
    },
    {
      key: '/admin/customers',
      icon: <UserOutlined />,
      label: 'Khách hàng',
      onClick: () => navigate('/admin/customers'),
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
      onClick: () => navigate('/admin/settings'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {collapsed ? '🎭' : '🎭 Cosplay Admin'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: 0 }}>Quản lý cho thuê Cosplay</h2>
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>Admin</span>
              <DownOutlined />
            </Space>
          </Dropdown>
        </Header>
        
        <Content style={{ 
          margin: '24px 16px 0', 
          overflow: 'initial',
          minHeight: 'calc(100vh - 112px)'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;