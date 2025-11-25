import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const apiClient = (token) =>
  axios.create({
    baseURL: API_URL + "/api",
    headers: token ? { Authorization: "Bearer " + token } : {}
  });
