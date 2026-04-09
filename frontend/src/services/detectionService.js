import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance for detection service
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

export const detectionService = {
  uploadVideo: async (file) => {
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await api.post('/detect/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  processVideo: async (detectionId) => {
    try {
      const response = await api.post('/detect/process', {
        detectionId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getDetectionResults: async (id) => {
    try {
      const response = await api.get(`/detect/results/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getDetectionHistory: async (page = 1, limit = 10, status = null) => {
    try {
      const params = { page, limit };
      if (status) {
        params.status = status;
      }

      const response = await api.get('/detect/history', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteDetection: async (id) => {
    try {
      const response = await api.delete(`/detect/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getJobStatus: async (id) => {
    try {
      const response = await api.get(`/detect/status/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default detectionService;
