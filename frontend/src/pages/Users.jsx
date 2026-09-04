import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus, Trash2, UserRound, CheckSquare, Square, Key, Check, Edit2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

const PERMISSIONS_LIST = [
  { key: 'dashboard', label: 'Dashboard', desc: 'Main Store Overview' },
  { key: 'pos', label: 'Point of Sale (POS)', desc: 'Process Sales Checkout' },
  { key: 'products', label: 'Store Products', desc: 'View & Manage Store Catalog' },
  { key: 'categories', label: 'Categories', desc: 'Product Categories' },
  { key: 'suppliers', label: 'Suppliers', desc: 'Manage Vendor Suppliers' },
  { key: 'purchases', label: 'Purchases', desc: 'Stock Purchase Orders' },
  { key: 'inventory', label: 'Inventory', desc: 'Warehouse Stock Control' },
  { key: 'sales', label: 'Sales & Receipts', desc: 'Sales Logs & Customer Receipts' },
  { key: 'customers', label: 'Customers', desc: 'Registered Customers' },
  { key: 'expenses', label: 'Expenses', desc: 'Financial Expenses Tracking' },
  { key: 'income', label: 'Income', desc: 'Financial Income Logs' },
  { key: 'reports', label: 'Reports & Analytics', desc: 'Store Performance Reports' },
  { key: 'users', label: 'User Management', desc: 'Create & Manage Users' },
  { key: 'settings', label: 'System Settings', desc: 'Store Configuration' },
];

const ROLE_DEFAULTS = {
  Cashier: ['dashboard', 'pos', 'products', 'categories', 'sales', 'customers'],
  Store_Manager: ['dashboard', 'pos', 'products', 'categories', 'suppliers', 'purchases', 'inventory', 'sales', 'customers', 'expenses', 'income'],
  Inventory_Manager: ['dashboard', 'products', 'categories', 'suppliers', 'purchases', 'inventory', 'reports'],
  'Accounts/Finance': ['dashboard', 'sales', 'purchases', 'expenses', 'income', 'reports'],
  Admin: ['dashboard', 'pos', 'products', 'categories', 'suppliers', 'purchases', 'inventory', 'sales', 'customers', 'expenses', 'income', 'reports', 'users', 'settings'],
};

const blankForm = {
  name: '',
  email: '',
  password: '',
  role: 'Cashier',
  permissions: ROLE_DEFAULTS.Cashier,
  isActive: true
};

const roles = [
  { value: 'Cashier', label: 'Cashier' },
  { value: 'Store_Manager', label: 'Store Manager' },
  { value: 'Inventory_Manager', label: 'Inventory Manager' },
  { value: 'Accounts/Finance', label: 'Accounts / Finance' },
  { value: 'Admin', label: 'Admin' },
];

const roleLabel = (role) => {
  if (role === 'Store_Manager' || role === 'Store-Manager' || role === 'Store Manager') return 'Store Manager';
  if (role === 'Inventory_Manager' || role === 'Inventory Manager' || role === 'Inventory-Manager') return 'Inventory Manager';
  if (role === 'Accounts/Finance') return 'Accounts / Finance';
  return role;
};

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedUserPermissions, setExpandedUserPermissions] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleChange = (newRole) => {
    setForm(prev => ({
      ...prev,
      role: newRole,
      permissions: ROLE_DEFAULTS[newRole] || []
    }));
  };

  const togglePermission = (permKey) => {
    setForm(prev => {
      const exists = prev.permissions.includes(permKey);
      const updated = exists
        ? prev.permissions.filter(k => k !== permKey)
        : [...prev.permissions, permKey];
      return { ...prev, permissions: updated };
    });
  };

  const selectAllPermissions = () => {
    setForm(prev => ({ ...prev, permissions: PERMISSIONS_LIST.map(p => p.key) }));
  };

  const clearAllPermissions = () => {
    setForm(prev => ({ ...prev, permissions: [] }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const updates = { name: form.name, role: form.role, permissions: form.permissions, isActive: form.isActive };
        if (form.password) updates.password = form.password;
        await userService.updateUser(editingId, updates);
      } else {
        await userService.createUser(form);
      }
      setForm(blankForm);
      setEditingId(null);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save user');
    } finally {
      setSaving(false);
    }
  };

  const edit = (staff) => {
    setEditingId(staff._id);
    const resolvedRole =
      staff.role === 'Store Manager' || staff.role === 'Store-Manager'
        ? 'Store_Manager'
        : staff.role === 'Inventory Manager' || staff.role === 'Inventory-Manager'
          ? 'Inventory_Manager'
          : staff.role;

    const userPerms = (staff.permissions && staff.permissions.length > 0)
      ? staff.permissions
      : (ROLE_DEFAULTS[resolvedRole] || []);

    setForm({
      name: staff.name || '',
      email: staff.email,
      password: '',
      role: resolvedRole,
      permissions: userPerms,
      isActive: staff.isActive !== false
    });
  };

  const remove = async (staff) => {
    if (staff._id === currentUser?._id || !window.confirm(`Delete ${staff.email}?`)) return;
    try {
      await userService.deleteUser(staff._id);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-[#064e3b] text-white p-6 lg:p-8 -m-4 lg:-m-8">
      <header className="flex items-center gap-3 mb-8">
        <ShieldCheck className="text-[#10b981]" size={32} />
        <div>
          <h1 className="text-3xl font-bold">Staff Users & Permissions</h1>
          <p className="text-gray-300 text-sm">Add staff users, assign roles, and customize module permissions.</p>
        </div>
      </header>

      {error && <div className="mb-6 rounded-xl border border-red-400/40 bg-red-500/15 p-4 text-red-100 flex items-center gap-2">{error}</div>}

      {/* User Form */}
      <form onSubmit={submit} className="bg-white/10 border border-white/15 rounded-2xl p-6 mb-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <UserRound className="text-[#10b981]" size={22} />
            {editingId ? 'Edit Staff Account & Permissions' : 'Add New Staff Account'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm(blankForm); }}
              className="text-xs text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="text-sm text-gray-200">
            Full Name <span className="text-red-400">*</span>
            <input
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. John Doe"
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/20 px-3.5 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981]"
            />
          </label>

          {!editingId && (
            <label className="text-sm text-gray-200">
              Email Address <span className="text-red-400">*</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="staff@superstore.com"
                className="mt-1 w-full rounded-xl bg-black/30 border border-white/20 px-3.5 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981]"
              />
            </label>
          )}

          <label className="text-sm text-gray-200">
            Password {editingId ? <span className="text-xs text-gray-400">(leave blank to keep current)</span> : <span className="text-red-400">*</span>}
            <input
              required={!editingId}
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/20 px-3.5 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981]"
            />
          </label>

          <label className="text-sm text-gray-200">
            Role <span className="text-red-400">*</span>
            <select
              required
              value={form.role}
              onChange={e => handleRoleChange(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/20 px-3.5 py-2 text-white focus:outline-none focus:border-[#10b981]"
            >
              {roles.map(role => (
                <option key={role.value} value={role.value} className="text-black">
                  {role.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Dynamic Permissions Section */}
        <div className="bg-black/20 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Key className="text-[#10b981]" size={18} />
              <span className="font-semibold text-white">Module Permissions</span>
              <span className="text-xs bg-[#10b981]/20 text-[#6ee7b7] px-2 py-0.5 rounded-full font-medium">
                {form.permissions.length} / {PERMISSIONS_LIST.length} Granted
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllPermissions}
                className="text-xs text-[#6ee7b7] hover:underline"
              >
                Select All
              </button>
              <span className="text-gray-500">|</span>
              <button
                type="button"
                onClick={clearAllPermissions}
                className="text-xs text-gray-400 hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
            {PERMISSIONS_LIST.map((perm) => {
              const isChecked = form.permissions.includes(perm.key);
              return (
                <div
                  key={perm.key}
                  onClick={() => togglePermission(perm.key)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-[#10b981]/20 border-[#10b981]/50 text-white'
                      : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/25 hover:text-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by parent div click
                    className="mt-0.5 rounded border-gray-600 accent-[#10b981] pointer-events-none"
                  />
                  <div>
                    <p className={`text-sm font-medium ${isChecked ? 'text-white' : 'text-gray-300'}`}>{perm.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{perm.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {editingId ? (
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                disabled={editingId === currentUser?._id}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
                className="rounded accent-[#10b981]"
              />
              Account Active Status
            </label>
          ) : <div />}

          <div className="flex gap-3">
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setForm(blankForm); }}
                className="rounded-xl border border-white/20 px-5 py-2.5 font-medium hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              disabled={saving}
              className="rounded-xl bg-[#10b981] hover:bg-[#059669] px-6 py-2.5 font-semibold text-white transition-colors flex items-center gap-2 shadow-lg shadow-[#10b981]/20"
            >
              {saving ? 'Saving...' : editingId ? <><Edit2 size={18} /> Update User</> : <><UserPlus size={18} /> Add User</>}
            </button>
          </div>
        </div>
      </form>

      {/* Users Table */}
      <div className="bg-white/10 border border-white/15 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <UserRound size={20} className="text-[#10b981]" />
            Staff Accounts ({users.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-gray-300 border-b border-white/10">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Assigned Permissions</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {!loading && users.map(staff => {
                const isCurrent = staff._id === currentUser?._id;
                const staffPerms = staff.permissions || ROLE_DEFAULTS[staff.role] || [];
                const isExpanded = expandedUserPermissions === staff._id;

                return (
                  <tr key={staff._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center font-bold text-xs">
                        {staff.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{staff.name}</p>
                        {isCurrent && <span className="text-[10px] bg-[#10b981]/30 text-[#6ee7b7] px-1.5 py-0.5 rounded font-mono">You</span>}
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{staff.email}</td>
                    <td className="p-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-200 border border-white/10">
                        {roleLabel(staff.role)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-xs bg-[#10b981]/20 text-[#6ee7b7] px-2.5 py-1 rounded-lg border border-[#10b981]/30 font-medium">
                          {staffPerms.length} Modules Granted
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedUserPermissions(isExpanded ? null : staff._id)}
                          className="text-xs text-blue-300 hover:underline flex items-center gap-1 ml-1"
                        >
                          <Info size={14} /> {isExpanded ? 'Hide' : 'View'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 p-2.5 bg-black/40 border border-white/10 rounded-xl flex flex-wrap gap-1.5 max-w-md">
                          {PERMISSIONS_LIST.map(p => {
                            const hasP = staffPerms.includes(p.key);
                            return (
                              <span
                                key={p.key}
                                className={`text-[11px] px-2 py-0.5 rounded-md border ${
                                  hasP
                                    ? 'bg-[#10b981]/20 border-[#10b981]/40 text-[#6ee7b7]'
                                    : 'bg-white/5 border-white/10 text-gray-500 line-through'
                                }`}
                              >
                                {p.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        staff.isActive === false ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${staff.isActive === false ? 'bg-red-400' : 'bg-emerald-400'}`} />
                        {staff.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => edit(staff)}
                        className="text-blue-300 hover:text-blue-200 font-medium mr-4"
                      >
                        Edit
                      </button>
                      <button
                        disabled={isCurrent}
                        onClick={() => remove(staff)}
                        title={isCurrent ? 'You cannot delete yourself' : 'Delete user'}
                        className="text-red-400 hover:text-red-300 disabled:opacity-30 transition-opacity"
                      >
                        <Trash2 size={16} className="inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    No staff accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
