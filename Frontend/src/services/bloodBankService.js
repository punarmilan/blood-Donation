import api from "./api";

const bloodBankService = {
  // Register a new blood bank (multipart/form-data)
  registerBloodBank: async (formData) => {
    const res = await api.post("/blood-banks/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  // Login blood bank
  loginBloodBank: async (credentials) => {
    const res = await api.post("/blood-banks/login", credentials);
    return res.data;
  },

  // Set password using token
  setPassword: async (data) => {
    const res = await api.post(`/blood-banks/set-password`, data);
    return res.data;
  },

  // Get current blood bank profile
  getProfile: async () => {
    const res = await api.get("/blood-banks/me");
    return res.data;
  },

  // Update blood bank inventory
  updateInventory: async (inventoryData) => {
    const res = await api.put("/blood-banks/inventory", inventoryData);
    return res.data;
  },

  // Get all blood requests
  getRequests: async () => {
    const res = await api.get("/blood-banks/requests");
    return res.data;
  },

  // Accept a blood request
  acceptRequest: async (requestId) => {
    const res = await api.put(`/blood-banks/requests/${requestId}/accept`);
    return res.data;
  },
};

// Also add a named export for nearby blood banks search
export const getNearbyBloodBanks = async (lat, lng, radius, bloodGroup, search) => {
  const params = new URLSearchParams();
  if (lat) params.append("lat", lat);
  if (lng) params.append("lng", lng);
  if (radius) params.append("radius", radius);
  if (bloodGroup && bloodGroup !== "All Groups") params.append("bloodGroup", bloodGroup);
  if (search) params.append("search", search);

  const res = await api.get(`/blood-banks/nearby?${params.toString()}`);
  return res.data;
};

export default bloodBankService;
