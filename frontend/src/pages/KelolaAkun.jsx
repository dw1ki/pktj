import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout/Layout";

export default function KelolaAkun() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({ name: "", email: "", role: "user", password: "" });
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("accessToken");
  let API_URL = import.meta.env.VITE_API_URL;
  // Ensure API_URL always ends with /api (for user endpoints)
  if (!/\/api$/.test(API_URL)) {
    API_URL = API_URL.replace(/\/$/, '') + '/api';
  }
  const headers = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/users`, { headers });
      const userData = res.data.data || res.data;
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      const errorMsg = err.response?.data?.message || "Gagal memuat data pengguna";
      setError(errorMsg);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    } else {
      setError("Token tidak ditemukan. Silakan login terlebih dahulu.");
    }
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    
    if (!form.name || !form.email || !form.role) {
      setError("Nama, email, dan role harus diisi");
      return;
    }

    if (!editingId && !form.password) {
      setError("Password harus diisi untuk user baru");
      return;
    }

    try {
      if (editingId) {
        // Update user role (dan password jika ada)
        const updatePayload = { role: form.role };
        if (form.password && form.password.trim()) {
          updatePayload.password = form.password;
        }
        await axios.put(`${API_URL}/users/${editingId}/role`, updatePayload, { headers });
        setSuccessMsg(`Pengguna berhasil diupdate`);
      } else {
        // Create new user
        await axios.post(`${API_URL}/users`, form, { headers });
        setSuccessMsg("Pengguna baru berhasil ditambahkan");
      }
      setForm({ name: "", email: "", role: "user", password: "" });
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      console.error("Error saving user:", err);
      setError(err.response?.data?.message || "Gagal menyimpan data pengguna");
    }
  };

  const handleEdit = (user) => {
    setForm({ name: user.name, email: user.email, role: user.role, password: "" });
    setEditingId(user._id);
    setError("");
    setSuccessMsg("");
  };

  const handleCancel = () => {
    setForm({ name: "", email: "", role: "user", password: "" });
    setEditingId(null);
    setError("");
    setSuccessMsg("");
  };

  const handleDelete = async (id, userName) => {
    if (!confirm(`Apakah yakin ingin menghapus user "${userName}"?`)) return;
    setError("");
    setSuccessMsg("");
    try {
      await axios.delete(`${API_URL}/users/${id}`, { headers });
      setSuccessMsg(`User "${userName}" berhasil dihapus`);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.response?.data?.message || "Gagal menghapus user");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {/* Form Tambah/Edit */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">
            {editingId ? "Edit Pengguna" : "Tambah Pengguna Baru"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama</label>
              <input
                name="name"
                placeholder="Nama lengkap"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                name="email"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                name="password"
                type="password"
                placeholder={editingId ? "Kosongkan jika tidak diubah" : "Masukkan password"}
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                required={!editingId}
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                {editingId ? "Update Pengguna" : "Tambah Pengguna"}
              </button>
              {editingId && (
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 font-medium"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabel Users */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700">
              Daftar Pengguna {loading ? "..." : `(${users.length})`}
            </h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Memuat data pengguna...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Belum ada pengguna terdaftar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nama</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
}
