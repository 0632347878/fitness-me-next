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

  let isRefreshing = false;
  let queue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

  function processQueue(err: unknown, token: string | null) {
    queue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
    queue = [];
  }

  apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;

      // Only handle 401, skip refresh endpoint itself to avoid loops
      if (error.response?.status !== 401 || original._retry || original.url?.includes("/auth/")) {
        return Promise.reject(error);
      }

      const refreshToken = sessionStorage.getItem("refreshToken");
      if (!refreshToken) {
        sessionStorage.clear();
        window.location.replace("/login");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue concurrent requests while refresh is in progress
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/auth/refresh`,
          { refreshToken },
        );

        sessionStorage.setItem("accessToken", data.accessToken);
        sessionStorage.setItem("refreshToken", data.refreshToken);

        apiClient.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        sessionStorage.clear();
        window.location.replace("/login");
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    },
  );
}

export type ApiError = { message: string; statusCode: number };

