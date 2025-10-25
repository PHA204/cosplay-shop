// Path: frontend/src/pages/admin/Login.jsx

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      console.log('✅ Already logged in, redirecting to orders...');
      navigate('/admin/orders', { replace: true });
    }
  }, [navigate]);

  const onFinish = async (values) => {
    console.log('🔐 Login attempt with:', { email: values.email });
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Sending login request...');
      const response = await api.post('/admin/auth/login', {
        email: values.email,
        password: values.password
      });
      
      console.log('✅ Login response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        console.log('🔑 Token saved:', response.data.token.substring(0, 20) + '...');
        
        message.success('Đăng nhập thành công!');
        
        // Small delay to ensure token is saved
        setTimeout(() => {
          console.log('🔄 Navigating to /admin/orders...');
          navigate('/admin/orders', { replace: true });
        }, 100);
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Đăng nhập thất bại';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        title="🎭 Cosplay Admin Login" 
        style={{ width: 450, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
      >
        {error && (
          <Alert 
            message="Lỗi đăng nhập" 
            description={error}
            type="error" 
            closable 
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}
        
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          initialValues={{
            email: 'admin@cosplayshop.com',
            password: 'admin123'
          }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Email" 
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              loading={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ 
          textAlign: 'center', 
          color: '#999', 
          fontSize: 12, 
          marginTop: 16,
          padding: 12,
          background: '#f5f5f5',
          borderRadius: 4
        }}>
          <p style={{ margin: '4px 0' }}>
            <strong>Demo Account:</strong>
          </p>
          <p style={{ margin: '4px 0' }}>
            📧 admin@cosplayshop.com
          </p>
          <p style={{ margin: '4px 0' }}>
            🔑 admin123
          </p>
          <p style={{ margin: '8px 0 4px', color: '#666' }}>
            API: {import.meta.env.VITE_API_URL}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;