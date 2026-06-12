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
    const bloodBankToken = localStorage.getItem("bloodBankToken");

    // Attach admin-token for admin, camps, or donors routes if available
    if (adminToken && (config.url.includes("/admin") || config.url.includes("/camps") || config.url.includes("/donors") || config.url.includes("/organizer-enquiry") || config.url.includes("/blood-bank"))) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } 
    // Attach organizer-token for organizer or WhatsApp routes if available
    else if (organizerToken && (config.url.includes("/organizer") || config.url.includes("/wa"))) {
      config.headers.Authorization = `Bearer ${organizerToken}`;
    }
    // Attach blood bank token for blood bank routes, OTP verification routes, or notifications
    else if (bloodBankToken && (config.url.includes("/blood-banks") || config.url.includes("/blood-bank") || config.url.includes("/verify-otp") || config.url.includes("/notifications") || config.url.includes("/blood-units") || config.url.includes("/inventory"))) {
      config.headers.Authorization = `Bearer ${bloodBankToken}`;
    }
    // Default to donor token (jwt_token) for everything else (like /donor/health, /notifications, etc.)
    else if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;
    }
    // Fallback: if a generic route is hit, attach whatever token is available
    else {
      const anyToken = adminToken || organizerToken || bloodBankToken;
      if (anyToken) {
        config.headers.Authorization = `Bearer ${anyToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
