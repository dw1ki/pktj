import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/users`;

const getToken = () => localStorage.getItem("accessToken");

export const fetchUsers = async () => {
  const { data } = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return data;
};

export const addUser = async (user) => {
  const { data } = await axios.post(API_URL, user, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return data;
};

export const updateUser = async (id, user) => {
  const { data } = await axios.put(`${API_URL}/${id}`, user, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return data;
};
