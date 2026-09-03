import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
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
  User
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStoreManager = user?.role === 'Store_Manager';
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

  const financeNavItems = [
    { name: 'Dashboard (Financial)', path: '/accountant-dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Expenses', path: '/expenses', icon: <Receipt size={20} /> },
    { name: 'Income', path: '/income', icon: <TrendingUp size={20} /> },
    { name: 'Reports', path: '/reports', icon: <BarChart3 size={20} /> },
    { name: 'Sales', path: '/sales', icon: <ReceiptText size={20} /> },
    { name: 'Purchases', path: '/purchases', icon: <PackagePlus size={20} /> },
  ];

  const navItems = isFinance ? [] : [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    ...(user?.role === 'Cashier' ? [{ name: 'POS', path: '/pos', icon: <MonitorPlay size={20} /> }] : []),
    { name: 'Sales', path: '/sales', icon: <ReceiptText size={20} /> },
    { name: 'Receipts', path: '/receipts', icon: <Receipt size={20} /> },
    { name: 'Products', path: '/products', icon: <Package size={20} /> },
    { name: 'Customers', path: '/customers', icon: <UserRound size={20} /> },
    { name: 'Categories', path: '/categories', icon: <Tags size={20} /> },
  ];

  const adminNavItems = [
    { name: 'Suppliers', path: '/suppliers', icon: <Truck size={20} /> },
    { name: 'Purchases', path: '/purchases', icon: <PackagePlus size={20} /> },
    { name: 'Expenses', path: '/expenses', icon: <Receipt size={20} /> },
    { name: 'Income', path: '/income', icon: <TrendingUp size={20} /> },
    { name: 'Inventory', path: '/inventory', icon: <Warehouse size={20} /> },
  ];

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
          {navItems.map((item) => (
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

          {!isFinance && (user?.role === 'Admin' || isStoreManager) && (
            <div className="pt-4 pb-1">
              <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100 px-3 mb-2'}`}>
                <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider">Operations</p>
              </div>

              {adminNavItems.map((item) => (
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

              {user?.role === 'Admin' && (
                <>
                  <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100 px-3 mb-2 mt-4'}`}>
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider">Admin</p>
                  </div>
                  <Link
                    to="/users"
                    onClick={() => { if (window.innerWidth < 1024) setIsMobileOpen(false); }}
                    className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 mx-auto rounded-full mt-1' : 'px-3 py-2.5 rounded-xl mt-1'} transition-all group ${location.pathname === '/users' ? 'bg-[#1a2321] text-[#10b981]' : 'text-gray-300 hover:bg-[#1a1a1a] hover:text-white'}`}
                    title={isCollapsed ? 'Users' : ''}
                  >
                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                      <UsersRound size={18} />
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>
                      <span className="font-medium text-[14px]">Users</span>
                    </div>
                  </Link>
                  <Link
                    to="/reports"
                    onClick={() => { if (window.innerWidth < 1024) setIsMobileOpen(false); }}
                    className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 mx-auto rounded-full mt-1' : 'px-3 py-2.5 rounded-xl mt-1'} transition-all group ${location.pathname === '/reports' ? 'bg-[#1a2321] text-[#10b981]' : 'text-gray-300 hover:bg-[#1a1a1a] hover:text-white'}`}
                    title={isCollapsed ? 'Reports' : ''}
                  >
                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                      <BarChart3 size={18} />
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>
                      <span className="font-medium text-[14px]">Reports</span>
                    </div>
                  </Link>
                </>
              )}
            </div>
          )}

          {isFinance && (
            <div className="pt-4 pb-1">
              <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100 px-3 mb-2'}`}>
                <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider">Finance</p>
              </div>
              {financeNavItems.map((item) => (
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
