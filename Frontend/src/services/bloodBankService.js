import api from "./api";

const bloodBankService = {
  // Register a new blood bank (multipart/form-data)
  registerBloodBank: async (formData) => {
    const res = await api.post("/blood-bank/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  // Login blood bank
  loginBloodBank: async (credentials) => {
    const res = await api.post("/blood-bank/login", credentials);
    return res.data;
  },

  // Verify password token
  verifyPasswordToken: async (token, email) => {
    const res = await api.get(`/blood-bank/verify-password-token?token=${token}&email=${encodeURIComponent(email)}`);
    return res.data;
  },

  // Verify invitation token
  verifyInviteToken: async (token) => {
    const res = await api.get(`/blood-bank/verify-invite?token=${token}`);
    return res.data;
  },

  // Set password using token
  setPassword: async (data) => {
    const res = await api.post(`/blood-bank/set-password`, data);
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

  // Verify OTP for a request
  verifyOtp: async (requestId, otp) => {
    const res = await api.post(`/request/${requestId}/verify-otp`, { otp });
    return res.data;
  },

  // Get assigned camp enquiries
  getCampEnquiries: async () => {
    const res = await api.get("/blood-banks/camp-enquiries");
    return res.data;
  },

  // Respond to camp assignment
  respondToCampEnquiry: async (id, status, notes, resourcesConfirmed) => {
    const res = await api.put(`/blood-banks/camp-enquiries/${id}/response`, { status, notes, resourcesConfirmed });
    return res.data;
  },

  // Get all blood units
  getBloodUnits: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const res = await api.get(`/blood-units?${params.toString()}`);
    return res.data;
  },

  // Create blood unit
  createBloodUnit: async (unitData) => {
    const res = await api.post("/blood-units/create", unitData);
    return res.data;
  },

  // Get single blood unit details
  getBloodUnitDetails: async (id) => {
    const res = await api.get(`/blood-units/${id}`);
    return res.data;
  },

  // Start testing
  startTesting: async (id) => {
    const res = await api.put(`/blood-units/${id}/testing/start`);
    return res.data;
  },

  // Update testing details
  updateTesting: async (id, testData) => {
    const res = await api.put(`/blood-units/${id}/testing/update`, testData);
    return res.data;
  },

  // Finalize testing
  finalizeTesting: async (id) => {
    const res = await api.put(`/blood-units/${id}/testing/finalize`);
    return res.data;
  },

  // Reserve unit
  reserveBloodUnit: async (id, data) => {
    const res = await api.put(`/blood-units/${id}/reserve`, data);
    return res.data;
  },

  // Issue unit
  issueBloodUnit: async (id, data) => {
    const res = await api.put(`/blood-units/${id}/issue`, data);
    return res.data;
  },

  // Mark unit used/transfused
  markUnitUsed: async (id, data) => {
    const res = await api.put(`/blood-units/${id}/used`, data);
    return res.data;
  },

  // Mark expired
  markUnitExpired: async (id) => {
    const res = await api.put(`/blood-units/${id}/expired`);
    return res.data;
  },

  // Discard unit
  discardBloodUnit: async (id, data) => {
    const res = await api.put(`/blood-units/${id}/discard`, data);
    return res.data;
  },

  // Get Inventory Summary
  getInventorySummary: async () => {
    const res = await api.get("/inventory/summary");
    return res.data;
  },

  // Get Available Units
  getAvailableUnits: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const res = await api.get(`/inventory/available-units?${params.toString()}`);
    return res.data;
  },

  // Get Public QR Details
  getPublicQRDetails: async (unitId) => {
    const res = await api.get(`/blood-units/qr/${unitId}`);
    return res.data;
  },

  // Get reports
  getReports: async () => {
    const res = await api.get("/blood-units/reports");
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
