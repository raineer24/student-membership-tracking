import axios from "axios";

const isLocalhost = typeof window !== 'undefined' && window.location.origin.includes("localhost");

const api = axios.create({
  baseURL: isLocalhost ? "http://localhost:3000/api" : "/api",
  withCredentials: true, // if using cookies
});

export default api;
