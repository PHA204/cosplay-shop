// Path: frontend/src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import AdminLayout from './layouts/AdminLayout';
import OrderManagement from './pages/admin/OrderManagement';
import Login from './pages/admin/Login';
import ProtectedRoute from './components/ProtectedRoute';

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
            <Route index element={<Navigate to="/admin/orders" replace />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="dashboard" element={<div>Dashboard (Coming soon)</div>} />
            <Route path="products" element={<div>Products (Coming soon)</div>} />
            <Route path="customers" element={<div>Customers (Coming soon)</div>} />
            <Route path="settings" element={<div>Settings (Coming soon)</div>} />
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