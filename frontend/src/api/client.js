import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://live-meet-app-2.onrender.com";

export const apiClient = (token) =>
  axios.create({
    baseURL: API_URL + "/api",
    headers: token ? { Authorization: "Bearer " + token } : {}
  });
