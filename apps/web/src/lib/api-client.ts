import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  withCredentials: false,
});

// Inject Bearer token from sessionStorage on client side
if (typeof window !== "undefined") {
  apiClient.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

export type ApiError = { message: string; statusCode: number };

