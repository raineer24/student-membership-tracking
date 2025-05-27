import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // fallback to relative path
  withCredentials: true,
});

export default api;
