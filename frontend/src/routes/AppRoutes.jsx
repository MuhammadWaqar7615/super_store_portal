import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import AdminLayout from '../layouts/AdminLayout';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Categories from '../pages/Categories';
import Suppliers from '../pages/Suppliers';
import Purchases from '../pages/Purchases';
import Users from '../pages/Users';
import Expenses from '../pages/Expenses';
import Income from '../pages/Income';
import Reports from '../pages/Reports';
import AccountantDashboard from '../pages/AccountantDashboard';
import Products from '../pages/Products';
import Inventory from '../pages/Inventory';
import POS from '../pages/POS';
import Receipts from '../pages/Receipts';
import RegisteredCustomers from '../pages/RegisteredCustomers';
import Settings from '../pages/Settings';
import BackupRestore from '../pages/BackupRestore';

const PrivateRoute = ({ children, allowedRoles, requiredPermission }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'Admin') return children;
  
  const hasRole = allowedRoles && allowedRoles.includes(user.role);
  const hasPermission = requiredPermission && user.permissions?.includes(requiredPermission);

  if (!hasRole && !hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Layout wrapper for authenticated routes */}
      <Route element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Inventory_Manager', 'Cashier', 'Accounts/Finance']}><AdminLayout /></PrivateRoute>}>
        <Route path="/accountant-dashboard" element={<PrivateRoute allowedRoles={['Admin', 'Accounts/Finance']} requiredPermission="income"><AccountantDashboard /></PrivateRoute>} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/categories" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Inventory_Manager', 'Cashier']} requiredPermission="categories"><Categories /></PrivateRoute>} />
        <Route path="/suppliers" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Inventory_Manager']} requiredPermission="suppliers"><Suppliers /></PrivateRoute>} />
        <Route path="/purchases" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Inventory_Manager', 'Accounts/Finance', 'Auditor']} requiredPermission="purchases"><Purchases /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute allowedRoles={['Admin']} requiredPermission="users"><Users /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute allowedRoles={['Admin']} requiredPermission="settings"><Settings /></PrivateRoute>} />
        <Route path="/backup" element={<PrivateRoute allowedRoles={['Admin']} requiredPermission="settings"><BackupRestore /></PrivateRoute>} />
        <Route path="/expenses" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Accounts/Finance', 'Auditor']} requiredPermission="expenses"><Expenses /></PrivateRoute>} />
        <Route path="/income" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Accounts/Finance', 'Auditor']} requiredPermission="income"><Income /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute allowedRoles={['Admin', 'Inventory_Manager', 'Accounts/Finance', 'Auditor']} requiredPermission="reports"><Reports /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Inventory_Manager', 'Cashier']} requiredPermission="products"><Products /></PrivateRoute>} />
        <Route path="/customers" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Cashier']} requiredPermission="customers"><RegisteredCustomers /></PrivateRoute>} />
        <Route path="/inventory" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Inventory_Manager', 'Auditor']} requiredPermission="inventory"><Inventory /></PrivateRoute>} />
        <Route path="/pos" element={<PrivateRoute allowedRoles={['Admin', 'Cashier']} requiredPermission="pos"><POS /></PrivateRoute>} />
        <Route path="/sales" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Cashier', 'Accounts/Finance', 'Auditor']} requiredPermission="sales"><Receipts /></PrivateRoute>} />
        <Route path="/receipts" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Cashier']} requiredPermission="sales"><Receipts /></PrivateRoute>} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/staff" element={<Navigate to="/dashboard" replace />} />
      <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

      {/* Unauthorized Fallback */}
      <Route path="/unauthorized" element={<div className="flex h-screen items-center justify-center text-2xl text-white bg-[#064e3b]">Unauthorized Access</div>} />

      {/* Catch-all 404 Route */}
      <Route path="*" element={<div className="flex h-screen items-center justify-center text-2xl text-white bg-[#064e3b]">404 - Page Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
