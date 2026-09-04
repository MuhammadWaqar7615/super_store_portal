import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import backupService from '../services/backupService';
import {
  LayoutDashboard,
  MonitorPlay,
  ReceiptText,
  UserRound,
  Tags,
  Package,
  Warehouse,
  Truck,
  PackagePlus,
  UsersRound,
  Receipt,
  TrendingUp,
  BarChart3,
  LogOut,
  ChevronLeft,
  Menu,
  User,
  Settings,
  Database
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStoreManager = user?.role === 'Store_Manager';
  const isInventoryManager = user?.role === 'Inventory_Manager';
  const isFinance = user?.role === 'Accounts/Finance';
  const isPOS = location.pathname === '/pos';

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  useEffect(() => {
    const autoDownloadBackup = async () => {
      if (user?.role === 'Admin' && !sessionStorage.getItem('auto_backup_downloaded')) {
        try {
          const response = await backupService.exportData();
          const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `super_store_auto_backup_${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
          sessionStorage.setItem('auto_backup_downloaded', 'true');
        } catch (error) {
          console.error('Auto backup failed', error);
        }
      }
    };
    
    if (user) {
      autoDownloadBackup();
    }
  }, [user]);

  const hasAccess = (permissionKey, defaultRoles = []) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    if (user.permissions && user.permissions.includes(permissionKey)) return true;
    if (defaultRoles.includes(user.role)) return true;
    return false;
  };

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, key: 'dashboard', roles: ['Admin', 'Store_Manager', 'Inventory_Manager', 'Cashier'] },
    { name: 'Dashboard (Financial)', path: '/accountant-dashboard', icon: <LayoutDashboard size={20} />, key: 'income', roles: ['Accounts/Finance'] },
    { name: 'POS', path: '/pos', icon: <MonitorPlay size={20} />, key: 'pos', roles: ['Admin', 'Cashier'] },
    { name: 'Sales', path: '/sales', icon: <ReceiptText size={20} />, key: 'sales', roles: ['Admin', 'Store_Manager', 'Cashier', 'Accounts/Finance'] },
    { name: 'Receipts', path: '/receipts', icon: <Receipt size={20} />, key: 'sales', roles: ['Admin', 'Store_Manager', 'Cashier'] },
    { name: 'Store Products', path: '/products', icon: <Package size={20} />, key: 'products', roles: ['Admin', 'Store_Manager', 'Inventory_Manager', 'Cashier'] },
    { name: 'Customers', path: '/customers', icon: <UserRound size={20} />, key: 'customers', roles: ['Admin', 'Store_Manager', 'Cashier'] },
    { name: 'Categories', path: '/categories', icon: <Tags size={20} />, key: 'categories', roles: ['Admin', 'Store_Manager', 'Inventory_Manager', 'Cashier'] },
  ];

  const operationsNavItems = [
    { name: 'Suppliers', path: '/suppliers', icon: <Truck size={20} />, key: 'suppliers', roles: ['Admin', 'Store_Manager', 'Inventory_Manager'] },
    { name: 'Purchases', path: '/purchases', icon: <PackagePlus size={20} />, key: 'purchases', roles: ['Admin', 'Store_Manager', 'Inventory_Manager', 'Accounts/Finance'] },
    { name: 'Inventory', path: '/inventory', icon: <Warehouse size={20} />, key: 'inventory', roles: ['Admin', 'Store_Manager', 'Inventory_Manager'] },
    { name: 'Expenses', path: '/expenses', icon: <Receipt size={20} />, key: 'expenses', roles: ['Admin', 'Store_Manager', 'Accounts/Finance'] },
    { name: 'Income', path: '/income', icon: <TrendingUp size={20} />, key: 'income', roles: ['Admin', 'Store_Manager', 'Accounts/Finance'] },
  ];

  const adminNavItems = [
    { name: 'Users', path: '/users', icon: <UsersRound size={20} />, key: 'users', roles: ['Admin'] },
    { name: 'Data Management', path: '/backup', icon: <Database size={20} />, key: 'settings', roles: ['Admin'] },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} />, key: 'settings', roles: ['Admin'] },
    { name: 'Reports', path: '/reports', icon: <BarChart3 size={20} />, key: 'reports', roles: ['Admin', 'Inventory_Manager', 'Accounts/Finance'] },
  ];

  const visibleMainItems = allNavItems.filter(item => hasAccess(item.key, item.roles));
  const visibleOpItems = operationsNavItems.filter(item => hasAccess(item.key, item.roles));
  const visibleAdminItems = adminNavItems.filter(item => hasAccess(item.key, item.roles));

  return (
    <div className="flex h-screen bg-[#064e3b] relative overflow-hidden">

      {/* Mobile Top Bar */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-14 bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center px-4 z-30">
        <button onClick={() => setIsMobileOpen(true)} className="text-white p-1">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative top-0 left-0 h-full z-50
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-[68px]' : 'w-64'}
        transition-all duration-300 bg-[#000000] text-white flex flex-col
      `}>
        {/* Top Header */}
        <div className="h-16 flex items-center px-3">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsMobileOpen(false);
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-colors flex-shrink-0"
          >
            <Menu size={20} />
          </button>

          <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-2'}`}>
            <span className="text-[18px] font-medium tracking-wide">Super Store</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
          {visibleMainItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => { if (window.innerWidth < 1024) setIsMobileOpen(false); }}
              className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 mx-auto rounded-full' : 'px-3 py-2.5 rounded-xl'} transition-all group ${location.pathname === item.path ? 'bg-[#1a2321] text-[#10b981]' : 'text-gray-300 hover:bg-[#1a1a1a] hover:text-white'}`}
              title={isCollapsed ? item.name : ""}
            >
              <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                {React.cloneElement(item.icon, { size: 18 })}
              </div>
              <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>
                <span className="font-medium text-[14px]">{item.name}</span>
              </div>
            </Link>
          ))}

          {visibleOpItems.length > 0 && (
            <div className="pt-4 pb-1">
              <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100 px-3 mb-2'}`}>
                <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider">Operations</p>
              </div>
              {visibleOpItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { if (window.innerWidth < 1024) setIsMobileOpen(false); }}
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 mx-auto rounded-full mt-1' : 'px-3 py-2.5 rounded-xl mt-1'} transition-all group ${location.pathname === item.path ? 'bg-[#1a2321] text-[#10b981]' : 'text-gray-300 hover:bg-[#1a1a1a] hover:text-white'}`}
                  title={isCollapsed ? item.name : ""}
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                    {React.cloneElement(item.icon, { size: 18 })}
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>
                    <span className="font-medium text-[14px]">{item.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {visibleAdminItems.length > 0 && (
            <div className="pt-4 pb-1">
              <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100 px-3 mb-2'}`}>
                <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider">Management</p>
              </div>
              {visibleAdminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { if (window.innerWidth < 1024) setIsMobileOpen(false); }}
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 mx-auto rounded-full mt-1' : 'px-3 py-2.5 rounded-xl mt-1'} transition-all group ${location.pathname === item.path ? 'bg-[#1a2321] text-[#10b981]' : 'text-gray-300 hover:bg-[#1a1a1a] hover:text-white'}`}
                  title={isCollapsed ? item.name : ""}
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                    {React.cloneElement(item.icon, { size: 18 })}
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>
                    <span className="font-medium text-[14px]">{item.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Footer (Profile & Logout) */}
        <div className="p-3 mb-2">
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 mx-auto rounded-full' : 'px-2 py-2 rounded-xl'} hover:bg-[#1a1a1a] cursor-pointer transition-all`}>
            <div className="w-7 h-7 flex-shrink-0 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center text-[13px] font-bold">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>
              <p className="text-[14px] font-medium text-white truncate max-w-[150px]">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className={`mt-1 w-full flex items-center ${isCollapsed ? 'justify-center w-10 h-10 mx-auto rounded-full' : 'px-2 py-2 rounded-xl'} text-red-400 hover:bg-red-500/10 transition-all`}
            title="Logout"
          >
            <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
              <LogOut size={18} />
            </div>
            <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3 text-left'}`}>
              <span className="font-medium text-[14px]">Logout</span>
            </div>
          </button>
        </div>
      </aside>

      <main className={`flex-1 overflow-auto ${isPOS ? 'pt-14 lg:pt-0' : 'pt-14 lg:pt-0 p-4 lg:p-8'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
