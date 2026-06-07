import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || "/api",
});

// Automatic token injection via interceptors
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem("admin-token");
    const organizerToken = localStorage.getItem("organizer-token");
    const jwtToken = localStorage.getItem("jwt_token");

    // Attach admin-token for admin, camps, or donors routes if available
    if (adminToken && (config.url.includes("/admin") || config.url.includes("/camps") || config.url.includes("/donors") || config.url.includes("/organizer-enquiry"))) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } 
    // Attach organizer-token for organizer or WhatsApp routes if available
    else if (organizerToken && (config.url.includes("/organizer") || config.url.includes("/wa"))) {
      config.headers.Authorization = `Bearer ${organizerToken}`;
    }
    // Default to donor token (jwt_token) for everything else (like /donor/health, /notifications, etc.)
    else if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
