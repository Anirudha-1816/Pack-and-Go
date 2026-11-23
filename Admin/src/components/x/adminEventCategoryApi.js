import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const BASE_URL = `${API_URL}/admin/event-categories`;
const options = { withCredentials: true };

// Every function returns the server response: { success, data, message }

export const getCategories = () => axios.get(BASE_URL, options).then((res) => res.data);

export const createCategory = (body) => axios.post(BASE_URL, body, options).then((res) => res.data);

export const updateCategory = (id, body) =>
  axios.put(`${BASE_URL}/${id}`, body, options).then((res) => res.data);

export const toggleCategory = (id) =>
  axios.patch(`${BASE_URL}/${id}/toggle`, {}, options).then((res) => res.data);

// Soft delete: the server only sets isDeleted = true
export const deleteCategory = (id) => axios.delete(`${BASE_URL}/${id}`, options).then((res) => res.data);