import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus, Trash2, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

const blankForm = { name: '', email: '', password: '', role: 'Cashier', isActive: true };
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

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const updates = { name: form.name, role: form.role, isActive: form.isActive };
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
    setForm({
      name: staff.name || '',
      email: staff.email,
      password: '',
      role:
        staff.role === 'Store Manager' || staff.role === 'Store-Manager'
          ? 'Store_Manager'
          : staff.role === 'Inventory Manager' || staff.role === 'Inventory-Manager'
            ? 'Inventory_Manager'
            : staff.role,
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
        <ShieldCheck className="text-[#10b981]" size={30} />
        <div><h1 className="text-3xl font-bold">Staff Users</h1><p className="text-gray-300 text-sm">Manage cashier accounts.</p></div>
      </header>
      {error && <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/15 p-3 text-red-100">{error}</div>}
      <form onSubmit={submit} className="bg-white/10 border border-white/15 rounded-2xl p-5 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
        <label className="text-sm text-gray-300">Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg bg-black/20 border border-white/20 px-3 py-2 text-white" /></label>
        {!editingId && <label className="text-sm text-gray-300">Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg bg-black/20 border border-white/20 px-3 py-2 text-white" /></label>}
        <label className="text-sm text-gray-300">Password{editingId && <span className="text-xs text-gray-500"> optional</span>}<input required={!editingId} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg bg-black/20 border border-white/20 px-3 py-2 text-white" /></label>
        <label className="text-sm text-gray-300">Role
          <select required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="mt-1 w-full rounded-lg bg-black/20 border border-white/20 px-3 py-2 text-white">
            <option value="" className="text-black">Select a role</option>
            {roles.map(role => <option key={role.value} value={role.value} className="text-black">{role.label}</option>)}
          </select>
        </label>
        {editingId && <label className="flex items-center gap-2 text-sm text-gray-300 pb-2"><input type="checkbox" checked={form.isActive} disabled={editingId === currentUser?._id} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label>}
        <div className="flex gap-2"><button disabled={saving} className="rounded-lg bg-[#10b981] px-4 py-2 font-semibold">{saving ? 'Saving...' : editingId ? 'Update' : <><UserPlus size={16} className="inline mr-1" />Add User</>}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blankForm); }} className="rounded-lg border border-white/20 px-4 py-2">Cancel</button>}</div>
      </form>
      <div className="bg-white/10 border border-white/15 rounded-2xl overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-white/5 text-left text-gray-300"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-white/10">{!loading && users.map(staff => <tr key={staff._id}><td className="p-4 flex items-center gap-2"><UserRound size={16} className="text-[#6ee7b7]" />{staff.name}</td><td className="p-4">{staff.email}</td><td className="p-4">{roleLabel(staff.role)}</td><td className="p-4"><span className={staff.isActive === false ? 'text-red-300' : 'text-green-300'}>{staff.isActive === false ? 'Inactive' : 'Active'}</span></td><td className="p-4 text-right"><button onClick={() => { setEditingId(staff._id); edit(staff); }} className="text-blue-300 mr-4">Edit</button><button disabled={staff._id === currentUser?._id} onClick={() => remove(staff)} title={staff._id === currentUser?._id ? 'You cannot delete yourself' : 'Delete user'} className="text-red-300 disabled:opacity-30"><Trash2 size={16} /></button></td></tr>)}{!loading && users.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400">No staff users found.</td></tr>}</tbody></table></div>
    </div>
  );
};

export default Users;
