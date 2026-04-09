import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance for user service
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const userService = {
  getAllUsers: async (page = 1, limit = 10, role = null, search = null) => {
    try {
      const params = { page, limit };
      if (role) {
        params.role = role;
      }
      if (search) {
        params.search = search;
      }

      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateUserRole: async (id, role) => {
    try {
      const response = await api.put(`/users/${id}/role`, { role });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deactivateUser: async (id) => {
    try {
      const response = await api.put(`/users/${id}/deactivate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateProfile: async (name) => {
    try {
      const response = await api.put('/users/profile', { name });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getMe: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default userService;
