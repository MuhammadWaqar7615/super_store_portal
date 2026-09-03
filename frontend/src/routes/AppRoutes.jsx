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

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Layout wrapper for authenticated routes */}
      <Route element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Inventory_Manager', 'Cashier', 'Accounts/Finance']}><AdminLayout /></PrivateRoute>}>
        <Route path="/accountant-dashboard" element={<PrivateRoute allowedRoles={['Admin', 'Accounts/Finance']}><AccountantDashboard /></PrivateRoute>} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/categories" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Inventory_Manager', 'Cashier']}><Categories /></PrivateRoute>} />
        <Route path="/suppliers" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Inventory_Manager']}><Suppliers /></PrivateRoute>} />
        <Route path="/purchases" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Inventory_Manager', 'Accounts/Finance', 'Auditor']}><Purchases /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute allowedRoles={['Admin']}><Users /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute allowedRoles={['Admin']}><Settings /></PrivateRoute>} />
        <Route path="/expenses" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Accounts/Finance', 'Auditor']}><Expenses /></PrivateRoute>} />
        <Route path="/income" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Accounts/Finance', 'Auditor']}><Income /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute allowedRoles={['Admin', 'Inventory_Manager', 'Accounts/Finance', 'Auditor']}><Reports /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Inventory_Manager', 'Cashier']}><Products /></PrivateRoute>} />
        <Route path="/customers" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Cashier']}><RegisteredCustomers /></PrivateRoute>} />
        <Route path="/inventory" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Inventory_Manager', 'Auditor']}><Inventory /></PrivateRoute>} />
        <Route path="/pos" element={<PrivateRoute allowedRoles={['Admin', 'Cashier']}><POS /></PrivateRoute>} />
        <Route path="/sales" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Cashier', 'Accounts/Finance', 'Auditor']}><Receipts /></PrivateRoute>} />
        <Route path="/receipts" element={<PrivateRoute allowedRoles={['Admin', 'Store_Manager', 'Cashier']}><Receipts /></PrivateRoute>} />
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
