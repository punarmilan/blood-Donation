import api from "./api";

const adminService = {
  login: async (email, password) => {
    const res = await api.post("/admin/login", { email, password });
    return res.data;
  },
  getOrganizers: async () => {
    const res = await api.get("/admin/organizers");
    return res.data;
  },
  getTotalUsers: async () => {
    const res = await api.get("/admin/users/count");
    return res.data.count;
  },
  getAllUsers: async () => {
    const res = await api.get("/admin/users");
    return res.data;
  },
  updateOrganizer: async (id, data) => {
    const res = await api.put(`/admin/organizers/${id}`, data);
    return res.data;
  },
  deleteOrganizer: async (id) => {
    const res = await api.delete(`/admin/organizers/${id}`);
    return res.data;
  },
  getEnquiries: async () => {
    const res = await api.get("/admin/enquiries");
    return res.data;
  },
  updateEnquiry: async (id, data) => {
    const res = await api.put(`/admin/enquiries/${id}`, data);
    return res.data;
  },
  approveEnquiry: async (id, password) => {
    const res = await api.patch(`/organizer-enquiry/${id}/approve`, password ? { password } : {});
    return res.data;
  },
  rejectEnquiry: async (id, reason) => {
    const res = await api.patch(`/organizer-enquiry/${id}/reject`, { reason });
    return res.data;
  },
  resetOrganizerPassword: async (id, password) => {
    const res = await api.put(`/admin/enquiries/${id}/reset-password`, { password });
    return res.data;
  },
  deleteEnquiry: async (id) => {
    const res = await api.delete(`/admin/enquiries/${id}`);
    return res.data;
  },
  getBloodRequests: async (params = {}) => {
    const res = await api.get("/admin/blood-requests", { params });
    return res.data;
  },
  updateBloodRequestStatus: async (id, status) => {
    const res = await api.patch(`/admin/blood-requests/${id}/status`, { status });
    return res.data;
  },
  notifyBloodRequest: async (id) => {
    const res = await api.post(`/admin/blood-requests/${id}/notify`);
    return res.data;
  },
  getBloodBanks: async (params) => {
    const res = await api.get("/blood-bank/all", { params });
    return res.data;
  },
  getPendingBloodBanks: async () => {
    const res = await api.get("/blood-bank/all?status=pending");
    return res.data;
  },
  approveBloodBank: async (id) => {
    const res = await api.put(`/blood-bank/${id}/approve`);
    return res.data;
  },
  rejectBloodBank: async (id, rejectionReason) => {
    const res = await api.put(`/blood-bank/${id}/reject`, { reason: rejectionReason });
    return res.data;
  },
  inviteBloodBank: async (inviteData) => {
    const data = {
      name: inviteData.bloodBankName,
      managerName: inviteData.managerName,
      email: inviteData.email,
      mobile: inviteData.mobile,
      city: inviteData.city,
      licenseNumber: inviteData.licenseNumber,
    };
    const res = await api.post("/blood-bank/invite", data);
    return res.data;
  },
  resendInvite: async (id) => {
    const res = await api.post(`/blood-bank/${id}/resend-invite`);
    return res.data;
  },
  suspendBloodBank: async (id, note) => {
    const res = await api.put(`/blood-bank/${id}/suspend`, { note });
    return res.data;
  },
  reactivateBloodBank: async (id) => {
    const res = await api.put(`/blood-bank/${id}/reactivate`);
    return res.data;
  },
};

export default adminService;
