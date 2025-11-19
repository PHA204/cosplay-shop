// Path: frontend/src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import AdminLayout from './layouts/AdminLayout';
import OrderManagement from './pages/admin/OrderManagement';
import ProductManagement from './pages/admin/ProductManagement'; // Import mới
import Login from './pages/admin/Login';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerManagement from './pages/admin/CustomerManagement';
import Dashboard from  './pages/admin/Dashboard';
import Reports from './pages/admin/Reports';

function App() {
  return (
    <ConfigProvider locale={viVN}>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/admin/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="products" element={<ProductManagement />} /> 
            
            <Route path="/admin/customers" element={<CustomerManagement />} />
            <Route path="/admin/reports" element={<Reports />} />

          </Route>

          {/* Redirect root to admin */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;